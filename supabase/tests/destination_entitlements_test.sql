begin;
select plan(29);
\ir fixtures/access.sql.inc

set local role cadence_operator;
select lives_ok($$select private.assign_workspace_plan('20000000-0000-4000-8000-000000000001',gen_random_uuid(),1,'free',1,0,array[]::uuid[],'synthetic_plan_test')$$,
  'trusted operations can assign Free without inventing a solo seat policy');
reset role;
set local role cadence_command;
select pg_temp.as_actor(1);
select lives_ok($$select private.activate_workspace_destination('20000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000011','linkedin','synthetic-linkedin',0)$$,
  'Free admits a manual LinkedIn destination');
select lives_ok($$select private.activate_workspace_destination('20000000-0000-4000-8000-000000000001',gen_random_uuid(),'facebook','synthetic-facebook',0)$$,
  'Free admits a second network');
select lives_ok($$select private.activate_workspace_destination('20000000-0000-4000-8000-000000000001',gen_random_uuid(),'instagram','synthetic-instagram',0)$$,
  'Free admits a third network');
select throws_ok($$select private.activate_workspace_destination('20000000-0000-4000-8000-000000000001',gen_random_uuid(),'tiktok','synthetic-tiktok',0)$$,
  'P0001','ACCOUNT_LIMIT_REACHED','Free denies fourth network and fourth total destination');
select throws_ok($$select private.activate_workspace_destination('20000000-0000-4000-8000-000000000001',gen_random_uuid(),'instagram','synthetic-instagram-2',0)$$,
  'P0001','ACCOUNT_LIMIT_REACHED','Free denies a second identity on a selected network');
select is((private.activate_workspace_destination('20000000-0000-4000-8000-000000000001',gen_random_uuid(),'instagram','synthetic-instagram',1)->>'version')::bigint,
  1::bigint,'reconnecting the same enabled identity consumes no extra slot');
select ok((private.activate_workspace_destination('20000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000011','linkedin','synthetic-linkedin',0)->>'replayed')::boolean,
  'duplicate activation does not create another identity');
select throws_ok($$select private.activate_workspace_destination('20000000-0000-4000-8000-000000000001',gen_random_uuid(),'youtube','synthetic-youtube',0)$$,
  'P0001','INVALID_INPUT','unreleased network cannot be activated');
select pg_temp.as_actor(3);
select throws_ok($$select private.activate_workspace_destination('20000000-0000-4000-8000-000000000001',gen_random_uuid(),'x','synthetic-x',0)$$,
  'P0001','ACCESS_DENIED','editor cannot administer destinations');
reset role;
set local role authenticated;
select pg_temp.as_actor(3);
select is((select count(*) from private.workspace_destinations),0::bigint,'membership alone does not disclose account identities');
reset role;
set local role cadence_command;
select pg_temp.as_actor(1);
select lives_ok($$select private.set_destination_grant('20000000-0000-4000-8000-000000000001',gen_random_uuid(),pg_temp.destination_id('synthetic-instagram'),'10000000-0000-4000-8000-000000000003',1,true)$$,
  'owner grants access to a selected destination');
select throws_ok($$select private.set_destination_grant('20000000-0000-4000-8000-000000000001',gen_random_uuid(),pg_temp.destination_id('synthetic-instagram'),'10000000-0000-4000-8000-000000000008',2,true)$$,
  'P0001','ACCESS_DENIED','account grant cannot cross a workspace boundary');
reset role;
set local role authenticated;
select pg_temp.as_actor(3);
select is((select count(*) from private.workspace_destinations),1::bigint,'explicit account grant discloses only selected identity');
reset role;
set local role cadence_command;
select pg_temp.as_actor(1);
select lives_ok($$select private.set_destination_grant('20000000-0000-4000-8000-000000000001',gen_random_uuid(),pg_temp.destination_id('synthetic-instagram'),'10000000-0000-4000-8000-000000000003',2,false)$$,
  'grant revocation is versioned');
reset role;
set local role authenticated;
select pg_temp.as_actor(3);
select is((select count(*) from private.workspace_destinations),0::bigint,'revocation blocks the next account read');
reset role;

set local role cadence_operator;
select lives_ok($$select private.assign_workspace_plan('20000000-0000-4000-8000-000000000001',gen_random_uuid(),2,'creator',1,0,array[pg_temp.destination_id('synthetic-linkedin'),pg_temp.destination_id('synthetic-facebook'),pg_temp.destination_id('synthetic-instagram')],'synthetic_plan_test')$$,
  'upgrade retains explicit selected accounts');
reset role;
set local role cadence_command;
select pg_temp.as_actor(1);
select throws_ok($$select private.activate_workspace_destination('20000000-0000-4000-8000-000000000001',gen_random_uuid(),'instagram','synthetic-instagram-2',0)$$,
  'P0001','ACCOUNT_LIMIT_REACHED','Creator still limits each network to one identity');
select lives_ok($$select private.activate_workspace_destination('20000000-0000-4000-8000-000000000001',gen_random_uuid(),'tiktok','synthetic-tiktok',0)$$,
  'Creator permits fourth network');
select lives_ok($$select private.activate_workspace_destination('20000000-0000-4000-8000-000000000001',gen_random_uuid(),'x','synthetic-x',0)$$,
  'Creator permits all five launch networks');
reset role;
set local role cadence_operator;
select throws_ok($$select private.assign_workspace_plan('20000000-0000-4000-8000-000000000001',gen_random_uuid(),3,'free',1,0,array[pg_temp.destination_id('synthetic-linkedin'),pg_temp.destination_id('synthetic-facebook'),pg_temp.destination_id('synthetic-instagram'),pg_temp.destination_id('synthetic-tiktok')],'synthetic_plan_test')$$,
  'P0001','ACCOUNT_LIMIT_REACHED','downgrade requires a valid retained selection');
select lives_ok($$select private.assign_workspace_plan('20000000-0000-4000-8000-000000000001',gen_random_uuid(),3,'free',1,0,array[pg_temp.destination_id('synthetic-linkedin'),pg_temp.destination_id('synthetic-facebook'),pg_temp.destination_id('synthetic-instagram')],'synthetic_plan_test')$$,
  'valid downgrade disables only unselected destinations');
reset role;
select is((select count(*) from private.workspace_destinations where enabled),3::bigint,'downgrade enforces active account limit');
select is((select count(*) from private.workspace_destinations),5::bigint,'downgrade preserves all destination identities and history');
select is((select count(*) from private.sources),1::bigint,'downgrade preserves private source content');
select is((select count(*) from private.workspace_memberships where workspace_id = '20000000-0000-4000-8000-000000000001' and removed_at is null),5::bigint,
  'undecided solo seat policy never silently removes members');
set local role cadence_operator;
select lives_ok($$select private.assign_workspace_plan('20000000-0000-4000-8000-000000000001',gen_random_uuid(),4,'professional',1,0,array[pg_temp.destination_id('synthetic-linkedin')],'synthetic_plan_test')$$,
  'Professional assignment uses explicit retained identities');
reset role;
set local role cadence_command;
select pg_temp.as_actor(1);
select lives_ok($$select private.activate_workspace_destination('20000000-0000-4000-8000-000000000001',gen_random_uuid(),'linkedin','synthetic-linkedin-' || n,0) from generate_series(1,20) as n$$,
  'Professional permits many identities on the same network');
reset role;
select is((select count(*) from private.workspace_destinations where enabled),21::bigint,'Professional has no artificial account-count ceiling');
select * from finish();
rollback;
