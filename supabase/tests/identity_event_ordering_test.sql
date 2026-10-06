begin;
select plan(17);

set local role service_role;
select is(auth_api.process_clerk_identity_event('order-new', 'user.updated', 'synthetic-order', false, now(), 2000, 2100),
  'mapped', 'an update can arrive before the create');
select is(auth_api.process_clerk_identity_event('order-old', 'user.created', 'synthetic-order', true, now(), 1000, 1100),
  'stale_or_disabled_identity_ignored', 'older verified state cannot overwrite newer unverified state');
reset role;
select is((select email_verified from private.app_users where clerk_subject_id = 'synthetic-order'), false,
  'late verified event leaves access disabled');

set local role service_role;
select is(auth_api.process_clerk_identity_event('order-verified', 'user.updated', 'synthetic-order', true, now(), 3000, 3100),
  'mapped', 'a newer verification can restore access');
reset role;
select is((select email_verified from private.app_users where clerk_subject_id = 'synthetic-order'), true,
  'newer verification is recorded');

set local role service_role;
select is(auth_api.process_clerk_identity_event('order-tie-false', 'user.updated', 'synthetic-order', false, now(), 3000, 3100),
  'mapped', 'unverified wins when exact versions conflict');
select is(auth_api.process_clerk_identity_event('order-tie-true', 'user.updated', 'synthetic-order', true, now(), 3000, 3100),
  'mapped', 'a conflicting verified tie is handled idempotently');
reset role;
select is((select email_verified from private.app_users where clerk_subject_id = 'synthetic-order'), false,
  'a verified tie cannot restore access');

set local role service_role;
select is(auth_api.process_clerk_identity_event('order-later-event', 'user.updated', 'synthetic-order', true, now(), 3000, 3200),
  'mapped', 'event timestamp orders changes with the same object timestamp');
reset role;
select is((select email_verified from private.app_users where clerk_subject_id = 'synthetic-order'), true,
  'newer related verification state is recorded');
set local role service_role;
select is(auth_api.process_clerk_identity_event('order-earlier-event', 'user.updated', 'synthetic-order', false, now(), 3000, 3150),
  'stale_or_disabled_identity_ignored', 'older event timestamp cannot overwrite the current object version');
reset role;
select is((select email_verified from private.app_users where clerk_subject_id = 'synthetic-order'), true,
  'older unverified event leaves newer verification intact');

set local role service_role;
select is(auth_api.process_clerk_identity_event('order-delete-first', 'user.deleted', 'synthetic-deleted-first', false, now(), 4000, 4000),
  'deleted', 'deletion can arrive before any mapping');
select is(auth_api.process_clerk_identity_event('order-create-last', 'user.created', 'synthetic-deleted-first', true, now(), 1000, 1000),
  'deleted_identity_ignored', 'late create cannot insert a mapping after deletion');
reset role;
select is((select count(*) from private.app_users where clerk_subject_id = 'synthetic-deleted-first'), 0::bigint,
  'no active mapping is created for deleted identity');
set local role service_role;
select throws_ok(
  $$select auth_api.process_clerk_identity_event('order-null-type', null, 'synthetic-invalid', true, now(), 1000, 1000)$$,
  '22023', null, 'null event type fails closed at the database boundary');
select throws_ok(
  $$select auth_api.process_clerk_identity_event('order-future', 'user.updated', 'synthetic-invalid', true, now(), 9007199254740991, 9007199254740991)$$,
  '22023', null, 'future source versions cannot lock out subsequent real events');
reset role;

select * from finish();
rollback;
