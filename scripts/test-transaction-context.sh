#!/usr/bin/env bash
set -euo pipefail

database_url="${CADENCE_TEST_DATABASE_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"
actor_id="10000000-0000-4000-8000-000000000001"

psql "$database_url" --no-psqlrc --set=ON_ERROR_STOP=1 <<SQL
begin;
set local role cadence_command;
select set_config('app.actor_id', '$actor_id', true);
select set_config('app.access_purpose', 'editorial_reuse', true);
select 1 / (private.current_actor_id() = '$actor_id'::uuid)::integer;
select 1 / (private.current_access_purpose() = 'editorial_reuse')::integer;
commit;

begin;
set local role cadence_command;
select 1 / (private.current_actor_id() is null)::integer;
select 1 / (private.current_access_purpose() is null)::integer;
commit;
SQL
