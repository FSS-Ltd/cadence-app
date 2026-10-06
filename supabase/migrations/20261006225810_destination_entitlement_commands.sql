-- Destination identities are counted regardless of manual versus future API use.
begin;

create function private.check_destination_limits(
  p_workspace_id uuid, p_plan_key text, p_catalog_version integer, p_extra_provider text
)
returns void language plpgsql security invoker
set search_path = pg_catalog, private
as $$
declare limits private.plan_catalog_versions%rowtype; account_count bigint; network_count bigint; largest_network bigint;
begin
  select * into limits from private.plan_catalog_versions
    where plan_key = p_plan_key and version = p_catalog_version;
  if not found then raise exception 'PLAN_POLICY_UNAVAILABLE' using errcode = 'P0001'; end if;
  with providers as (
    select provider from private.workspace_destinations where workspace_id = p_workspace_id and enabled
    union all select p_extra_provider where p_extra_provider is not null
  ), counts as (select provider, count(*) as quantity from providers group by provider)
  select coalesce(sum(quantity),0), count(*), coalesce(max(quantity),0)
    into account_count, network_count, largest_network from counts;
  if network_count > limits.network_limit or account_count > limits.account_limit
    or largest_network > limits.per_network_limit then
    raise exception 'ACCOUNT_LIMIT_REACHED' using errcode = 'P0001';
  end if;
end
$$;

create function private.activate_workspace_destination(
  p_workspace_id uuid, p_request_id uuid, p_provider text, p_external_identity text, p_expected_version bigint
)
returns jsonb language plpgsql security definer
set search_path = pg_catalog, private
as $$
declare
  destination private.workspace_destinations%rowtype; assignment private.workspace_plan_assignments%rowtype;
  input jsonb; replay jsonb; destination_id uuid; destination_version bigint;
begin
  perform private.require_workspace_role(p_workspace_id, array['owner','admin']::private.workspace_role[]);
  input := jsonb_build_array(p_provider, p_external_identity, p_expected_version);
  replay := private.replay_access_command(p_workspace_id, p_request_id, private.current_actor_id(), 'destination_activate', input);
  if replay is not null then return replay; end if;
  if p_provider is null or p_provider not in ('linkedin','facebook','instagram','tiktok','x')
    or p_external_identity is null or length(btrim(p_external_identity)) not between 1 and 255
    or p_external_identity <> btrim(p_external_identity) or p_expected_version is null or p_expected_version < 0 then
    raise exception 'INVALID_INPUT' using errcode = 'P0001';
  end if;
  select * into assignment from private.workspace_plan_assignments where workspace_id = p_workspace_id;
  if not found then raise exception 'PLAN_POLICY_UNAVAILABLE' using errcode = 'P0001'; end if;
  select * into destination from private.workspace_destinations where workspace_id = p_workspace_id
    and provider = p_provider and external_identity = p_external_identity;
  if coalesce(destination.version, 0) <> p_expected_version then
    raise exception 'VERSION_CONFLICT' using errcode = 'P0001';
  end if;
  if destination.id is null or not destination.enabled then
    perform private.check_destination_limits(p_workspace_id, assignment.plan_key, assignment.catalog_version, p_provider);
    insert into private.workspace_destinations(workspace_id, provider, external_identity)
      values (p_workspace_id, p_provider, p_external_identity)
      on conflict(workspace_id, provider, external_identity) do update
        set enabled = true, version = private.workspace_destinations.version + 1
      returning id, version into destination_id, destination_version;
  else
    -- Reconnecting an enabled identity keeps its existing slot and stable ID.
    destination_id := destination.id;
    destination_version := destination.version;
  end if;
  return private.complete_access_command(p_workspace_id, p_request_id, private.current_actor_id(),
    'destination_activate', input, destination_id, destination_version, 'owner_admin_request');
end
$$;

create function private.disable_workspace_destination(
  p_workspace_id uuid, p_request_id uuid, p_destination_id uuid, p_expected_version bigint
)
returns jsonb language plpgsql security definer
set search_path = pg_catalog, private
as $$
declare destination private.workspace_destinations%rowtype; input jsonb; replay jsonb;
begin
  perform private.require_workspace_role(p_workspace_id, array['owner','admin']::private.workspace_role[]);
  input := jsonb_build_array(p_destination_id, p_expected_version);
  replay := private.replay_access_command(p_workspace_id, p_request_id, private.current_actor_id(), 'destination_disable', input);
  if replay is not null then return replay; end if;
  select * into destination from private.workspace_destinations
    where workspace_id = p_workspace_id and id = p_destination_id;
  if not found then raise exception 'ACCESS_DENIED' using errcode = 'P0001'; end if;
  if destination.version is distinct from p_expected_version then
    raise exception 'VERSION_CONFLICT' using errcode = 'P0001';
  end if;
  update private.workspace_destinations set enabled = false, version = version + 1 where id = destination.id;
  return private.complete_access_command(p_workspace_id, p_request_id, private.current_actor_id(),
    'destination_disable', input, destination.id, destination.version + 1, 'owner_admin_request');
end
$$;

create function private.set_destination_grant(
  p_workspace_id uuid, p_request_id uuid, p_destination_id uuid,
  p_user_id uuid, p_expected_version bigint, p_allowed boolean
)
returns jsonb language plpgsql security definer
set search_path = pg_catalog, private
as $$
declare destination private.workspace_destinations%rowtype; input jsonb; replay jsonb;
begin
  perform private.require_workspace_role(p_workspace_id, array['owner','admin']::private.workspace_role[]);
  input := jsonb_build_array(p_destination_id, p_user_id, p_expected_version, p_allowed);
  replay := private.replay_access_command(p_workspace_id, p_request_id, private.current_actor_id(), 'destination_grant', input);
  if replay is not null then return replay; end if;
  select * into destination from private.workspace_destinations
    where workspace_id = p_workspace_id and id = p_destination_id;
  if not found or p_allowed is null or p_user_id = private.current_actor_id()
    or not exists (select 1 from private.workspace_memberships
      where workspace_id = p_workspace_id and user_id = p_user_id and removed_at is null) then
    raise exception 'ACCESS_DENIED' using errcode = 'P0001';
  end if;
  if destination.version is distinct from p_expected_version then
    raise exception 'VERSION_CONFLICT' using errcode = 'P0001';
  end if;
  if p_allowed then
    insert into private.destination_grants(workspace_id, destination_id, user_id)
      values (p_workspace_id, p_destination_id, p_user_id) on conflict do nothing;
  else
    delete from private.destination_grants where workspace_id = p_workspace_id
      and destination_id = p_destination_id and user_id = p_user_id;
  end if;
  update private.workspace_destinations set version = version + 1 where id = destination.id;
  return private.complete_access_command(p_workspace_id, p_request_id, private.current_actor_id(),
    'destination_grant', input, destination.id, destination.version + 1, 'owner_admin_request');
end
$$;

-- Reading destination metadata is separate from permission to publish. Later
-- publishing commands must also check live role, enabled state and approval.
create function private.destination_visible(p_workspace_id uuid, p_destination_id uuid)
returns boolean language sql stable security definer
set search_path = pg_catalog, private
as $$
  select private.workspace_accessible(p_workspace_id) and exists (
    select 1 from private.workspace_memberships as member
    where member.workspace_id = p_workspace_id and member.user_id = private.current_user_id()
      and member.removed_at is null and (member.role in ('owner','admin') or exists (
        select 1 from private.destination_grants as permission where permission.workspace_id = p_workspace_id
          and permission.destination_id = p_destination_id and permission.user_id = member.user_id
      ))
  )
$$;

revoke all on function private.check_destination_limits(uuid, text, integer, text),
  private.activate_workspace_destination(uuid, uuid, text, text, bigint),
  private.disable_workspace_destination(uuid, uuid, uuid, bigint),
  private.set_destination_grant(uuid, uuid, uuid, uuid, bigint, boolean),
  private.destination_visible(uuid, uuid)
  from public, anon, authenticated, service_role, cadence_command, cadence_operator;
grant execute on function private.activate_workspace_destination(uuid, uuid, text, text, bigint),
  private.disable_workspace_destination(uuid, uuid, uuid, bigint),
  private.set_destination_grant(uuid, uuid, uuid, uuid, bigint, boolean)
  to cadence_command;
grant execute on function private.destination_visible(uuid, uuid) to authenticated, cadence_command;
grant select on private.workspace_destinations to authenticated, cadence_command;
create policy destinations_member_read on private.workspace_destinations for select to authenticated
  using (private.destination_visible(workspace_id, id));
create policy destinations_command_read on private.workspace_destinations for select to cadence_command
  using (private.current_actor_id() = private.current_user_id() and private.destination_visible(workspace_id, id));

commit;
