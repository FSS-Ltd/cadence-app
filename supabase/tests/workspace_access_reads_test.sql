begin;
select plan(8);
\ir fixtures/access.sql.inc
set local role cadence_command;
select pg_temp.as_actor(1);
select is(private.read_workspace_access('20000000-0000-4000-8000-000000000001','summary',null,50)->'actor'->>'role','owner','summary derives role from live membership');
select is(jsonb_array_length(private.read_workspace_access('20000000-0000-4000-8000-000000000001','members',null,2)->'items'),2,'member page obeys requested bound');
select ok(private.read_workspace_access('20000000-0000-4000-8000-000000000001','members',null,2)->>'nextCursor' is not null,'truncated page provides a cursor');
select is(jsonb_array_length(private.read_workspace_access('20000000-0000-4000-8000-000000000001','members',
  (private.read_workspace_access('20000000-0000-4000-8000-000000000001','members',null,2)->>'nextCursor')::uuid,100)->'items'),3,'cursor visits remaining members without repeats');
select throws_ok($$select private.read_workspace_access('20000000-0000-4000-8000-000000000002','members',null,50)$$,'P0001','ACCESS_DENIED','read models reject cross-workspace access');
select throws_ok($$select private.read_workspace_access('20000000-0000-4000-8000-000000000001','members',null,101)$$,'P0001','INVALID_INPUT','database enforces read bounds independently of HTTP');
select pg_temp.as_actor(3);
select throws_ok($$select private.read_workspace_access('20000000-0000-4000-8000-000000000001','invitations',null,50)$$,'P0001','ACCESS_DENIED','non-admin cannot list invitation identities');
select is(jsonb_array_length(private.read_workspace_access('20000000-0000-4000-8000-000000000001','destinations',null,50)->'items'),0,'ordinary members see only granted destinations');
reset role;
select * from finish();
rollback;
