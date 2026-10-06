BEGIN;
SELECT plan(34);

-- Keep pgTAP assertions callable while tests assume the least-privilege role.
GRANT USAGE ON SCHEMA extensions TO cadence_command;

insert into private.app_users (id, clerk_subject_id, email_verified) values
  ('10000000-0000-4000-8000-000000000001', 'synthetic-clerk-owner', true),
  ('10000000-0000-4000-8000-000000000002', 'synthetic-clerk-peer', true),
  ('10000000-0000-4000-8000-000000000003', 'synthetic-clerk-outsider', true);
insert into private.workspaces (id, name) values
  ('20000000-0000-4000-8000-000000000001', 'Synthetic FSS pilot'),
  ('20000000-0000-4000-8000-000000000002', 'Synthetic other tenant');
insert into private.workspace_memberships (id, workspace_id, user_id, role) values
  ('30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'owner'),
  ('30000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000002', 'owner'),
  ('30000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000003', 'owner');
insert into private.access_policy (mode, pilot_workspace_id)
values ('closed_pilot', '20000000-0000-4000-8000-000000000001');
insert into private.pilot_identities (clerk_subject_id) values
  ('synthetic-clerk-owner'), ('synthetic-clerk-peer');
insert into private.sources (
  id, workspace_id, creator_user_id, title, category, permitted_purposes
) values (
  '40000000-0000-4000-8000-000000000001',
  '20000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  'Synthetic private draft', 'personal_draft', array['editorial_reuse']::private.source_purpose[]
);
select throws_ok(
  $$insert into private.sources (workspace_id, creator_user_id, title, category, permitted_purposes)
    values ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 'cross-tenant', 'personal_draft', array['editorial_reuse']::private.source_purpose[])$$,
  '23503', null, 'source ownership cannot cross a workspace boundary'
);
select throws_ok(
  $$insert into private.source_grants (workspace_id, source_id, recipient_user_id, purpose, granted_by_user_id)
    values ('20000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000003', 'editorial_reuse', '10000000-0000-4000-8000-000000000003')$$,
  '23503', null, 'source grants cannot cross workspace boundaries'
);

select ok(not has_schema_privilege('anon', 'private', 'USAGE'), 'anon cannot enter private schema');
select ok(not (select rolbypassrls from pg_roles where rolname = 'cadence_command'), 'command role cannot bypass RLS');
select ok(not (select rolcanlogin from pg_roles where rolname = 'cadence_command'), 'command role has no direct login');
select ok(not (select rolbypassrls from pg_roles where rolname = 'cadence_publisher'), 'publisher role cannot bypass RLS');
select ok(not (select rolcanlogin from pg_roles where rolname = 'cadence_publisher'), 'publisher role has no direct login');
select ok(not has_table_privilege('cadence_publisher', 'private.sources', 'select'),
  'publisher has no access to private sources before approved snapshots exist');
select ok(
  not has_table_privilege('cadence_command', 'private.workspace_memberships', 'update')
  and not has_table_privilege('cadence_command', 'private.access_policy', 'update')
  and not has_table_privilege('cadence_command', 'private.app_users', 'update')
  and not has_table_privilege('cadence_command', 'private.source_grants', 'update')
  and not has_table_privilege('cadence_command', 'private.workspaces', 'update'),
  'command cannot mutate memberships, auth policy, identity mappings, grants or workspaces'
);
select ok(
  has_column_privilege('cadence_command', 'private.sources', 'title', 'UPDATE')
  and not has_column_privilege('cadence_command', 'private.sources', 'permitted_purposes', 'UPDATE')
  and not has_column_privilege('cadence_command', 'private.sources', 'state', 'UPDATE')
  and not has_column_privilege('cadence_command', 'private.sources', 'access_version', 'UPDATE')
  and not has_column_privilege('cadence_command', 'private.sources', 'deleted_at', 'UPDATE')
  and not has_column_privilege('cadence_command', 'private.sources', 'state', 'INSERT')
  and not has_column_privilege('cadence_command', 'private.sources', 'access_version', 'INSERT')
  and not has_column_privilege('cadence_command', 'private.sources', 'deleted_at', 'INSERT'),
  'source commands cannot bypass sharing, erasure or lifecycle controls'
);
select ok(
  not has_table_privilege('cadence_command', 'private.erasure_ledger', 'UPDATE')
  and has_column_privilege('cadence_command', 'private.erasure_ledger', 'reason_code', 'INSERT')
  and not has_column_privilege('cadence_command', 'private.erasure_ledger', 'state', 'INSERT')
  and not has_column_privilege('cadence_command', 'private.erasure_ledger', 'completed_at', 'INSERT'),
  'commands can request erasure but cannot set its progress or claim completion'
);

set local role cadence_command;
select set_config('app.actor_id', '10000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claims', '{"sub":"synthetic-clerk-owner","role":"authenticated"}', true);
select ok((select count(*) from private.sources) = 1, 'command can read its verified actor’s own source');
select set_config('request.jwt.claims', '{"sub":"synthetic-clerk-peer","role":"authenticated"}', true);
select ok((select count(*) from private.workspaces) = 0, 'command rejects actor and Clerk subject mismatch');
select set_config('request.jwt.claims', '{}', true);
select ok((select count(*) from private.workspaces) = 0, 'command rejects missing verified identity context');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"synthetic-clerk-owner","role":"authenticated"}', true);
select ok((select count(*) from private.sources) = 1, 'creator can read their private capture');

select set_config('request.jwt.claims', '{"sub":"synthetic-clerk-peer","role":"authenticated"}', true);
select ok((select count(*) from private.sources) = 0, 'another workspace owner cannot read a private capture');
select ok((select count(*) from private.workspaces) = 1, 'workspace member can read only the pilot workspace');

select set_config('request.jwt.claims', '{"sub":"synthetic-clerk-outsider","role":"authenticated"}', true);
select ok((select count(*) from private.workspaces) = 0, 'unlisted identity cannot read a workspace');

reset role;
insert into private.source_grants (
  id, workspace_id, source_id, recipient_user_id, purpose, granted_by_user_id
) values (
  '50000000-0000-4000-8000-000000000001',
  '20000000-0000-4000-8000-000000000001',
  '40000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000002',
  'editorial_reuse',
  '10000000-0000-4000-8000-000000000001'
);
set local role cadence_command;
select set_config('app.actor_id', '10000000-0000-4000-8000-000000000002', true);
select set_config('app.access_purpose', 'editorial_reuse', true);
select set_config('request.jwt.claims', '{"sub":"synthetic-clerk-peer","role":"authenticated"}', true);
select ok((select count(*) from private.sources) = 1, 'command can read a purpose-shared source');
select set_config('app.access_purpose', 'analytics', true);
select ok((select count(*) from private.sources) = 0, 'command cannot read a source for an ungranted purpose');
reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"synthetic-clerk-peer","role":"authenticated"}', true);
select set_config('app.access_purpose', 'editorial_reuse', true);
select ok((select count(*) from private.sources) = 1, 'explicit purpose grant permits a shared capture');
select set_config('app.access_purpose', 'analytics', true);
select ok((select count(*) from private.sources) = 0, 'recipient cannot use a grant for a different purpose');
reset role;
update private.source_grants
set revoked_at = now()
where id = '50000000-0000-4000-8000-000000000001';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"synthetic-clerk-peer","role":"authenticated"}', true);
select ok((select count(*) from private.sources) = 0, 'revocation blocks later reads');
select throws_ok(
  $$insert into private.sources (workspace_id, creator_user_id, title, category, permitted_purposes)
    values ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000002', 'forbidden', 'personal_draft', array['editorial_reuse']::private.source_purpose[])$$,
  '42501', null, 'authenticated users cannot write source rows directly'
);
select ok((select count(*) from storage.objects where bucket_id = 'cadence-private') = 0,
  'private media bucket denies direct reads without an object policy');

reset role;
update private.access_policy set mode = 'require_mfa';
set local role cadence_command;
select set_config('app.actor_id', '10000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claims', '{"sub":"synthetic-clerk-owner","role":"authenticated","fva":[1,601]}', true);
select ok((select count(*) from private.workspaces) = 0, 'command rejects stale MFA assurance');
reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"synthetic-clerk-owner","role":"authenticated","fva":[-1,-1]}', true);
select ok((select count(*) from private.workspaces) = 0, 'MFA policy rejects sessions without a second factor');
select set_config('request.jwt.claims', '{"sub":"synthetic-clerk-owner","role":"authenticated","fva":[1,10]}', true);
select ok((select count(*) from private.workspaces) = 1, 'MFA policy accepts a second factor exactly ten minutes old');
select set_config('request.jwt.claims', '{"sub":"synthetic-clerk-owner","role":"authenticated","fva":[1,11]}', true);
select ok((select count(*) from private.workspaces) = 0, 'MFA policy rejects a second factor older than ten minutes');
select ok(
  (select security_settings_allowed and not workspace_allowed
     from auth_api.current_session_access()),
  'member without fresh MFA can reach only security settings'
);
select set_config('request.jwt.claims', '{"sub":"synthetic-clerk-owner","role":"authenticated","fva":[11,10]}', true);
select ok((select count(*) from private.workspaces) = 0, 'MFA policy rejects a first factor older than ten minutes');
select set_config('request.jwt.claims', '{"sub":"synthetic-clerk-owner","role":"authenticated","fva":[1,-1]}', true);
select ok((select count(*) from private.workspaces) = 0, 'MFA policy rejects a missing second factor');

reset role;
delete from private.access_policy;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"synthetic-clerk-owner","role":"authenticated","fva":[1,1]}', true);
select ok((select count(*) from private.workspaces) = 0, 'missing auth policy fails closed');
select ok(not has_schema_privilege('authenticated', 'private', 'CREATE'), 'authenticated role cannot create objects in private schema');

SELECT * FROM finish();
ROLLBACK;
