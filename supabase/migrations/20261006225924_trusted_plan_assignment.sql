-- Internal operations are separately provisioned. No owner/admin HTTP route can
-- call these functions or write the catalog/assignment tables directly.
begin;

create function private.preview_workspace_plan(
  p_workspace_id uuid, p_plan_key text, p_catalog_version integer,
  p_additional_seats integer, p_retained_ids uuid[]
)
returns jsonb language plpgsql security definer
set search_path = pg_catalog, private
as $$
declare
  limits private.plan_catalog_versions%rowtype; occupied bigint; accounts bigint; networks bigint;
  largest_network bigint; disabled_ids jsonb; assignment_version bigint; capacity bigint;
begin
  select * into limits from private.plan_catalog_versions
    where plan_key = p_plan_key and version = p_catalog_version;
  if not found or not exists(select 1 from private.workspaces where id = p_workspace_id)
    or p_additional_seats is null or p_additional_seats < 0
    or (p_plan_key <> 'teams' and p_additional_seats <> 0) or p_retained_ids is null then
    raise exception 'INVALID_INPUT' using errcode = 'P0001';
  end if;
  if cardinality(p_retained_ids) <> (select count(*) from private.workspace_destinations
    where workspace_id = p_workspace_id and id = any(p_retained_ids)) then
    raise exception 'ACCESS_DENIED' using errcode = 'P0001';
  end if;
  with counts as (
    select provider, count(*) as quantity from private.workspace_destinations
      where workspace_id = p_workspace_id and id = any(p_retained_ids) group by provider
  ) select coalesce(sum(quantity),0), count(*), coalesce(max(quantity),0)
      into accounts, networks, largest_network from counts;
  occupied := private.occupied_workspace_seats(p_workspace_id);
  capacity := limits.included_seats::bigint + p_additional_seats;
  select version into assignment_version from private.workspace_plan_assignments where workspace_id = p_workspace_id;
  select coalesce(jsonb_agg(id order by id), '[]'::jsonb) into disabled_ids
    from private.workspace_destinations where workspace_id = p_workspace_id and enabled and not (id = any(p_retained_ids));
  return jsonb_build_object(
    'currentVersion', coalesce(assignment_version,0), 'occupiedSeats', occupied, 'seatCapacity', capacity,
    'disabledDestinationIds', disabled_ids,
    'accountsAllowed', networks <= limits.network_limit
      and (limits.account_limit is null or accounts <= limits.account_limit)
      and (limits.per_network_limit is null or largest_network <= limits.per_network_limit),
    'seatsAllowed', case when capacity is not null then occupied <= capacity else not exists (
      select 1 from private.workspace_invitations where workspace_id = p_workspace_id
        and accepted_at is null and revoked_at is null and expires_at > clock_timestamp()
    ) end
  );
end
$$;

create function private.assign_workspace_plan(
  p_workspace_id uuid, p_request_id uuid, p_expected_version bigint,
  p_plan_key text, p_catalog_version integer, p_additional_seats integer,
  p_retained_ids uuid[], p_reason_code text
)
returns jsonb language plpgsql security definer
set search_path = pg_catalog, private
as $$
declare preview jsonb; input jsonb; replay jsonb; next_version bigint;
begin
  if p_reason_code is null or p_reason_code !~ '^[a-z][a-z0-9_]{0,79}$' then
    raise exception 'INVALID_INPUT' using errcode = 'P0001';
  end if;
  perform 1 from private.workspaces where id = p_workspace_id for update;
  if not found then raise exception 'ACCESS_DENIED' using errcode = 'P0001'; end if;
  input := jsonb_build_array(p_expected_version, p_plan_key, p_catalog_version,
    p_additional_seats, p_retained_ids, p_reason_code);
  replay := private.replay_access_command(p_workspace_id, p_request_id, null, 'plan_assign', input);
  if replay is not null then return replay; end if;
  preview := private.preview_workspace_plan(p_workspace_id, p_plan_key, p_catalog_version, p_additional_seats, p_retained_ids);
  if (preview ->> 'currentVersion')::bigint is distinct from p_expected_version then
    raise exception 'VERSION_CONFLICT' using errcode = 'P0001';
  end if;
  if not (preview ->> 'seatsAllowed')::boolean then
    raise exception 'SEAT_LIMIT_REACHED' using errcode = 'P0001';
  end if;
  if not (preview ->> 'accountsAllowed')::boolean then
    raise exception 'ACCOUNT_LIMIT_REACHED' using errcode = 'P0001';
  end if;
  update private.workspace_destinations
    set enabled = (id = any(p_retained_ids)), version = version + 1
    where workspace_id = p_workspace_id and enabled is distinct from (id = any(p_retained_ids));
  insert into private.workspace_plan_assignments
    (workspace_id, plan_key, catalog_version, additional_seats, origin)
    values (p_workspace_id, p_plan_key, p_catalog_version, p_additional_seats, 'internal_operations')
    on conflict(workspace_id) do update set plan_key = excluded.plan_key,
      catalog_version = excluded.catalog_version, additional_seats = excluded.additional_seats,
      version = private.workspace_plan_assignments.version + 1, effective_at = clock_timestamp()
    returning version into next_version;
  return private.complete_access_command(p_workspace_id, p_request_id, null,
    'plan_assign', input, p_workspace_id, next_version, p_reason_code);
end
$$;

revoke all on function private.preview_workspace_plan(uuid, text, integer, integer, uuid[]),
  private.assign_workspace_plan(uuid, uuid, bigint, text, integer, integer, uuid[], text)
  from public, anon, authenticated, service_role, cadence_command, cadence_operator;
grant execute on function private.preview_workspace_plan(uuid, text, integer, integer, uuid[]),
  private.assign_workspace_plan(uuid, uuid, bigint, text, integer, integer, uuid[], text)
  to cadence_operator;

commit;
