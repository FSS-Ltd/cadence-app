-- Step 1.3: private text records and deliberately reviewed derivatives.
-- No media objects or live content are provisioned by this migration.
begin;

create table private.brands (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references private.workspaces(id) on delete restrict,
  name text not null check (length(btrim(name)) between 1 and 120),
  version bigint not null default 1 check (version > 0),
  access_version bigint not null default 1 check (access_version > 0),
  created_at timestamptz not null default now(),
  unique (workspace_id, id)
);
create table private.brand_playbooks (
  workspace_id uuid not null,
  brand_id uuid not null,
  version bigint not null check (version > 0),
  audience text not null check (length(audience) <= 4000),
  voice text not null check (length(voice) <= 4000),
  guidance text not null check (length(guidance) <= 8000),
  created_by_user_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (workspace_id, brand_id, version),
  foreign key (workspace_id, brand_id) references private.brands(workspace_id, id) on delete restrict,
  foreign key (workspace_id, created_by_user_id) references private.workspace_memberships(workspace_id, user_id) on delete restrict
);
create index brand_playbooks_creator_idx on private.brand_playbooks(workspace_id, created_by_user_id);
create table private.brand_assignments (
  workspace_id uuid not null,
  brand_id uuid not null,
  user_id uuid not null,
  primary key (workspace_id, brand_id, user_id),
  foreign key (workspace_id, brand_id) references private.brands(workspace_id, id) on delete restrict,
  foreign key (workspace_id, user_id) references private.workspace_memberships(workspace_id, user_id) on delete restrict
);
create index brand_assignments_user_idx on private.brand_assignments(workspace_id, user_id);

alter table private.sources
  add column brand_id uuid,
  add column content_version bigint not null default 1 check (content_version > 0),
  add column custodian_user_id uuid,
  add column client_authority_confirmed boolean not null default false,
  add column expires_at timestamptz,
  add constraint sources_brand_fk foreign key (workspace_id, brand_id) references private.brands(workspace_id, id) on delete restrict,
  add constraint sources_custodian_fk foreign key (workspace_id, custodian_user_id) references private.workspace_memberships(workspace_id, user_id) on delete restrict,
  add constraint sources_purposes_valid check (cardinality(permitted_purposes) between 1 and 4 and array_position(permitted_purposes, null) is null);
create index sources_brand_idx on private.sources(workspace_id, brand_id);
create index sources_custodian_idx on private.sources(workspace_id, custodian_user_id);
create index sources_expiry_idx on private.sources(expires_at) where expires_at is not null;

create table private.source_revisions (
  workspace_id uuid not null,
  source_id uuid not null,
  version bigint not null check (version > 0),
  title text check (length(title) between 1 and 240),
  body text check (length(body) between 1 and 50000),
  authored_by_user_id uuid not null,
  created_at timestamptz not null default now(),
  erased_at timestamptz,
  search_document tsvector generated always as (to_tsvector('simple'::regconfig, coalesce(title,'') || ' ' || coalesce(body,''))) stored,
  primary key (workspace_id, source_id, version),
  foreign key (workspace_id, source_id) references private.sources(workspace_id, id) on delete restrict,
  foreign key (workspace_id, authored_by_user_id) references private.workspace_memberships(workspace_id, user_id) on delete restrict,
  check ((erased_at is null and title is not null and body is not null) or (erased_at is not null and title is null and body is null))
);
create index source_revisions_author_idx on private.source_revisions(workspace_id, authored_by_user_id);
create index source_revisions_search_idx on private.source_revisions using gin(search_document);
-- Foundation metadata may predate text capture. Do not invent missing text.
-- Its first explicit edit creates the next revision; legacy metadata remains private.
alter table private.source_grants
  add column source_version bigint not null default 1 check (source_version > 0),
  add column access_version bigint not null default 1 check (access_version > 0);
-- Pre-text legacy grants have no reviewed text revision. Preserve their history
-- revoked; require a real tenant-matched revision for every new grant.
update private.source_grants set revoked_at = coalesce(revoked_at,now());
alter table private.source_grants add constraint source_grant_revision_fk
  foreign key (workspace_id,source_id,source_version)
  references private.source_revisions(workspace_id,source_id,version) on delete restrict not valid;

create table private.source_excerpts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  source_id uuid not null,
  source_version bigint not null,
  source_access_version bigint not null,
  reviewed_by_user_id uuid not null,
  body text check (length(body) between 1 and 10000),
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  erased_at timestamptz,
  search_document tsvector generated always as (to_tsvector('simple'::regconfig, coalesce(body,''))) stored,
  unique (workspace_id, id),
  foreign key (workspace_id, source_id, source_version) references private.source_revisions(workspace_id, source_id, version) on delete restrict,
  foreign key (workspace_id, reviewed_by_user_id) references private.workspace_memberships(workspace_id, user_id) on delete restrict,
  check ((erased_at is null) = (body is not null))
);
create index source_excerpts_source_idx on private.source_excerpts(workspace_id, source_id, source_version);
create index source_excerpts_reviewer_idx on private.source_excerpts(workspace_id, reviewed_by_user_id);
create index source_excerpts_search_idx on private.source_excerpts using gin(search_document);
create table private.excerpt_grants (
  workspace_id uuid not null,
  excerpt_id uuid not null,
  recipient_user_id uuid not null,
  purpose private.source_purpose not null,
  primary key (workspace_id, excerpt_id, recipient_user_id, purpose),
  foreign key (workspace_id, excerpt_id) references private.source_excerpts(workspace_id, id) on delete restrict,
  foreign key (workspace_id, recipient_user_id) references private.workspace_memberships(workspace_id, user_id) on delete restrict
);
create index excerpt_grants_recipient_idx on private.excerpt_grants(workspace_id, recipient_user_id);
create table private.source_recoveries (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  source_id uuid not null,
  actor_user_id uuid not null,
  custodian_user_id uuid not null,
  reason_code text not null check (reason_code in ('creator_departed','creator_disabled','custodian_departed','custodian_disabled')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '180 days'),
  foreign key (workspace_id, source_id) references private.sources(workspace_id, id) on delete restrict,
  foreign key (workspace_id, actor_user_id) references private.workspace_memberships(workspace_id, user_id) on delete restrict,
  foreign key (workspace_id, custodian_user_id) references private.workspace_memberships(workspace_id, user_id) on delete restrict
);
create index source_recoveries_source_idx on private.source_recoveries(workspace_id, source_id);
create index source_recoveries_actor_idx on private.source_recoveries(workspace_id, actor_user_id);
create index source_recoveries_custodian_idx on private.source_recoveries(workspace_id, custodian_user_id);
create index source_recoveries_expiry_idx on private.source_recoveries(expires_at);

-- Null source_id denotes whole-user erasure; non-null is resource-scoped.
alter table private.erasure_ledger add column source_id uuid,
  add constraint erasure_source_fk foreign key (workspace_id, source_id) references private.sources(workspace_id, id) on delete restrict;
create index erasure_ledger_source_idx on private.erasure_ledger(workspace_id, source_id);

alter table private.access_audit_events drop constraint access_audit_events_action_check;
alter table private.access_audit_events add constraint access_audit_events_action_check check (action in (
  'member_role','member_remove','invitation_issue','invitation_revoke','invitation_accept',
  'destination_activate','destination_disable','destination_grant','plan_assign',
  'brand_write','brand_assignment','source_create','source_revise','source_share',
  'source_revoke','excerpt_release','source_recover','source_erase'
));

-- Revoke column grants as well as table-level paths before adding commands.
revoke insert (workspace_id, creator_user_id, title, category, permitted_purposes), update (title)
  on private.sources from cadence_command;
revoke insert (workspace_id, subject_user_id, reason_code) on private.erasure_ledger from cadence_command;
drop policy source_command_insert on private.sources;
drop policy source_command_update on private.sources;
do $$
declare table_name text;
begin
  foreach table_name in array array['brands','brand_playbooks','brand_assignments',
    'source_revisions','source_excerpts','excerpt_grants','source_recoveries'] loop
    execute format('alter table private.%I enable row level security', table_name);
    execute format('alter table private.%I force row level security', table_name);
    execute format('revoke all on private.%I from public,anon,authenticated,service_role,cadence_command,cadence_operator', table_name);
  end loop;
end
$$;
commit;
