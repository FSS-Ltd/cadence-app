-- Bounded access-management reads; never return invitation hashes or contacts.
begin;
create function private.read_workspace_access(
  p_workspace_id uuid, p_resource text, p_after_id uuid, p_limit integer
)
returns jsonb language plpgsql security definer
set search_path = pg_catalog, private
as $$
declare actor_role private.workspace_role; plan_data jsonb; items jsonb; next_cursor text;
begin
  if p_resource is null or p_resource not in ('summary','members','invitations','destinations')
    or p_limit is null or p_limit not between 1 and 100 then
    raise exception 'INVALID_INPUT' using errcode = 'P0001';
  end if;
  actor_role := private.require_workspace_role(p_workspace_id,
    array['owner','admin','editor','publisher','viewer']::private.workspace_role[]);
  if p_resource = 'summary' then
    select jsonb_build_object('key', catalog.plan_key, 'version', assignment.version,
      'networkLimit', catalog.network_limit, 'accountLimit', catalog.account_limit,
      'perNetworkLimit', catalog.per_network_limit,
      'seatCapacity', catalog.included_seats::bigint + assignment.additional_seats)
      into plan_data from private.workspace_plan_assignments as assignment
      join private.plan_catalog_versions as catalog
        on (catalog.plan_key, catalog.version) = (assignment.plan_key, assignment.catalog_version)
      where assignment.workspace_id = p_workspace_id;
    return jsonb_build_object('resource','summary',
      'actor',jsonb_build_object('userId',private.current_actor_id(),'role',actor_role),'plan',plan_data);
  end if;
  if p_resource in ('members','invitations') and actor_role not in ('owner','admin') then
    raise exception 'ACCESS_DENIED' using errcode = 'P0001';
  end if;
  if p_resource = 'members' then
    select coalesce(jsonb_agg(value order by id),'[]'::jsonb) into items from (
      select id, jsonb_build_object('id',id,'userId',user_id,'role',role,'version',version,'removedAt',removed_at) as value
      from private.workspace_memberships where workspace_id = p_workspace_id and (p_after_id is null or id > p_after_id)
      order by id limit p_limit + 1
    ) as page;
  elsif p_resource = 'invitations' then
    select coalesce(jsonb_agg(value order by id),'[]'::jsonb) into items from (
      select id, jsonb_build_object('id',id,'recipientId',recipient_user_id,'role',role,'version',version,
        'expiresAt',expires_at,'acceptedAt',accepted_at,'revokedAt',revoked_at) as value
      from private.workspace_invitations where workspace_id = p_workspace_id and (p_after_id is null or id > p_after_id)
      order by id limit p_limit + 1
    ) as page;
  else
    select coalesce(jsonb_agg(value order by id),'[]'::jsonb) into items from (
      select id, jsonb_build_object('id',id,'provider',provider,'externalIdentity',external_identity,'enabled',enabled,'version',version) as value
      from private.workspace_destinations where workspace_id = p_workspace_id and (p_after_id is null or id > p_after_id)
        and private.destination_visible(workspace_id,id)
      order by id limit p_limit + 1
    ) as page;
  end if;
  if jsonb_array_length(items) > p_limit then
    next_cursor := items -> (p_limit - 1) ->> 'id';
    select jsonb_agg(value order by ordinal) into items
      from jsonb_array_elements(items) with ordinality as page(value,ordinal) where ordinal <= p_limit;
  end if;
  return jsonb_build_object('resource',p_resource,'items',items,'nextCursor',next_cursor);
end
$$;
revoke all on function private.read_workspace_access(uuid,text,uuid,integer)
  from public,anon,authenticated,service_role,cadence_operator;
grant execute on function private.read_workspace_access(uuid,text,uuid,integer) to cadence_command;
commit;
