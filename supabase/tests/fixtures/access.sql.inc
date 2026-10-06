-- Disposable records; included only inside each test's rolled-back transaction.
insert into private.app_users(id, clerk_subject_id, email_verified)
select ('10000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,
  'synthetic-access-' || n, true from generate_series(1,10) as n;
insert into private.workspaces(id, name) values
  ('20000000-0000-4000-8000-000000000001', 'Synthetic access workspace'),
  ('20000000-0000-4000-8000-000000000002', 'Synthetic unrelated workspace');
insert into private.workspace_memberships(workspace_id, user_id, role)
select '20000000-0000-4000-8000-000000000001',
  ('10000000-0000-4000-8000-' || lpad(n::text,12,'0'))::uuid,
  (array['owner','admin','editor','publisher','viewer'])[n]::private.workspace_role
from generate_series(1,5) as n;
insert into private.workspace_memberships(workspace_id, user_id, role) values
  ('20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000008','owner');
insert into private.access_policy(mode) values ('require_mfa');
insert into private.workspace_plan_assignments(workspace_id, plan_key, catalog_version, origin) values
  ('20000000-0000-4000-8000-000000000001','teams',1,'internal_operations'),
  ('20000000-0000-4000-8000-000000000002','teams',1,'internal_operations');
insert into private.sources(workspace_id, creator_user_id, title, category, permitted_purposes) values
  ('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000003',
   'Synthetic editor private draft','personal_draft',array['editorial_reuse']::private.source_purpose[]);

create function pg_temp.as_actor(n integer) returns void language plpgsql as $$
begin
  perform set_config('app.actor_id','10000000-0000-4000-8000-' || lpad(n::text,12,'0'),true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub','synthetic-access-' || n,'role','authenticated','fva',jsonb_build_array(1,1))::text,true);
end
$$;
create function pg_temp.invite_id(n integer) returns uuid language sql security definer
set search_path = pg_catalog, private as $$
  select id from private.workspace_invitations
    where recipient_user_id = ('10000000-0000-4000-8000-' || lpad(n::text,12,'0'))::uuid
    order by created_at desc, id desc limit 1
$$;
-- The test runner creates pg_temp as postgres; role-switched fixtures need usage.
grant usage on schema pg_temp to cadence_command, cadence_operator, authenticated;
grant usage on schema extensions to cadence_command, cadence_operator;
grant execute on function pg_temp.as_actor(integer), pg_temp.invite_id(integer)
  to cadence_command, cadence_operator, authenticated;
create function pg_temp.destination_id(p_identity text) returns uuid language sql security definer
set search_path = pg_catalog, private as $$
  select id from private.workspace_destinations where external_identity = p_identity
    and workspace_id = '20000000-0000-4000-8000-000000000001'
$$;
grant execute on function pg_temp.destination_id(text) to cadence_command, cadence_operator, authenticated;
