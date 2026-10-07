\ir access.sql.inc
-- A second owner is not automatically a recipient of any private source.
update private.workspace_memberships set role = 'owner'
  where workspace_id = '20000000-0000-4000-8000-000000000001' and user_id = '10000000-0000-4000-8000-000000000002';
create function pg_temp.capture_id(p_title text) returns uuid language sql security definer
set search_path = pg_catalog, private as $$
  select id from private.sources where workspace_id = '20000000-0000-4000-8000-000000000001' and title = p_title
$$;
create function pg_temp.excerpt_id(p_text text) returns uuid language sql security definer
set search_path = pg_catalog, private as $$
  select id from private.source_excerpts where workspace_id = '20000000-0000-4000-8000-000000000001' and body = p_text
$$;
create function pg_temp.brand_id(p_name text) returns uuid language sql security definer
set search_path = pg_catalog, private as $$
  select id from private.brands where workspace_id = '20000000-0000-4000-8000-000000000001' and name = p_name
$$;
grant execute on function pg_temp.capture_id(text),pg_temp.excerpt_id(text),pg_temp.brand_id(text) to cadence_command,authenticated;
