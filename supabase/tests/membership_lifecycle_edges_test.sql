begin;
select plan(11);
\ir fixtures/access.sql.inc
update private.workspace_memberships set removed_at = now()
  where workspace_id = '20000000-0000-4000-8000-000000000001'
    and user_id = '10000000-0000-4000-8000-000000000005';
set local role cadence_command;
select pg_temp.as_actor(2);
select private.issue_workspace_invitation('20000000-0000-4000-8000-000000000001',gen_random_uuid(),'10000000-0000-4000-8000-000000000006','editor',repeat('a',64),24);
reset role;
update private.workspace_invitations set created_at = now() - interval '2 hours', expires_at = now() - interval '1 hour';
set local role cadence_command;
select pg_temp.as_actor(6);
select throws_ok($$select private.accept_workspace_invitation('20000000-0000-4000-8000-000000000001',gen_random_uuid(),pg_temp.invite_id(6),repeat('a',64))$$,
  'P0001','INVITATION_INVALID','expired invitation cannot be accepted');
reset role;
select is(private.occupied_workspace_seats('20000000-0000-4000-8000-000000000001'),4::bigint,'expiry releases capacity before cleanup runs');
set local role cadence_command;
select pg_temp.as_actor(2);
select lives_ok($$select private.issue_workspace_invitation('20000000-0000-4000-8000-000000000001',gen_random_uuid(),'10000000-0000-4000-8000-000000000006','editor',repeat('b',64),24)$$,
  'expired invitation can be replaced without duplicate reservation');
select pg_temp.as_actor(6);
select throws_ok($$select private.accept_workspace_invitation('20000000-0000-4000-8000-000000000001',gen_random_uuid(),pg_temp.invite_id(6),repeat('a',64))$$,
  'P0001','INVITATION_INVALID','old secret cannot accept replacement invitation');
reset role;
update private.app_users set disabled_at = now() where id = '10000000-0000-4000-8000-000000000002';
set local role cadence_command;
select pg_temp.as_actor(6);
select throws_ok($$select private.accept_workspace_invitation('20000000-0000-4000-8000-000000000001',gen_random_uuid(),pg_temp.invite_id(6),repeat('b',64))$$,
  'P0001','INVITATION_INVALID','disabled inviter cannot leave an effective access grant');
select pg_temp.as_actor(2);
select throws_ok($$select private.resolve_command_actor()$$,'P0001','AUTH_REQUIRED','disabled identity cannot resolve a command actor');
reset role;
insert into private.workspace_memberships(workspace_id,user_id,role) values
  ('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000009','owner');
update private.app_users set disabled_at = now() where id = '10000000-0000-4000-8000-000000000009';
set local role cadence_command;
select pg_temp.as_actor(1);
select throws_ok($$select private.change_workspace_member('20000000-0000-4000-8000-000000000001',gen_random_uuid(),'10000000-0000-4000-8000-000000000001',1,null)$$,
  'P0001','LAST_OWNER','disabled owner does not justify removing last usable owner');
select set_config('request.jwt.claims','{"sub":"synthetic-access-1","fva":[1,-1]}',true);
select throws_ok($$select private.resolve_command_actor()$$,'P0001','MFA_REQUIRED','public auth policy requires recent second factor');
reset role;
insert into private.pilot_identities(clerk_subject_id) values ('synthetic-access-1'),('synthetic-access-2');
update private.access_policy set mode = 'closed_pilot', pilot_workspace_id = '20000000-0000-4000-8000-000000000001';
set local role cadence_command;
select is(private.resolve_command_actor(),'10000000-0000-4000-8000-000000000001'::uuid,'pilot allows only its explicit first-factor-only exception');
select throws_ok($$select private.change_workspace_member('20000000-0000-4000-8000-000000000002',gen_random_uuid(),'10000000-0000-4000-8000-000000000008',1,null)$$,
  'P0001','ACCESS_DENIED','pilot commands cannot touch another workspace');
select pg_temp.as_actor(3);
select throws_ok($$select private.resolve_command_actor()$$,'P0001','ACCESS_DENIED','unlisted verified identity cannot use pilot exception');
reset role;
select * from finish();
rollback;
