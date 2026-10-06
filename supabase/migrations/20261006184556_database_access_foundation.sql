-- Cadence step 0.2: establish deny-by-default identity, membership, source,
-- and erasure boundaries. Real Clerk subjects and pilot configuration are
-- provisioned outside migrations; missing configuration intentionally denies.

begin;

create role cadence_command nologin nosuperuser nocreatedb nocreaterole noinherit nobypassrls;
create role cadence_publisher nologin nosuperuser nocreatedb nocreaterole noinherit nobypassrls;
-- Supabase's local pgTAP runner steps down to postgres; application logins are
-- not members and must receive separately provisioned, least-privilege access.
grant cadence_command to postgres;

create schema private;
revoke all on schema private from public, anon, authenticated, service_role;
grant usage on schema private to authenticated, cadence_command;
grant usage on schema auth to cadence_command;
grant execute on function auth.jwt() to cadence_command;

create type private.workspace_role as enum ('owner', 'admin', 'editor', 'publisher', 'viewer');
create type private.source_state as enum ('private', 'shared', 'revoked', 'erasure_pending', 'deleted');
create type private.source_category as enum ('personal_draft', 'client_confidential');
create type private.source_purpose as enum ('editorial_reuse', 'excerpt_release', 'analytics', 'ai_proposal');
create type private.auth_mode as enum ('closed_pilot', 'require_mfa');

revoke all on type private.workspace_role, private.source_state, private.source_category,
  private.source_purpose, private.auth_mode from public, anon, authenticated, service_role;
grant usage on type private.workspace_role, private.source_state, private.source_category,
  private.source_purpose, private.auth_mode to authenticated, cadence_command;

create table private.app_users (
  id uuid primary key default gen_random_uuid(),
  clerk_subject_id text not null unique check (length(clerk_subject_id) between 1 and 255),
  created_at timestamptz not null default now(),
  disabled_at timestamptz
);

create table private.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 1 and 120),
  created_at timestamptz not null default now()
);

create table private.workspace_memberships (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references private.workspaces(id) on delete restrict,
  user_id uuid not null references private.app_users(id) on delete restrict,
  role private.workspace_role not null,
  created_at timestamptz not null default now(),
  removed_at timestamptz,
  unique (workspace_id, user_id),
  unique (workspace_id, id)
);

create index workspace_memberships_active_user_idx
  on private.workspace_memberships (user_id, workspace_id)
  where removed_at is null;

create table private.access_policy (
  singleton boolean primary key default true check (singleton),
  mode private.auth_mode not null,
  pilot_workspace_id uuid references private.workspaces(id) on delete restrict,
  updated_at timestamptz not null default now(),
  check (mode <> 'closed_pilot' or pilot_workspace_id is not null)
);

create table private.pilot_identities (
  clerk_subject_id text primary key check (length(clerk_subject_id) between 1 and 255),
  created_at timestamptz not null default now()
);

create table private.sources (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  creator_user_id uuid not null,
  title text not null check (length(title) between 1 and 240),
  category private.source_category not null,
  permitted_purposes private.source_purpose[] not null check (cardinality(permitted_purposes) > 0),
  state private.source_state not null default 'private',
  access_version bigint not null default 1 check (access_version > 0),
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (workspace_id, id),
  foreign key (workspace_id, creator_user_id)
    references private.workspace_memberships (workspace_id, user_id) on delete restrict,
  check ((state = 'deleted') = (deleted_at is not null))
);

create index sources_creator_private_idx
  on private.sources (creator_user_id, workspace_id, created_at desc)
  where state = 'private';

create table private.source_grants (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  source_id uuid not null,
  recipient_user_id uuid not null,
  purpose private.source_purpose not null,
  granted_by_user_id uuid not null,
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  foreign key (workspace_id, source_id)
    references private.sources (workspace_id, id) on delete restrict,
  foreign key (workspace_id, recipient_user_id)
    references private.workspace_memberships (workspace_id, user_id) on delete restrict,
  foreign key (workspace_id, granted_by_user_id)
    references private.workspace_memberships (workspace_id, user_id) on delete restrict
);

create index source_grants_active_recipient_idx
  on private.source_grants (recipient_user_id, source_id)
  where revoked_at is null;
create unique index source_grants_one_active_purpose_idx
  on private.source_grants (source_id, recipient_user_id, purpose)
  where revoked_at is null;

create table private.erasure_ledger (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references private.workspaces(id) on delete restrict,
  subject_user_id uuid not null references private.app_users(id) on delete restrict,
  state text not null check (state in ('pending', 'in_progress', 'complete', 'blocked')),
  reason_code text not null check (length(reason_code) between 1 and 80),
  requested_at timestamptz not null default now(),
  completed_at timestamptz,
  check ((state = 'complete') = (completed_at is not null))
);

create index erasure_ledger_actor_history_idx
  on private.erasure_ledger (workspace_id, subject_user_id, requested_at desc);

create function private.enforce_pilot_identity_count()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, private
as $$
begin
  if exists (
    select 1 from private.access_policy as policy
    where policy.singleton and policy.mode = 'closed_pilot'
  ) and (select count(*) from private.pilot_identities) <> 2 then
    raise exception 'closed_pilot requires exactly two configured identities'
      using errcode = '23514';
  end if;
  return null;
end
$$;

create constraint trigger pilot_identity_count_guard
  after insert or update or delete on private.pilot_identities
  deferrable initially deferred
  for each row execute function private.enforce_pilot_identity_count();
create constraint trigger pilot_policy_count_guard
  after insert or update on private.access_policy
  deferrable initially deferred
  for each row execute function private.enforce_pilot_identity_count();

-- No policy row or pilot identity is seeded. Unknown or unconfigured auth modes
-- fail closed, and a workspace owner gains no implicit source visibility.
create function private.current_clerk_subject()
returns text
language sql
stable
security invoker
set search_path = pg_catalog
as $$
  select nullif(auth.jwt() ->> 'sub', '')
$$;

create function private.current_user_id()
returns uuid
language sql
stable
security invoker
set search_path = pg_catalog, private
as $$
  select u.id
  from private.app_users as u
  where u.clerk_subject_id = private.current_clerk_subject()
    and u.disabled_at is null
$$;

create function private.current_actor_id()
returns uuid
language sql
stable
security invoker
set search_path = pg_catalog
as $$
  select case
    when current_setting('app.actor_id', true) ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
      then current_setting('app.actor_id', true)::uuid
    else null
  end
$$;

create function private.current_access_purpose()
returns private.source_purpose
language sql
stable
security invoker
set search_path = pg_catalog
as $$
  select case current_setting('app.access_purpose', true)
    when 'editorial_reuse' then 'editorial_reuse'::private.source_purpose
    when 'excerpt_release' then 'excerpt_release'::private.source_purpose
    when 'analytics' then 'analytics'::private.source_purpose
    when 'ai_proposal' then 'ai_proposal'::private.source_purpose
    else null::private.source_purpose
  end
$$;

create function private.pilot_identity_allowed()
returns boolean
language sql
stable
security invoker
set search_path = pg_catalog, private
as $$
  select exists (
    select 1
    from private.access_policy as policy
    join private.pilot_identities as pilot
      on pilot.clerk_subject_id = private.current_clerk_subject()
    where policy.singleton
      and policy.mode = 'closed_pilot'
  )
$$;

create function private.mfa_recent()
returns boolean
language sql
stable
security invoker
set search_path = pg_catalog
as $$
  select case
    when jsonb_typeof(auth.jwt() -> 'fva') = 'array'
      and (auth.jwt() -> 'fva' ->> 1) ~ '^[0-9]+$'
      then (auth.jwt() -> 'fva' ->> 1)::integer between 0 and 600
    else false
  end
$$;

create function private.workspace_accessible(target_workspace_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = pg_catalog, private
as $$
  select exists (
    select 1
    from private.access_policy as policy
    join private.workspace_memberships as membership
      on membership.workspace_id = target_workspace_id
     and membership.user_id = private.current_user_id()
     and membership.removed_at is null
    where policy.singleton
      and (
        policy.mode = 'require_mfa'
        and private.mfa_recent()
        or (
          policy.mode = 'closed_pilot'
          and policy.pilot_workspace_id = target_workspace_id
          and private.pilot_identity_allowed()
        )
      )
  )
$$;

create function private.command_workspace_accessible(target_workspace_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = pg_catalog, private
as $$
  select exists (
    select 1
    from private.access_policy as policy
    join private.workspace_memberships as membership
      on membership.workspace_id = target_workspace_id
     and membership.user_id = private.current_actor_id()
     and membership.user_id = private.current_user_id()
     and membership.removed_at is null
    where policy.singleton
      and (
        (policy.mode = 'require_mfa' and private.mfa_recent())
        or (
          policy.mode = 'closed_pilot'
          and policy.pilot_workspace_id = target_workspace_id
          and private.pilot_identity_allowed()
        )
      )
  )
$$;

revoke all on all functions in schema private from public, anon;
grant execute on function private.current_clerk_subject() to authenticated;
grant execute on function private.current_user_id() to authenticated;
grant execute on function private.pilot_identity_allowed() to authenticated;
grant execute on function private.mfa_recent() to authenticated;
grant execute on function private.current_access_purpose() to authenticated;
grant execute on function private.workspace_accessible(uuid) to authenticated;
grant execute on function private.current_clerk_subject() to cadence_command;
grant execute on function private.current_user_id() to cadence_command;
grant execute on function private.pilot_identity_allowed() to cadence_command;
grant execute on function private.mfa_recent() to cadence_command;
grant execute on function private.current_actor_id() to cadence_command;
grant execute on function private.current_access_purpose() to cadence_command;
grant execute on function private.command_workspace_accessible(uuid) to cadence_command;

alter table private.app_users enable row level security;
alter table private.app_users force row level security;
alter table private.workspaces enable row level security;
alter table private.workspaces force row level security;
alter table private.workspace_memberships enable row level security;
alter table private.workspace_memberships force row level security;
alter table private.access_policy enable row level security;
alter table private.access_policy force row level security;
alter table private.pilot_identities enable row level security;
alter table private.pilot_identities force row level security;
alter table private.sources enable row level security;
alter table private.sources force row level security;
alter table private.source_grants enable row level security;
alter table private.source_grants force row level security;
alter table private.erasure_ledger enable row level security;
alter table private.erasure_ledger force row level security;

revoke all on private.app_users, private.workspaces, private.workspace_memberships,
  private.access_policy, private.pilot_identities, private.sources, private.source_grants,
  private.erasure_ledger from public, anon, authenticated, service_role;
grant select on private.app_users, private.workspaces, private.workspace_memberships,
  private.access_policy, private.pilot_identities, private.sources, private.source_grants
  to authenticated;
grant select on private.app_users, private.access_policy, private.pilot_identities
  to cadence_command;
grant select on private.workspaces to cadence_command;
grant select, insert, update on private.sources, private.erasure_ledger to cadence_command;
grant select on private.source_grants to cadence_command;
grant select on private.workspace_memberships to cadence_command;

create policy app_users_self_read on private.app_users
  for select to authenticated
  using (clerk_subject_id = private.current_clerk_subject() and disabled_at is null);

create policy app_users_command_read on private.app_users
  for select to cadence_command
  using (
    id = private.current_actor_id()
    and clerk_subject_id = private.current_clerk_subject()
    and disabled_at is null
  );

create policy workspaces_member_read on private.workspaces
  for select to authenticated
  using (private.workspace_accessible(id));

create policy memberships_self_read on private.workspace_memberships
  for select to authenticated
  using (
    user_id = private.current_user_id()
    and exists (
      select 1 from private.access_policy as policy
      where policy.singleton
        and (
          (policy.mode = 'require_mfa' and private.mfa_recent())
          or (
            policy.mode = 'closed_pilot'
            and policy.pilot_workspace_id = workspace_id
            and private.pilot_identity_allowed()
          )
        )
    )
  );

create policy access_policy_read on private.access_policy
  for select to authenticated using (true);

create policy access_policy_command_read on private.access_policy
  for select to cadence_command using (true);

create policy pilot_identity_self_read on private.pilot_identities
  for select to authenticated
  using (clerk_subject_id = private.current_clerk_subject());

create policy pilot_identity_command_read on private.pilot_identities
  for select to cadence_command
  using (clerk_subject_id = private.current_clerk_subject());

create policy sources_authorised_read on private.sources
  for select to authenticated
  using (
    state not in ('revoked', 'erasure_pending', 'deleted')
    and private.workspace_accessible(workspace_id)
    and (
      creator_user_id = private.current_user_id()
      or exists (
        select 1 from private.source_grants as grant_row
        where grant_row.workspace_id = sources.workspace_id
          and grant_row.source_id = sources.id
          and grant_row.recipient_user_id = private.current_user_id()
          and grant_row.revoked_at is null
          and grant_row.purpose = private.current_access_purpose()
          and grant_row.purpose = any(sources.permitted_purposes)
      )
    )
  );

create policy source_grants_participant_read on private.source_grants
  for select to authenticated
  using (
    revoked_at is null
    and private.workspace_accessible(workspace_id)
    and (
      recipient_user_id = private.current_user_id()
      or granted_by_user_id = private.current_user_id()
    )
  );

create policy workspaces_command_read on private.workspaces
  for select to cadence_command
  using (private.command_workspace_accessible(id));

create policy membership_command_access on private.workspace_memberships
  for select to cadence_command
  using (
    user_id = private.current_actor_id()
    and user_id = private.current_user_id()
    and removed_at is null
    and exists (
      select 1 from private.access_policy as policy
      where policy.singleton
        and (
          (policy.mode = 'require_mfa' and private.mfa_recent())
          or (
            policy.mode = 'closed_pilot'
            and policy.pilot_workspace_id = workspace_id
            and private.pilot_identity_allowed()
          )
        )
    )
  );

create policy sources_command_read on private.sources
  for select to cadence_command
  using (
    state not in ('revoked', 'erasure_pending', 'deleted')
    and private.command_workspace_accessible(workspace_id)
    and (
      creator_user_id = private.current_actor_id()
      or exists (
        select 1 from private.source_grants as grant_row
        where grant_row.workspace_id = sources.workspace_id
          and grant_row.source_id = sources.id
          and grant_row.recipient_user_id = private.current_actor_id()
          and grant_row.revoked_at is null
          and grant_row.purpose = private.current_access_purpose()
          and grant_row.purpose = any(sources.permitted_purposes)
      )
    )
  );

create policy source_command_insert on private.sources
  for insert to cadence_command
  with check (private.command_workspace_accessible(workspace_id)
    and creator_user_id = private.current_actor_id());

create policy source_command_update on private.sources
  for update to cadence_command
  using (private.command_workspace_accessible(workspace_id)
    and creator_user_id = private.current_actor_id())
  with check (private.command_workspace_accessible(workspace_id)
    and creator_user_id = private.current_actor_id());

create policy grant_command_read on private.source_grants
  for select to cadence_command
  using (
    revoked_at is null
    and private.command_workspace_accessible(workspace_id)
    and (
      granted_by_user_id = private.current_actor_id()
      or (
        recipient_user_id = private.current_actor_id()
        and purpose = private.current_access_purpose()
      )
    )
  );

create policy erasure_command_access on private.erasure_ledger
  for all to cadence_command
  using (
    private.command_workspace_accessible(workspace_id)
    and subject_user_id = private.current_actor_id()
  )
  with check (
    private.command_workspace_accessible(workspace_id)
    and subject_user_id = private.current_actor_id()
  );

-- Storage is provisioned private with no client policies in this foundation
-- step. Step 1.4 must add metadata-bound policies before enabling uploads.
insert into storage.buckets (id, name, public, file_size_limit)
values ('cadence-private', 'cadence-private', false, 52428800)
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit;

create policy cadence_private_bucket_denied
  on storage.objects as restrictive
  for all to anon, authenticated
  using (bucket_id <> 'cadence-private')
  with check (bucket_id <> 'cadence-private');

commit;
