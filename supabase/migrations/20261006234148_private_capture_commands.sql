begin;
create function private.create_private_capture(
  p_workspace_id uuid,p_request_id uuid,p_brand_id uuid,p_title text,p_body text,
  p_category private.source_category,p_purposes private.source_purpose[],p_client_authority boolean,
  p_allowed_data_confirmed boolean,p_expires_at timestamptz
)
returns jsonb language plpgsql security definer set search_path = pg_catalog, private as $$
declare input jsonb; replay jsonb; source_id uuid;
begin
  perform private.require_workspace_role(p_workspace_id,array['owner','admin','editor','publisher']::private.workspace_role[]);
  input := jsonb_build_array(p_brand_id,p_title,p_body,p_category,p_purposes,p_client_authority,p_allowed_data_confirmed,p_expires_at);
  replay := private.replay_access_command(p_workspace_id,p_request_id,private.current_actor_id(),'source_create',input);
  if replay is not null then return replay; end if;
  if not private.brand_visible(p_workspace_id,p_brand_id) then raise exception 'SOURCE_ACCESS_DENIED' using errcode = 'P0001'; end if;
  perform private.validate_capture_text(p_title,p_body,p_category,p_purposes,p_client_authority,p_allowed_data_confirmed,p_expires_at);
  insert into private.sources(workspace_id,creator_user_id,brand_id,title,category,permitted_purposes,client_authority_confirmed,expires_at)
    values(p_workspace_id,private.current_actor_id(),p_brand_id,p_title,p_category,p_purposes,p_client_authority,p_expires_at)
    returning id into source_id;
  insert into private.source_revisions(workspace_id,source_id,version,title,body,authored_by_user_id)
    values(p_workspace_id,source_id,1,p_title,p_body,private.current_actor_id());
  return private.complete_access_command(p_workspace_id,p_request_id,private.current_actor_id(),'source_create',input,source_id,1,'creator_capture');
end
$$;
create function private.revise_private_capture(
  p_workspace_id uuid,p_request_id uuid,p_source_id uuid,p_expected_content_version bigint,p_expected_access_version bigint,
  p_brand_id uuid,p_title text,p_body text,p_category private.source_category,p_purposes private.source_purpose[],
  p_client_authority boolean,p_allowed_data_confirmed boolean,p_expires_at timestamptz
)
returns jsonb language plpgsql security definer set search_path = pg_catalog, private as $$
declare input jsonb; replay jsonb; source private.sources%rowtype;
begin
  perform private.require_workspace_role(p_workspace_id,array['owner','admin','editor','publisher']::private.workspace_role[]);
  if not private.source_custodian(p_workspace_id,p_source_id) then raise exception 'SOURCE_ACCESS_DENIED' using errcode = 'P0001'; end if;
  input := jsonb_build_array(p_source_id,p_expected_content_version,p_expected_access_version,p_brand_id,p_title,p_body,
    p_category,p_purposes,p_client_authority,p_allowed_data_confirmed,p_expires_at);
  replay := private.replay_access_command(p_workspace_id,p_request_id,private.current_actor_id(),'source_revise',input);
  if replay is not null then return replay; end if;
  source := private.require_source_custodian(p_workspace_id,p_source_id,p_expected_content_version,p_expected_access_version);
  if not private.brand_visible(p_workspace_id,p_brand_id) then raise exception 'SOURCE_ACCESS_DENIED' using errcode = 'P0001'; end if;
  perform private.validate_capture_text(p_title,p_body,p_category,p_purposes,p_client_authority,p_allowed_data_confirmed,p_expires_at);
  perform private.invalidate_source_reuse(p_workspace_id,p_source_id);
  update private.sources set title = p_title,brand_id = p_brand_id,category = p_category,permitted_purposes = p_purposes,
    client_authority_confirmed = p_client_authority,expires_at = p_expires_at,
    content_version = content_version + 1,access_version = access_version + 1,state = 'private'
    where id = source.id;
  insert into private.source_revisions(workspace_id,source_id,version,title,body,authored_by_user_id)
    values(p_workspace_id,p_source_id,source.content_version + 1,p_title,p_body,private.current_actor_id());
  return private.complete_access_command(p_workspace_id,p_request_id,private.current_actor_id(),'source_revise',input,source.id,source.content_version + 1,'custodian_revision');
end
$$;
revoke all on function private.create_private_capture(uuid,uuid,uuid,text,text,private.source_category,private.source_purpose[],boolean,boolean,timestamptz),
  private.revise_private_capture(uuid,uuid,uuid,bigint,bigint,uuid,text,text,private.source_category,private.source_purpose[],boolean,boolean,timestamptz)
  from public,anon,authenticated,service_role,cadence_operator;
grant execute on function private.create_private_capture(uuid,uuid,uuid,text,text,private.source_category,private.source_purpose[],boolean,boolean,timestamptz),
  private.revise_private_capture(uuid,uuid,uuid,bigint,bigint,uuid,text,text,private.source_category,private.source_purpose[],boolean,boolean,timestamptz)
  to cadence_command;
commit;
