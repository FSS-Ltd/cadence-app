-- Role changes and removals share the workspace lock with capacity admission.
begin;

-- A null new role means removal; no membership or content row is deleted.
create function private.change_workspace_member(
  p_workspace_id uuid, p_request_id uuid, p_user_id uuid,
  p_expected_version bigint, p_new_role private.workspace_role
)
returns jsonb language plpgsql security definer
set search_path = pg_catalog, private
as $$
declare
  actor_role private.workspace_role; target private.workspace_memberships%rowtype;
  input jsonb; replay jsonb; action_name text;
begin
  actor_role := private.require_workspace_role(p_workspace_id, array['owner','admin']::private.workspace_role[]);
  action_name := case when p_new_role is null then 'member_remove' else 'member_role' end;
  input := jsonb_build_array(p_user_id, p_expected_version, p_new_role);
  replay := private.replay_access_command(p_workspace_id, p_request_id, private.current_actor_id(), action_name, input);
  if replay is not null then return replay; end if;
  select * into target from private.workspace_memberships
    where workspace_id = p_workspace_id and user_id = p_user_id and removed_at is null;
  if not found then raise exception 'ACCESS_DENIED' using errcode = 'P0001'; end if;
  if actor_role <> 'owner' and (target.role = 'owner' or p_new_role = 'owner') then
    raise exception 'ACCESS_DENIED' using errcode = 'P0001';
  end if;
  if p_user_id = private.current_actor_id() and p_new_role is not null and p_new_role <> target.role then
    raise exception 'ACCESS_DENIED' using errcode = 'P0001';
  end if;
  if p_expected_version is distinct from target.version then
    raise exception 'VERSION_CONFLICT' using errcode = 'P0001';
  end if;
  if target.role = 'owner' and p_new_role is distinct from 'owner'::private.workspace_role
    and not exists (select 1 from private.workspace_memberships as other_owner
      join private.app_users as other_user on other_user.id = other_owner.user_id
      where other_owner.workspace_id = p_workspace_id and other_owner.role = 'owner'
        and other_owner.removed_at is null and other_owner.user_id <> p_user_id
        and other_user.email_verified and other_user.disabled_at is null) then
    raise exception 'LAST_OWNER' using errcode = 'P0001';
  end if;
  update private.workspace_memberships
    set role = coalesce(p_new_role, role),
        removed_at = case when p_new_role is null then clock_timestamp() else null end,
        version = version + 1
    where id = target.id;
  if p_new_role is null then
    delete from private.destination_grants where workspace_id = p_workspace_id and user_id = p_user_id;
  end if;
  return private.complete_access_command(p_workspace_id, p_request_id, private.current_actor_id(),
    action_name, input, target.id, target.version + 1, 'owner_admin_request');
end
$$;

create function private.issue_workspace_invitation(
  p_workspace_id uuid, p_request_id uuid, p_recipient_id uuid,
  p_role private.workspace_role, p_secret_hash text, p_valid_hours integer
)
returns jsonb language plpgsql security definer
set search_path = pg_catalog, private
as $$
declare actor_role private.workspace_role; invitation_id uuid; input jsonb; replay jsonb;
begin
  actor_role := private.require_workspace_role(p_workspace_id, array['owner','admin']::private.workspace_role[]);
  input := jsonb_build_array(p_recipient_id, p_role, p_valid_hours);
  replay := private.replay_access_command(p_workspace_id, p_request_id, private.current_actor_id(), 'invitation_issue', input);
  if replay is not null then return replay; end if;
  if p_role is null or not coalesce(p_secret_hash ~ '^[0-9a-f]{64}$', false)
    or p_valid_hours is null or p_valid_hours not between 1 and 168 then
    raise exception 'INVALID_INPUT' using errcode = 'P0001';
  end if;
  if (actor_role <> 'owner' and p_role = 'owner') or p_recipient_id = private.current_actor_id()
    or not exists (select 1 from private.app_users where id = p_recipient_id and email_verified and disabled_at is null)
    or exists (
      select 1 from private.access_policy where singleton and mode = 'closed_pilot'
        and not exists (select 1 from private.pilot_identities as pilot
          join private.app_users as recipient on recipient.clerk_subject_id = pilot.clerk_subject_id
          where recipient.id = p_recipient_id)
    ) then
    raise exception 'ACCESS_DENIED' using errcode = 'P0001';
  end if;
  if exists (select 1 from private.workspace_memberships where workspace_id = p_workspace_id
    and user_id = p_recipient_id and removed_at is null) then
    raise exception 'MEMBER_ALREADY_ACTIVE' using errcode = 'P0001';
  end if;
  -- Expiry releases capacity regardless of cleanup timing. Close the expired
  -- record before a replacement, retaining only its hash and minimal history.
  with expired as (
    update private.workspace_invitations set revoked_at = clock_timestamp(), version = version + 1
      where workspace_id = p_workspace_id and recipient_user_id = p_recipient_id
        and accepted_at is null and revoked_at is null and expires_at <= clock_timestamp()
      returning id
  )
  insert into private.access_audit_events(workspace_id, actor_user_id, action, resource_id, reason_code)
    select p_workspace_id, private.current_actor_id(), 'invitation_revoke', id, 'expired' from expired;
  if exists (select 1 from private.workspace_invitations where workspace_id = p_workspace_id
    and recipient_user_id = p_recipient_id and accepted_at is null and revoked_at is null) then
    raise exception 'INVITATION_PENDING' using errcode = 'P0001';
  end if;
  if private.occupied_workspace_seats(p_workspace_id) >= private.workspace_seat_capacity(p_workspace_id) then
    raise exception 'SEAT_LIMIT_REACHED' using errcode = 'P0001';
  end if;
  insert into private.workspace_invitations
    (workspace_id, recipient_user_id, role, secret_hash, invited_by_user_id, expires_at)
    values (p_workspace_id, p_recipient_id, p_role, decode(p_secret_hash, 'hex'),
      private.current_actor_id(), clock_timestamp() + make_interval(hours => p_valid_hours))
    returning id into invitation_id;
  return private.complete_access_command(p_workspace_id, p_request_id, private.current_actor_id(),
    'invitation_issue', input, invitation_id, 1, 'owner_admin_request');
end
$$;

create function private.revoke_workspace_invitation(
  p_workspace_id uuid, p_request_id uuid, p_invitation_id uuid, p_expected_version bigint
)
returns jsonb language plpgsql security definer
set search_path = pg_catalog, private
as $$
declare actor_role private.workspace_role; invitation private.workspace_invitations%rowtype; input jsonb; replay jsonb;
begin
  actor_role := private.require_workspace_role(p_workspace_id, array['owner','admin']::private.workspace_role[]);
  input := jsonb_build_array(p_invitation_id, p_expected_version);
  replay := private.replay_access_command(p_workspace_id, p_request_id, private.current_actor_id(), 'invitation_revoke', input);
  if replay is not null then return replay; end if;
  select * into invitation from private.workspace_invitations
    where workspace_id = p_workspace_id and id = p_invitation_id;
  if not found or (actor_role <> 'owner' and invitation.role = 'owner') then
    raise exception 'ACCESS_DENIED' using errcode = 'P0001';
  end if;
  if invitation.version is distinct from p_expected_version or invitation.accepted_at is not null then
    raise exception 'VERSION_CONFLICT' using errcode = 'P0001';
  end if;
  update private.workspace_invitations set revoked_at = clock_timestamp(), version = version + 1
    where id = invitation.id;
  return private.complete_access_command(p_workspace_id, p_request_id, private.current_actor_id(),
    'invitation_revoke', input, invitation.id, invitation.version + 1, 'owner_admin_request');
end
$$;

create function private.accept_workspace_invitation(
  p_workspace_id uuid, p_request_id uuid, p_invitation_id uuid, p_secret_hash text
)
returns jsonb language plpgsql security definer
set search_path = pg_catalog, private
as $$
declare
  actor_id uuid; invitation private.workspace_invitations%rowtype; inviter_role private.workspace_role;
  input jsonb; replay jsonb; member_id uuid; member_version bigint;
begin
  actor_id := private.lock_workspace_actor(p_workspace_id);
  input := jsonb_build_array(p_invitation_id, p_secret_hash);
  replay := private.replay_access_command(p_workspace_id, p_request_id, actor_id, 'invitation_accept', input);
  if replay is not null then return replay; end if;
  if not coalesce(p_secret_hash ~ '^[0-9a-f]{64}$', false) then
    raise exception 'INVITATION_INVALID' using errcode = 'P0001';
  end if;
  select * into invitation from private.workspace_invitations
    where workspace_id = p_workspace_id and id = p_invitation_id
      and recipient_user_id = actor_id and secret_hash = decode(p_secret_hash, 'hex')
      and accepted_at is null and revoked_at is null and expires_at > clock_timestamp();
  if not found then raise exception 'INVITATION_INVALID' using errcode = 'P0001'; end if;
  select member.role into inviter_role from private.workspace_memberships as member
    join private.app_users as inviter on inviter.id = member.user_id
    where member.workspace_id = p_workspace_id and member.user_id = invitation.invited_by_user_id
      and member.removed_at is null and inviter.email_verified and inviter.disabled_at is null;
  if inviter_role is null or inviter_role not in ('owner','admin')
    or (invitation.role = 'owner' and inviter_role <> 'owner') then
    raise exception 'INVITATION_INVALID' using errcode = 'P0001';
  end if;
  -- The invitation already occupies its seat; accepting does not add a second.
  if private.occupied_workspace_seats(p_workspace_id) > private.workspace_seat_capacity(p_workspace_id) then
    raise exception 'SEAT_LIMIT_REACHED' using errcode = 'P0001';
  end if;
  if exists (select 1 from private.workspace_memberships
    where workspace_id = p_workspace_id and user_id = actor_id and removed_at is null) then
    raise exception 'MEMBER_ALREADY_ACTIVE' using errcode = 'P0001';
  end if;
  insert into private.workspace_memberships(workspace_id, user_id, role)
    values(p_workspace_id, actor_id, invitation.role)
    on conflict(workspace_id, user_id) do update
      set role = excluded.role, removed_at = null, version = private.workspace_memberships.version + 1
    returning id, version into member_id, member_version;
  update private.workspace_invitations set accepted_at = clock_timestamp(), version = version + 1 where id = invitation.id;
  return private.complete_access_command(p_workspace_id, p_request_id, actor_id,
    'invitation_accept', input, member_id, member_version, 'recipient_acceptance');
end
$$;

revoke all on function
  private.change_workspace_member(uuid, uuid, uuid, bigint, private.workspace_role),
  private.issue_workspace_invitation(uuid, uuid, uuid, private.workspace_role, text, integer),
  private.revoke_workspace_invitation(uuid, uuid, uuid, bigint),
  private.accept_workspace_invitation(uuid, uuid, uuid, text)
  from public, anon, authenticated, service_role, cadence_operator;
grant execute on function
  private.change_workspace_member(uuid, uuid, uuid, bigint, private.workspace_role),
  private.issue_workspace_invitation(uuid, uuid, uuid, private.workspace_role, text, integer),
  private.revoke_workspace_invitation(uuid, uuid, uuid, bigint),
  private.accept_workspace_invitation(uuid, uuid, uuid, text)
  to cadence_command;

commit;
