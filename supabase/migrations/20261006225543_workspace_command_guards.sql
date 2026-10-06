-- Step 1.2 shared guards. Only the identity resolver is directly callable by
-- cadence_command; mutation functions invoke the other helpers internally.
begin;

create function private.resolve_command_actor()
returns uuid language plpgsql security definer
set search_path = pg_catalog, private
as $$
declare actor_id uuid; policy private.access_policy%rowtype; claims jsonb;
begin
  select * into policy from private.access_policy where singleton;
  claims := auth.jwt();
  select id into actor_id from private.app_users
    where clerk_subject_id = nullif(claims ->> 'sub', '')
      and email_verified and disabled_at is null;
  if actor_id is null or policy.mode is null then
    raise exception 'AUTH_REQUIRED' using errcode = 'P0001';
  end if;
  if policy.mode = 'closed_pilot' and not exists (
    select 1 from private.pilot_identities where clerk_subject_id = claims ->> 'sub'
  ) then
    raise exception 'ACCESS_DENIED' using errcode = 'P0001';
  end if;
  if not coalesce(
    case when jsonb_typeof(claims -> 'fva') = 'array'
      then jsonb_array_length(claims -> 'fva') = 2 else false end
    and jsonb_typeof(claims -> 'fva' -> 0) = 'number'
    and (claims -> 'fva' ->> 0) ~ '^(10|[0-9])$', false
  ) then
    raise exception 'AUTHENTICATION_TOO_OLD' using errcode = 'P0001';
  end if;
  if policy.mode = 'require_mfa' and not private.mfa_recent() then
    raise exception 'MFA_REQUIRED' using errcode = 'P0001';
  end if;
  return actor_id;
end
$$;

create function private.lock_workspace_actor(p_workspace_id uuid)
returns uuid language plpgsql security definer
set search_path = pg_catalog, private
as $$
declare actor_id uuid;
begin
  actor_id := private.resolve_command_actor();
  if private.current_actor_id() is distinct from actor_id then
    raise exception 'ACCESS_DENIED' using errcode = 'P0001';
  end if;
  perform 1 from private.workspaces where id = p_workspace_id for update;
  if not found then
    raise exception 'ACCESS_DENIED' using errcode = 'P0001';
  end if;
  -- Recheck after waiting: identity may have been disabled while obtaining lock.
  perform private.resolve_command_actor();
  if not exists (
    select 1 from private.access_policy where singleton
      and (mode = 'require_mfa' or pilot_workspace_id = p_workspace_id)
  ) then
    raise exception 'ACCESS_DENIED' using errcode = 'P0001';
  end if;
  return actor_id;
end
$$;

create function private.require_workspace_role(p_workspace_id uuid, p_roles private.workspace_role[])
returns private.workspace_role language plpgsql security definer
set search_path = pg_catalog, private
as $$
declare actor_id uuid; actor_role private.workspace_role;
begin
  actor_id := private.lock_workspace_actor(p_workspace_id);
  select role into actor_role from private.workspace_memberships
    where workspace_id = p_workspace_id and user_id = actor_id and removed_at is null;
  if actor_role is null or not coalesce(actor_role = any(p_roles), false) then
    raise exception 'ACCESS_DENIED' using errcode = 'P0001';
  end if;
  return actor_role;
end
$$;

create function private.replay_access_command(
  p_workspace_id uuid, p_request_id uuid, p_actor_id uuid, p_action text, p_input jsonb
)
returns jsonb language plpgsql security invoker
set search_path = pg_catalog, private, extensions
as $$
declare receipt private.access_command_receipts%rowtype;
begin
  if p_request_id is null then
    raise exception 'INVALID_INPUT' using errcode = 'P0001';
  end if;
  select * into receipt from private.access_command_receipts
    where workspace_id = p_workspace_id and request_id = p_request_id;
  if not found then return null; end if;
  if receipt.actor_user_id is distinct from p_actor_id
    or receipt.action <> p_action
    or receipt.request_hash <> extensions.digest(p_input::text, 'sha256') then
    raise exception 'IDEMPOTENCY_CONFLICT' using errcode = 'P0001';
  end if;
  return receipt.response || jsonb_build_object('replayed', true);
end
$$;

create function private.complete_access_command(
  p_workspace_id uuid, p_request_id uuid, p_actor_id uuid, p_action text,
  p_input jsonb, p_resource_id uuid, p_version bigint, p_reason_code text
)
returns jsonb language plpgsql security invoker
set search_path = pg_catalog, private, extensions
as $$
declare result jsonb;
begin
  result := jsonb_build_object('id', p_resource_id, 'version', p_version, 'replayed', false);
  insert into private.access_command_receipts
    (workspace_id, request_id, actor_user_id, action, request_hash, response)
    values (p_workspace_id, p_request_id, p_actor_id, p_action,
      extensions.digest(p_input::text, 'sha256'), result);
  insert into private.access_audit_events
    (workspace_id, actor_user_id, action, resource_id, reason_code)
    values (p_workspace_id, p_actor_id, p_action, p_resource_id, p_reason_code);
  return result;
end
$$;

create function private.occupied_workspace_seats(p_workspace_id uuid)
returns bigint language sql volatile security invoker
set search_path = pg_catalog, private
as $$
  select (select count(*) from private.workspace_memberships
      where workspace_id = p_workspace_id and removed_at is null)
    + (select count(*) from private.workspace_invitations
      where workspace_id = p_workspace_id and accepted_at is null
        and revoked_at is null and expires_at > clock_timestamp())
$$;

create function private.workspace_seat_capacity(p_workspace_id uuid)
returns bigint language plpgsql stable security invoker
set search_path = pg_catalog, private
as $$
declare capacity bigint;
begin
  select catalog.included_seats::bigint + assignment.additional_seats
    into capacity from private.workspace_plan_assignments as assignment
    join private.plan_catalog_versions as catalog
      on (catalog.plan_key, catalog.version) = (assignment.plan_key, assignment.catalog_version)
    where assignment.workspace_id = p_workspace_id;
  if capacity is null then
    raise exception 'PLAN_POLICY_UNAVAILABLE' using errcode = 'P0001';
  end if;
  return capacity;
end
$$;

revoke all on function private.resolve_command_actor(), private.lock_workspace_actor(uuid),
  private.require_workspace_role(uuid, private.workspace_role[]),
  private.replay_access_command(uuid, uuid, uuid, text, jsonb),
  private.complete_access_command(uuid, uuid, uuid, text, jsonb, uuid, bigint, text),
  private.occupied_workspace_seats(uuid), private.workspace_seat_capacity(uuid)
  from public, anon, authenticated, service_role, cadence_command, cadence_operator;
grant execute on function private.resolve_command_actor() to cadence_command;

-- Apply the role matrix to the already-existing source mutation path as well.
create function private.command_can_edit_sources(p_workspace_id uuid)
returns boolean language sql stable security invoker
set search_path = pg_catalog, private
as $$
  select private.command_workspace_accessible(p_workspace_id) and exists (
    select 1 from private.workspace_memberships where workspace_id = p_workspace_id
      and user_id = private.current_actor_id() and removed_at is null
      and role in ('owner','admin','editor','publisher')
  )
$$;
revoke all on function private.command_can_edit_sources(uuid)
  from public, anon, authenticated, service_role, cadence_operator;
grant execute on function private.command_can_edit_sources(uuid) to cadence_command;
alter policy source_command_insert on private.sources
  with check (private.command_can_edit_sources(workspace_id) and creator_user_id = private.current_actor_id());
alter policy source_command_update on private.sources
  using (private.command_can_edit_sources(workspace_id) and creator_user_id = private.current_actor_id())
  with check (private.command_can_edit_sources(workspace_id) and creator_user_id = private.current_actor_id());

commit;
