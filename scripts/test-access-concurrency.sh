#!/usr/bin/env bash
set -euo pipefail

# This destructive fixture cleanup is allowed only on a disposable local stack.
database_url="${CADENCE_TEST_DATABASE_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"
if [[ ! "$database_url" =~ ^postgresql://postgres:postgres@(127\.0\.0\.1|localhost):[0-9]+/postgres$ ]]; then
  echo 'Concurrency fixtures require the disposable local Postgres database.'
  exit 1
fi
repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
output_dir="$(mktemp -d)"
fixture_created=0
cleanup() {
  local result=$?
  if [[ "$fixture_created" == 1 ]]; then
    psql "$database_url" --no-psqlrc --quiet --set=ON_ERROR_STOP=1 <<'SQL' || result=1
begin;
delete from private.access_command_receipts where workspace_id in ('20000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000002');
delete from private.access_audit_events where workspace_id in ('20000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000002');
delete from private.workspace_invitations where workspace_id = '20000000-0000-4000-8000-000000000001';
delete from private.destination_grants where workspace_id = '20000000-0000-4000-8000-000000000001';
delete from private.workspace_destinations where workspace_id = '20000000-0000-4000-8000-000000000001';
delete from private.sources where workspace_id = '20000000-0000-4000-8000-000000000001';
delete from private.workspace_plan_assignments where workspace_id in ('20000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000002');
delete from private.workspace_memberships where workspace_id in ('20000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000002');
delete from private.access_policy;
delete from private.workspaces where id in ('20000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000002');
delete from private.app_users as u where exists (select 1 from generate_series(1,10) as n
  where u.id = ('10000000-0000-4000-8000-' || lpad(n::text,12,'0'))::uuid
    and u.clerk_subject_id = 'synthetic-access-' || n);
commit;
SQL
  fi
  rm -r "$output_dir"
  exit "$result"
}
trap cleanup EXIT

# Any collision aborts the entire transaction. Never clean up pre-existing data.
psql "$database_url" --no-psqlrc --quiet --set=ON_ERROR_STOP=1 <<SQL
begin;
\i '$repo_root/supabase/tests/fixtures/access.sql.inc'
update private.workspace_memberships set removed_at = now()
  where workspace_id = '20000000-0000-4000-8000-000000000001'
    and user_id = '10000000-0000-4000-8000-000000000005';
commit;
SQL
fixture_created=1

run_command() {
  local actor="$1" statement="$2"
  psql "$database_url" --no-psqlrc --quiet --set=ON_ERROR_STOP=1 <<SQL
begin;
set local statement_timeout = '10s';
set local role cadence_command;
select set_config('app.actor_id','10000000-0000-4000-8000-00000000000$actor',true);
select set_config('request.jwt.claims','{"sub":"synthetic-access-$actor","fva":[1,1]}',true);
$statement;
select pg_sleep(1);
commit;
SQL
}

assert_race() {
  local first_actor="$1" first_sql="$2" second_actor="$3" second_sql="$4" expected_error="$5"
  local first_status=0 second_status=0
  run_command "$first_actor" "$first_sql" >"$output_dir/first" 2>&1 &
  local first_pid=$!
  run_command "$second_actor" "$second_sql" >"$output_dir/second" 2>&1 &
  local second_pid=$!
  wait "$first_pid" || first_status=$?
  wait "$second_pid" || second_status=$?
  if [[ "$first_status" == 0 && "$second_status" == 0 ]] || [[ "$first_status" != 0 && "$second_status" != 0 ]]; then
    cat "$output_dir/first" "$output_dir/second"
    echo 'Expected exactly one concurrent command to succeed.'
    exit 1
  fi
  if ! grep --quiet --extended-regexp "$expected_error" "$output_dir/first" "$output_dir/second"; then
    cat "$output_dir/first" "$output_dir/second"
    echo 'Concurrent loser failed for an unexpected reason.'
    exit 1
  fi
}

assert_race 1 "select private.issue_workspace_invitation('20000000-0000-4000-8000-000000000001',gen_random_uuid(),'10000000-0000-4000-8000-000000000006','editor',repeat('a',64),24)" \
  1 "select private.issue_workspace_invitation('20000000-0000-4000-8000-000000000001',gen_random_uuid(),'10000000-0000-4000-8000-000000000007','editor',repeat('b',64),24)" 'SEAT_LIMIT_REACHED'
psql "$database_url" --no-psqlrc --quiet --set=ON_ERROR_STOP=1 <<'SQL'
select 1 / (private.occupied_workspace_seats('20000000-0000-4000-8000-000000000001') = 5)::integer;
update private.workspace_invitations set revoked_at = now() where workspace_id = '20000000-0000-4000-8000-000000000001';
set role cadence_operator;
select private.assign_workspace_plan('20000000-0000-4000-8000-000000000001',gen_random_uuid(),1,'creator',1,0,array[]::uuid[],'synthetic_race_test');
SQL
assert_race 1 "select private.activate_workspace_destination('20000000-0000-4000-8000-000000000001',gen_random_uuid(),'instagram','synthetic-race-one',0)" \
  1 "select private.activate_workspace_destination('20000000-0000-4000-8000-000000000001',gen_random_uuid(),'instagram','synthetic-race-two',0)" 'ACCOUNT_LIMIT_REACHED'
psql "$database_url" --no-psqlrc --quiet --set=ON_ERROR_STOP=1 <<'SQL'
select 1 / ((select count(*) from private.workspace_destinations where enabled) = 1)::integer;
update private.workspace_memberships set role = 'owner'
  where workspace_id = '20000000-0000-4000-8000-000000000001'
    and user_id = '10000000-0000-4000-8000-000000000002';
SQL
assert_race 1 "select private.change_workspace_member('20000000-0000-4000-8000-000000000001',gen_random_uuid(),'10000000-0000-4000-8000-000000000002',1,null)" \
  2 "select private.change_workspace_member('20000000-0000-4000-8000-000000000001',gen_random_uuid(),'10000000-0000-4000-8000-000000000001',1,null)" 'ACCESS_DENIED|LAST_OWNER'
psql "$database_url" --no-psqlrc --quiet --set=ON_ERROR_STOP=1 <<'SQL'
select 1 / ((select count(*) from private.workspace_memberships where workspace_id = '20000000-0000-4000-8000-000000000001' and role = 'owner' and removed_at is null) = 1)::integer;
SQL
echo 'Concurrent seat, destination and owner commands passed.'
