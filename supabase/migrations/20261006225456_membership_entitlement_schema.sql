-- Step 1.2: private membership, capacity and destination records.
-- All mutations are through guarded commands added in the following migrations.
begin;

create role cadence_operator nologin nosuperuser nocreatedb nocreaterole noinherit nobypassrls;
grant cadence_operator to postgres;
grant usage on schema private to cadence_operator;

alter table private.workspace_memberships
  add column version bigint not null default 1 check (version > 0);

create table private.plan_catalog_versions (
  plan_key text not null check (plan_key in ('free', 'creator', 'professional', 'teams')),
  version integer not null check (version > 0),
  network_limit integer not null check (network_limit between 1 and 5),
  account_limit integer check (account_limit > 0),
  per_network_limit integer check (per_network_limit > 0),
  included_seats integer check (included_seats > 0),
  primary key (plan_key, version)
);
insert into private.plan_catalog_versions values
  ('free', 1, 3, 3, 1, null),
  ('creator', 1, 5, null, 1, null),
  ('professional', 1, 5, null, null, null),
  ('teams', 1, 5, null, null, 5);
-- Null solo seats means not yet defined, never unlimited invitation capacity.

create table private.workspace_plan_assignments (
  workspace_id uuid primary key references private.workspaces(id) on delete restrict,
  plan_key text not null,
  catalog_version integer not null,
  additional_seats integer not null default 0 check (additional_seats >= 0),
  version bigint not null default 1 check (version > 0),
  effective_at timestamptz not null default now(),
  origin text not null check (origin = 'internal_operations'),
  foreign key (plan_key, catalog_version)
    references private.plan_catalog_versions(plan_key, version) on delete restrict,
  check (plan_key = 'teams' or additional_seats = 0)
);

create table private.workspace_invitations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references private.workspaces(id) on delete restrict,
  recipient_user_id uuid not null references private.app_users(id) on delete restrict,
  role private.workspace_role not null,
  secret_hash bytea not null check (octet_length(secret_hash) = 32),
  invited_by_user_id uuid not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  version bigint not null default 1 check (version > 0),
  foreign key (workspace_id, invited_by_user_id)
    references private.workspace_memberships(workspace_id, user_id) on delete restrict,
  check (expires_at > created_at),
  check (accepted_at is null or revoked_at is null)
);
create unique index workspace_invitations_one_pending_user_idx
  on private.workspace_invitations(workspace_id, recipient_user_id)
  where accepted_at is null and revoked_at is null;
create index workspace_invitations_expiry_idx
  on private.workspace_invitations(workspace_id, expires_at)
  where accepted_at is null and revoked_at is null;
create index workspace_invitations_recipient_idx
  on private.workspace_invitations(recipient_user_id);

create table private.workspace_destinations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references private.workspaces(id) on delete restrict,
  provider text not null check (provider in ('linkedin', 'facebook', 'instagram', 'tiktok', 'x')),
  external_identity text not null check (length(external_identity) between 1 and 255),
  enabled boolean not null default true,
  version bigint not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  unique (workspace_id, id),
  unique (workspace_id, provider, external_identity)
);
-- A destination is an editorial identity, not proof of OAuth connectivity.
-- Manual and future verified OAuth routes share this same counted identity.
create index workspace_destinations_enabled_idx
  on private.workspace_destinations(workspace_id, provider) where enabled;

create table private.destination_grants (
  workspace_id uuid not null,
  destination_id uuid not null,
  user_id uuid not null,
  primary key (workspace_id, destination_id, user_id),
  foreign key (workspace_id, destination_id)
    references private.workspace_destinations(workspace_id, id) on delete restrict,
  foreign key (workspace_id, user_id)
    references private.workspace_memberships(workspace_id, user_id) on delete restrict
);
create index destination_grants_member_idx
  on private.destination_grants(workspace_id, user_id);

create table private.access_audit_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references private.workspaces(id) on delete restrict,
  actor_user_id uuid references private.app_users(id) on delete restrict,
  action text not null check (action in (
    'member_role', 'member_remove', 'invitation_issue', 'invitation_revoke',
    'invitation_accept', 'destination_activate', 'destination_disable',
    'destination_grant', 'plan_assign'
  )),
  resource_id uuid not null,
  reason_code text not null check (reason_code ~ '^[a-z][a-z0-9_]{0,79}$'),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '180 days')
);
create index access_audit_events_workspace_idx
  on private.access_audit_events(workspace_id, created_at desc);
create index access_audit_events_expiry_idx on private.access_audit_events(expires_at);

create table private.access_command_receipts (
  workspace_id uuid not null references private.workspaces(id) on delete restrict,
  request_id uuid not null,
  actor_user_id uuid references private.app_users(id) on delete restrict,
  action text not null,
  request_hash bytea not null check (octet_length(request_hash) = 32),
  response jsonb not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '180 days'),
  primary key (workspace_id, request_id)
);
create index access_command_receipts_expiry_idx on private.access_command_receipts(expires_at);

-- No direct writes, including from user-command and operator roles. Fixed-path
-- private functions explicitly authenticate/authorize each scoped mutation.
do $$
declare table_name text;
begin
  foreach table_name in array array[
    'plan_catalog_versions', 'workspace_plan_assignments', 'workspace_invitations',
    'workspace_destinations', 'destination_grants', 'access_audit_events', 'access_command_receipts'
  ] loop
    execute format('alter table private.%I enable row level security', table_name);
    execute format('alter table private.%I force row level security', table_name);
    execute format('revoke all on private.%I from public, anon, authenticated, service_role, cadence_command, cadence_operator', table_name);
  end loop;
end
$$;

commit;
