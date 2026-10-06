begin;
select plan(35);
\ir fixtures/access.sql.inc

select ok(not has_function_privilege('authenticated', 'private.change_workspace_member(uuid,uuid,uuid,bigint,private.workspace_role)', 'EXECUTE'),
  'browser role cannot bypass the server command boundary');
select ok(not has_function_privilege('cadence_command', 'private.assign_workspace_plan(uuid,uuid,bigint,text,integer,integer,uuid[],text)', 'EXECUTE'),
  'user commands cannot assign plans or grant seats');
select ok(not has_table_privilege('cadence_operator', 'private.workspace_plan_assignments', 'UPDATE'),
  'operator cannot bypass the audited assignment command');

set local role cadence_command;
select pg_temp.as_actor(3);
select throws_ok($$select private.change_workspace_member('20000000-0000-4000-8000-000000000001',gen_random_uuid(),'10000000-0000-4000-8000-000000000005',1,'admin')$$,
  'P0001','ACCESS_DENIED','editor cannot manage membership');
select pg_temp.as_actor(4);
select throws_ok($$select private.change_workspace_member('20000000-0000-4000-8000-000000000001',gen_random_uuid(),'10000000-0000-4000-8000-000000000005',1,'admin')$$,
  'P0001','ACCESS_DENIED','publisher cannot manage membership');
select pg_temp.as_actor(5);
select throws_ok($$select private.change_workspace_member('20000000-0000-4000-8000-000000000001',gen_random_uuid(),'10000000-0000-4000-8000-000000000005',1,'owner')$$,
  'P0001','ACCESS_DENIED','viewer cannot self-promote');
select throws_ok($$insert into private.sources(workspace_id,creator_user_id,title,category,permitted_purposes)
  values('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000005','synthetic viewer write','personal_draft',array['editorial_reuse']::private.source_purpose[])$$,
  '42501',null,'viewer cannot bypass the role matrix through direct source insertion');
select pg_temp.as_actor(2);
select throws_ok($$select private.change_workspace_member('20000000-0000-4000-8000-000000000001',gen_random_uuid(),'10000000-0000-4000-8000-000000000002',1,'owner')$$,
  'P0001','ACCESS_DENIED','admin cannot promote themselves');
select throws_ok($$select private.change_workspace_member('20000000-0000-4000-8000-000000000001',gen_random_uuid(),'10000000-0000-4000-8000-000000000001',1,null)$$,
  'P0001','ACCESS_DENIED','admin cannot remove owner');
select pg_temp.as_actor(1);
select throws_ok($$select private.change_workspace_member('20000000-0000-4000-8000-000000000001',gen_random_uuid(),'10000000-0000-4000-8000-000000000001',1,null)$$,
  'P0001','LAST_OWNER','last owner cannot be removed');
select throws_ok($$select private.change_workspace_member('20000000-0000-4000-8000-000000000002',gen_random_uuid(),'10000000-0000-4000-8000-000000000008',1,null)$$,
  'P0001','ACCESS_DENIED','indirect membership IDs cannot cross workspace boundaries');
select set_config('app.actor_id','10000000-0000-4000-8000-000000000002',true);
select throws_ok($$select private.change_workspace_member('20000000-0000-4000-8000-000000000001',gen_random_uuid(),'10000000-0000-4000-8000-000000000003',1,null)$$,
  'P0001','ACCESS_DENIED','forged actor context is rejected');
select pg_temp.as_actor(1);
select set_config('request.jwt.claims','{"sub":"synthetic-access-1","fva":[11,1]}',true);
select throws_ok($$select private.resolve_command_actor()$$,'P0001','AUTHENTICATION_TOO_OLD','sensitive commands require fresh first factor');
select pg_temp.as_actor(1);
select throws_ok($$select private.change_workspace_member('20000000-0000-4000-8000-000000000001',gen_random_uuid(),'10000000-0000-4000-8000-000000000003',99,null)$$,
  'P0001','VERSION_CONFLICT','stale membership edit cannot overwrite current version');
select throws_ok($$select private.issue_workspace_invitation('20000000-0000-4000-8000-000000000001',gen_random_uuid(),'10000000-0000-4000-8000-000000000006','editor',repeat('a',64),24)$$,
  'P0001','SEAT_LIMIT_REACHED','five existing members include owners and fill Teams capacity');
select is((private.change_workspace_member('20000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000003',1,null)->>'version')::bigint,
  2::bigint,'owner removes member with optimistic version');
select pg_temp.as_actor(3);
select throws_ok($$select private.activate_workspace_destination('20000000-0000-4000-8000-000000000001',gen_random_uuid(),'linkedin','synthetic',0)$$,
  'P0001','ACCESS_DENIED','removed member cannot perform later commands with an old token');
reset role;
select is((select count(*) from private.sources),1::bigint,'member removal preserves private content');
set local role authenticated;
select pg_temp.as_actor(3);
select is((select count(*) from private.sources),0::bigint,'removed member immediately loses private source reads');
select pg_temp.as_actor(1);
select is((select count(*) from private.sources),0::bigint,'owner does not inherit removed member private captures');
reset role;

set local role cadence_command;
select pg_temp.as_actor(1);
select lives_ok($$select private.issue_workspace_invitation('20000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000006','editor',repeat('a',64),24)$$,
  'invitation reserves the freed seat');
select throws_ok($$select private.issue_workspace_invitation('20000000-0000-4000-8000-000000000001',gen_random_uuid(),'10000000-0000-4000-8000-000000000007','viewer',repeat('b',64),24)$$,
  'P0001','SEAT_LIMIT_REACHED','pending invitation consumes seat before acceptance');
select ok((private.issue_workspace_invitation('20000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000006','editor',repeat('c',64),24)->>'replayed')::boolean,
  'retry returns metadata without issuing another secret or reservation');
select throws_ok($$select private.issue_workspace_invitation('20000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000007','viewer',repeat('b',64),24)$$,
  'P0001','IDEMPOTENCY_CONFLICT','request key cannot be reused for another invitation');
select pg_temp.as_actor(7);
select throws_ok($$select private.accept_workspace_invitation('20000000-0000-4000-8000-000000000001',gen_random_uuid(),pg_temp.invite_id(6),repeat('a',64))$$,
  'P0001','INVITATION_INVALID','secret does not let another identity accept');
select pg_temp.as_actor(6);
select is((private.accept_workspace_invitation('20000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000003',pg_temp.invite_id(6),repeat('a',64))->>'version')::bigint,
  1::bigint,'intended verified recipient converts reservation into membership');
select ok((private.accept_workspace_invitation('20000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000003',pg_temp.invite_id(6),repeat('a',64))->>'replayed')::boolean,
  'repeated acceptance does not duplicate membership');
reset role;
select is(private.occupied_workspace_seats('20000000-0000-4000-8000-000000000001'),5::bigint,'acceptance does not double-count capacity');

set local role cadence_operator;
select lives_ok($$select private.assign_workspace_plan('20000000-0000-4000-8000-000000000001',gen_random_uuid(),1,'teams',1,1,array[]::uuid[],'synthetic_capacity_test')$$,
  'trusted operations can grant an additional seat');
reset role;
set local role cadence_command;
select pg_temp.as_actor(1);
select lives_ok($$select private.issue_workspace_invitation('20000000-0000-4000-8000-000000000001',gen_random_uuid(),'10000000-0000-4000-8000-000000000007','viewer',repeat('b',64),24)$$,
  'sixth occupied seat requires the trusted grant');
reset role;
set local role cadence_operator;
select throws_ok($$select private.assign_workspace_plan('20000000-0000-4000-8000-000000000001',gen_random_uuid(),2,'teams',1,0,array[]::uuid[],'synthetic_capacity_test')$$,
  'P0001','SEAT_LIMIT_REACHED','capacity reduction cannot remove active or reserved members');
reset role;
set local role cadence_command;
select pg_temp.as_actor(1);
select lives_ok($$select private.revoke_workspace_invitation('20000000-0000-4000-8000-000000000001',gen_random_uuid(),pg_temp.invite_id(7),1)$$,
  'owner can revoke a pending invitation');
select pg_temp.as_actor(7);
select throws_ok($$select private.accept_workspace_invitation('20000000-0000-4000-8000-000000000001',gen_random_uuid(),pg_temp.invite_id(7),repeat('b',64))$$,
  'P0001','INVITATION_INVALID','revoked secret cannot be accepted');
reset role;
select is(private.occupied_workspace_seats('20000000-0000-4000-8000-000000000001'),5::bigint,'revocation releases the reservation');
select ok(not exists(select 1 from private.access_command_receipts where response::text like '%aaaaaaaa%'),
  'command receipts do not contain invitation secrets or hashes');
select * from finish();
rollback;
