begin;
create function private.write_brand(
  p_workspace_id uuid,p_request_id uuid,p_brand_id uuid,p_expected_version bigint,
  p_name text,p_audience text,p_voice text,p_guidance text
)
returns jsonb language plpgsql security definer set search_path = pg_catalog, private as $$
declare input jsonb; replay jsonb; target private.brands%rowtype; result_id uuid; result_version bigint;
begin
  perform private.require_workspace_role(p_workspace_id,array['owner','admin']::private.workspace_role[]);
  input := jsonb_build_array(p_brand_id,p_expected_version,p_name,p_audience,p_voice,p_guidance);
  replay := private.replay_access_command(p_workspace_id,p_request_id,private.current_actor_id(),'brand_write',input);
  if replay is not null then return replay; end if;
  if p_name is null or length(btrim(p_name)) not between 1 and 120
    or p_audience is null or length(p_audience) > 4000 or p_voice is null or length(p_voice) > 4000
    or p_guidance is null or length(p_guidance) > 8000 then
    raise exception 'INVALID_INPUT' using errcode = 'P0001';
  end if;
  if p_brand_id is null then
    if p_expected_version is distinct from 0::bigint then raise exception 'VERSION_CONFLICT' using errcode = 'P0001'; end if;
    insert into private.brands(workspace_id,name) values(p_workspace_id,p_name) returning id,version into result_id,result_version;
  else
    select * into target from private.brands where workspace_id = p_workspace_id and id = p_brand_id;
    if not found then raise exception 'ACCESS_DENIED' using errcode = 'P0001'; end if;
    if p_expected_version is distinct from target.version then raise exception 'VERSION_CONFLICT' using errcode = 'P0001'; end if;
    update private.brands set name = p_name,version = version + 1 where id = target.id returning id,version into result_id,result_version;
  end if;
  insert into private.brand_playbooks(workspace_id,brand_id,version,audience,voice,guidance,created_by_user_id)
    values(p_workspace_id,result_id,result_version,p_audience,p_voice,p_guidance,private.current_actor_id());
  return private.complete_access_command(p_workspace_id,p_request_id,private.current_actor_id(),'brand_write',input,result_id,result_version,'owner_admin_request');
end
$$;
create function private.set_brand_assignment(
  p_workspace_id uuid,p_request_id uuid,p_brand_id uuid,p_user_id uuid,p_expected_access_version bigint,p_allowed boolean
)
returns jsonb language plpgsql security definer set search_path = pg_catalog, private as $$
declare input jsonb; replay jsonb; target private.brands%rowtype;
begin
  perform private.require_workspace_role(p_workspace_id,array['owner','admin']::private.workspace_role[]);
  input := jsonb_build_array(p_brand_id,p_user_id,p_expected_access_version,p_allowed);
  replay := private.replay_access_command(p_workspace_id,p_request_id,private.current_actor_id(),'brand_assignment',input);
  if replay is not null then return replay; end if;
  select * into target from private.brands where workspace_id = p_workspace_id and id = p_brand_id;
  if not found or p_allowed is null or p_user_id = private.current_actor_id() or not exists (
    select 1 from private.workspace_memberships as member join private.app_users as person on person.id = member.user_id
    where member.workspace_id = p_workspace_id and member.user_id = p_user_id and member.removed_at is null
      and member.role not in ('owner','admin') and person.email_verified and person.disabled_at is null
  ) then raise exception 'ACCESS_DENIED' using errcode = 'P0001'; end if;
  if target.access_version is distinct from p_expected_access_version then raise exception 'VERSION_CONFLICT' using errcode = 'P0001'; end if;
  if p_allowed then
    insert into private.brand_assignments(workspace_id,brand_id,user_id) values(p_workspace_id,p_brand_id,p_user_id) on conflict do nothing;
  else
    delete from private.brand_assignments where workspace_id = p_workspace_id and brand_id = p_brand_id and user_id = p_user_id;
    update private.source_grants as permission set revoked_at = clock_timestamp()
      from private.sources as source where (permission.workspace_id,permission.source_id) = (source.workspace_id,source.id)
        and source.workspace_id = p_workspace_id and source.brand_id = p_brand_id and permission.recipient_user_id = p_user_id and permission.revoked_at is null;
    delete from private.excerpt_grants as permission using private.source_excerpts as excerpt,private.sources as source
      where (permission.workspace_id,permission.excerpt_id) = (excerpt.workspace_id,excerpt.id)
        and (excerpt.workspace_id,excerpt.source_id) = (source.workspace_id,source.id)
        and source.workspace_id = p_workspace_id and source.brand_id = p_brand_id and permission.recipient_user_id = p_user_id;
  end if;
  update private.brands set access_version = access_version + 1 where id = target.id;
  return private.complete_access_command(p_workspace_id,p_request_id,private.current_actor_id(),'brand_assignment',input,target.id,target.access_version + 1,'owner_admin_request');
end
$$;
revoke all on function private.write_brand(uuid,uuid,uuid,bigint,text,text,text,text),
  private.set_brand_assignment(uuid,uuid,uuid,uuid,bigint,boolean) from public,anon,authenticated,service_role,cadence_operator;
grant execute on function private.write_brand(uuid,uuid,uuid,bigint,text,text,text,text),
  private.set_brand_assignment(uuid,uuid,uuid,uuid,bigint,boolean) to cadence_command;
commit;
