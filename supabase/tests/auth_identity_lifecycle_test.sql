begin;
select plan(15);

select ok(
  has_function_privilege('service_role', 'auth_api.process_clerk_identity_event(text,text,text,boolean,timestamp with time zone,bigint,bigint)', 'EXECUTE')
  and not has_function_privilege('authenticated', 'auth_api.process_clerk_identity_event(text,text,text,boolean,timestamp with time zone,bigint,bigint)', 'EXECUTE'),
  'only the webhook service role can process identity events'
);

set local role service_role;
select is(
  auth_api.process_clerk_identity_event('evt-created', 'user.created', 'synthetic-new-user', true, now(), 1000, 1000),
  'mapped',
  'verified identity is mapped without copying profile fields'
);
select is(
  auth_api.process_clerk_identity_event('evt-created', 'user.created', 'synthetic-new-user', true, now(), 1000, 1000),
  'duplicate',
  'replayed delivery is idempotent'
);
select is(
  auth_api.process_clerk_identity_event('evt-unverified', 'user.updated', 'synthetic-new-user', false, now(), 2000, 2000),
  'mapped',
  'unverified email state is recorded'
);
reset role;

select is((select email_verified from private.app_users where clerk_subject_id = 'synthetic-new-user'), false,
  'unverified identities cannot retain verified access');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"synthetic-new-user","role":"authenticated"}', true);
select ok(private.current_user_id() is null, 'unverified identity has no database actor');
select ok((select count(*) from private.workspaces) = 0, 'unverified identity cannot read workspace data');
reset role;

set local role service_role;
select is(
  auth_api.process_clerk_identity_event('evt-deleted', 'user.deleted', 'synthetic-new-user', false, now(), 2000, 2000),
  'deleted',
  'deletion disables the internal identity'
);
select is(
  auth_api.process_clerk_identity_event('evt-late-create', 'user.created', 'synthetic-new-user', true, now(), 1000, 1000),
  'deleted_identity_ignored',
  'a delayed create cannot resurrect a deleted identity'
);
reset role;

select ok((select disabled_at is not null from private.app_users where clerk_subject_id = 'synthetic-new-user'),
  'deleted account remains disabled');
select ok((select count(*) from private.identity_deletion_markers) = 1,
  'deletion ledger stores only one-way subject digest');
select ok((select count(*) from private.identity_webhook_receipts) = 4,
  'each distinct signed event has one receipt');
select ok(
  not has_table_privilege('service_role', 'private.identity_webhook_receipts', 'SELECT')
  and not has_table_privilege('service_role', 'private.identity_deletion_markers', 'SELECT'),
  'service role cannot directly read webhook payload receipts or deletion markers'
);
select ok(
  not exists (
    select 1 from information_schema.columns
     where table_schema = 'private'
       and table_name = 'app_users'
       and column_name in ('email', 'email_address', 'name', 'phone_number')
  ),
  'identity mapping stores no direct contact details'
);
select throws_ok(
  $$select auth_api.process_clerk_identity_event('evt-stale', 'user.created', 'synthetic-stale', true, now() - interval '6 minutes', 1000, 1000)$$,
  '22023', null, 'stale signed event timestamp is rejected'
);

select * from finish();
rollback;
