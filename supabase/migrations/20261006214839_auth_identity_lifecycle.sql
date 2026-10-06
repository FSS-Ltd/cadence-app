-- Cadence step 1.1: verified Clerk identity access and non-resurrecting lifecycle.
-- This migration stores no email, name, webhook body, or credential material.

begin;

create extension if not exists pgcrypto with schema extensions;

alter table private.app_users
  add column email_verified boolean not null default false,
  add column clerk_updated_at bigint check (clerk_updated_at >= 0),
  add column clerk_event_timestamp bigint check (clerk_event_timestamp >= 0);

create or replace function private.current_user_id()
returns uuid
language sql
stable
security invoker
set search_path = pg_catalog, private
as $$
  select u.id
  from private.app_users as u
  where u.clerk_subject_id = private.current_clerk_subject()
    and u.email_verified
    and u.disabled_at is null
$$;

-- Clerk factor verification ages (fva) are minutes, not seconds. Both the
-- first factor and (when required) second factor must be fresh.
create or replace function private.mfa_recent()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select coalesce(
    case when jsonb_typeof(auth.jwt() -> 'fva') = 'array'
      then jsonb_array_length(auth.jwt() -> 'fva') = 2 else false end
    and jsonb_typeof(auth.jwt() -> 'fva' -> 0) = 'number'
    and jsonb_typeof(auth.jwt() -> 'fva' -> 1) = 'number'
    and (auth.jwt() -> 'fva' ->> 0) ~ '^(10|[0-9])$'
    and (auth.jwt() -> 'fva' ->> 1) ~ '^(10|[0-9])$',
    false
  )
$$;

create table private.identity_webhook_receipts (
  event_id text primary key check (length(event_id) between 1 and 255),
  received_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '180 days')
);

create index identity_webhook_receipts_expiry_idx
  on private.identity_webhook_receipts (expires_at);

create table private.identity_deletion_markers (
  clerk_subject_hash bytea primary key check (octet_length(clerk_subject_hash) = 32),
  deleted_at timestamptz not null default now()
);

alter table private.identity_webhook_receipts enable row level security;
alter table private.identity_webhook_receipts force row level security;
alter table private.identity_deletion_markers enable row level security;
alter table private.identity_deletion_markers force row level security;

revoke all on private.identity_webhook_receipts, private.identity_deletion_markers
  from public, anon, authenticated, service_role;

create function private.apply_clerk_identity_event(
  p_event_id text,
  p_event_type text,
  p_clerk_subject_id text,
  p_email_verified boolean,
  p_signed_delivery_at timestamptz,
  p_updated_at bigint,
  p_event_timestamp bigint
)
returns text
language plpgsql
security definer
set search_path = pg_catalog, private, extensions
as $$
declare
  inserted_rows bigint;
  subject_hash bytea;
begin
  if p_event_id is null or length(p_event_id) not between 1 and 255
     or p_event_type is null or p_event_type not in ('user.created', 'user.updated', 'user.deleted')
     or p_clerk_subject_id is null or length(p_clerk_subject_id) not between 1 and 255
     or p_email_verified is null
     or p_updated_at is null or p_updated_at < 0
     or p_event_timestamp is null or p_event_timestamp < 0
     or p_updated_at > extract(epoch from now() + interval '1 minute') * 1000
     or p_event_timestamp > extract(epoch from now() + interval '1 minute') * 1000
     or p_signed_delivery_at is null
     or p_signed_delivery_at < now() - interval '5 minutes'
     or p_signed_delivery_at > now() + interval '1 minute' then
    raise exception 'invalid identity event' using errcode = '22023';
  end if;

  -- Serialize lifecycle events per subject so a create/update cannot race a
  -- deletion and insert an active mapping after the deletion transaction.
  perform pg_advisory_xact_lock(hashtextextended(p_clerk_subject_id, 0));

  insert into private.identity_webhook_receipts (event_id)
  values (p_event_id)
  on conflict do nothing;
  get diagnostics inserted_rows = row_count;

  if inserted_rows = 0 then
    return 'duplicate';
  end if;

  subject_hash := extensions.digest(convert_to(p_clerk_subject_id, 'UTF8'), 'sha256');

  if p_event_type = 'user.deleted' then
    insert into private.identity_deletion_markers (clerk_subject_hash)
    values (subject_hash)
    on conflict (clerk_subject_hash) do update
      set deleted_at = greatest(private.identity_deletion_markers.deleted_at, excluded.deleted_at);

    update private.app_users
       set disabled_at = coalesce(disabled_at, now())
     where clerk_subject_id = p_clerk_subject_id;

    return 'deleted';
  end if;

  if exists (
    select 1 from private.identity_deletion_markers as marker
    where marker.clerk_subject_hash = subject_hash
  ) then
    return 'deleted_identity_ignored';
  end if;

  -- Delivery timestamps change on retry. Order by the signed payload's object
  -- revision, then event timestamp for changes that share an object revision.
  -- Conflicting states at the exact same version deny verification in either
  -- arrival order. Only a strictly newer version may restore verified access.
  insert into private.app_users (
    clerk_subject_id, email_verified, clerk_updated_at, clerk_event_timestamp
  ) values (p_clerk_subject_id, p_email_verified, p_updated_at, p_event_timestamp)
  on conflict (clerk_subject_id) do update
    set email_verified = case
          when (private.app_users.clerk_updated_at, private.app_users.clerk_event_timestamp)
               = (excluded.clerk_updated_at, excluded.clerk_event_timestamp)
            then private.app_users.email_verified and excluded.email_verified
          else excluded.email_verified
        end,
        clerk_updated_at = excluded.clerk_updated_at,
        clerk_event_timestamp = excluded.clerk_event_timestamp
    where private.app_users.disabled_at is null
      and (private.app_users.clerk_updated_at is null
           or (private.app_users.clerk_updated_at, private.app_users.clerk_event_timestamp)
              <= (excluded.clerk_updated_at, excluded.clerk_event_timestamp));
  get diagnostics inserted_rows = row_count;

  return case when inserted_rows = 0 then 'stale_or_disabled_identity_ignored' else 'mapped' end;
end
$$;

-- Permit a signed-in member who has not completed MFA yet to reach only their
-- own security settings page. The function returns no identity or membership
-- data and applies the closed-pilot allow-list itself.
create function private.security_settings_access()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, private
as $$
  select exists (
    select 1
      from private.app_users as app_user
      join private.workspace_memberships as membership
        on membership.user_id = app_user.id
     where app_user.clerk_subject_id = nullif(auth.jwt() ->> 'sub', '')
       and app_user.email_verified
       and app_user.disabled_at is null
       and membership.removed_at is null
       and exists (
         select 1
           from private.access_policy as policy
          where policy.singleton
            and (
              policy.mode = 'require_mfa'
              or policy.mode = 'closed_pilot'
                 and policy.pilot_workspace_id = membership.workspace_id
                 and exists (
                   select 1
                     from private.pilot_identities as pilot
                    where pilot.clerk_subject_id = app_user.clerk_subject_id
                 )
            )
       )
  )
$$;
revoke all on function private.security_settings_access() from public, anon, authenticated, service_role;
grant execute on function private.security_settings_access() to authenticated;

revoke all on function private.apply_clerk_identity_event(text, text, text, boolean, timestamptz, bigint, bigint)
  from public, anon, authenticated, service_role;
grant execute on function private.apply_clerk_identity_event(text, text, text, boolean, timestamptz, bigint, bigint)
  to service_role;
-- The HTTP caller can resolve the one function granted above but has no table
-- privileges in the private schema.
grant usage on schema private to service_role;

-- Expose only these two narrow RPCs through PostgREST. User authorization is
-- SECURITY INVOKER and observes normal authenticated RLS. The webhook wrapper
-- is also invoker; its only privileged operation is the private function above.
create schema auth_api;
revoke all on schema auth_api from public, anon, authenticated, service_role;
grant usage on schema auth_api to authenticated, service_role;

create function auth_api.current_session_access()
returns table (
  auth_mode text,
  workspace_allowed boolean,
  security_settings_allowed boolean
)
language sql
stable
security invoker
set search_path = pg_catalog, private
as $$
  select
    policy.mode::text,
    actor.user_id is not null
      and exists (
        select 1
          from private.workspace_memberships as membership
         where membership.user_id = actor.user_id
           and membership.removed_at is null
           and (
             policy.mode = 'require_mfa'
             or membership.workspace_id = policy.pilot_workspace_id
                and private.pilot_identity_allowed()
           )
      )
      and (policy.mode = 'closed_pilot' or private.mfa_recent()),
    private.security_settings_access()
  from private.access_policy as policy
  cross join lateral (select private.current_user_id() as user_id) as actor
  where policy.singleton
$$;

create function auth_api.process_clerk_identity_event(
  p_event_id text,
  p_event_type text,
  p_clerk_subject_id text,
  p_email_verified boolean,
  p_signed_delivery_at timestamptz,
  p_updated_at bigint,
  p_event_timestamp bigint
)
returns text
language sql
security invoker
set search_path = pg_catalog, private
as $$
  select private.apply_clerk_identity_event(
    p_event_id,
    p_event_type,
    p_clerk_subject_id,
    p_email_verified,
    p_signed_delivery_at,
    p_updated_at,
    p_event_timestamp
  )
$$;

revoke all on function auth_api.current_session_access() from public, anon;
revoke all on function auth_api.process_clerk_identity_event(text, text, text, boolean, timestamptz, bigint, bigint)
  from public, anon, authenticated;
grant execute on function auth_api.current_session_access() to authenticated;
grant execute on function auth_api.process_clerk_identity_event(text, text, text, boolean, timestamptz, bigint, bigint)
  to service_role;

commit;
