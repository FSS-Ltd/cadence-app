begin;
create function private.share_source_original(
  p_workspace_id uuid,p_request_id uuid,p_source_id uuid,p_expected_content_version bigint,p_expected_access_version bigint,
  p_recipients uuid[],p_purposes private.source_purpose[],p_share_confirmed boolean
)
returns jsonb language plpgsql security definer set search_path = pg_catalog, private as $$
declare input jsonb; replay jsonb; source private.sources%rowtype;
begin
  perform private.require_workspace_role(p_workspace_id,array['owner','admin','editor','publisher']::private.workspace_role[]);
  if not private.source_custodian(p_workspace_id,p_source_id) then raise exception 'SOURCE_ACCESS_DENIED' using errcode = 'P0001'; end if;
  input := jsonb_build_array(p_source_id,p_expected_content_version,p_expected_access_version,p_recipients,p_purposes,p_share_confirmed);
  replay := private.replay_access_command(p_workspace_id,p_request_id,private.current_actor_id(),'source_share',input);
  if replay is not null then return replay; end if;
  source := private.require_source_custodian(p_workspace_id,p_source_id,p_expected_content_version,p_expected_access_version);
  if p_share_confirmed is distinct from true or not private.brand_visible(p_workspace_id,source.brand_id) then
    raise exception 'SOURCE_ACCESS_DENIED' using errcode = 'P0001';
  end if;
  perform private.validate_source_recipients(source,p_recipients,p_purposes);
  -- Replacement is deliberate: old original grants and excerpt releases cannot
  -- survive a changed access decision. The UI must describe this before sharing.
  perform private.invalidate_source_reuse(p_workspace_id,p_source_id);
  update private.sources set state = 'shared',access_version = access_version + 1 where id = source.id;
  insert into private.source_grants(workspace_id,source_id,recipient_user_id,purpose,granted_by_user_id,source_version,access_version)
    select p_workspace_id,p_source_id,recipient,purpose,private.current_actor_id(),source.content_version,source.access_version + 1
      from unnest(p_recipients) as recipient cross join unnest(p_purposes) as purpose;
  return private.complete_access_command(p_workspace_id,p_request_id,private.current_actor_id(),'source_share',input,source.id,source.access_version + 1,'explicit_original_share');
end
$$;
create function private.release_reviewed_excerpt(
  p_workspace_id uuid,p_request_id uuid,p_source_id uuid,p_expected_content_version bigint,p_expected_access_version bigint,
  p_body text,p_recipients uuid[],p_purposes private.source_purpose[],p_review_confirmed boolean
)
returns jsonb language plpgsql security definer set search_path = pg_catalog, private as $$
declare input jsonb; replay jsonb; source private.sources%rowtype; excerpt_id uuid;
begin
  perform private.require_workspace_role(p_workspace_id,array['owner','admin','editor','publisher']::private.workspace_role[]);
  if not private.source_custodian(p_workspace_id,p_source_id) then raise exception 'SOURCE_ACCESS_DENIED' using errcode = 'P0001'; end if;
  input := jsonb_build_array(p_source_id,p_expected_content_version,p_expected_access_version,p_body,p_recipients,p_purposes,p_review_confirmed);
  replay := private.replay_access_command(p_workspace_id,p_request_id,private.current_actor_id(),'excerpt_release',input);
  if replay is not null then return replay; end if;
  source := private.require_source_custodian(p_workspace_id,p_source_id,p_expected_content_version,p_expected_access_version);
  if not private.brand_visible(p_workspace_id,source.brand_id) or not ('excerpt_release' = any(source.permitted_purposes)) then
    raise exception 'SOURCE_ACCESS_DENIED' using errcode = 'P0001';
  end if;
  if p_review_confirmed is distinct from true or p_body is null or length(btrim(p_body)) not between 1 and 10000
    or not exists (select 1 from private.source_revisions where workspace_id = p_workspace_id and source_id = p_source_id
      and version = source.content_version and erased_at is null) then
    raise exception 'INVALID_INPUT' using errcode = 'P0001';
  end if;
  perform private.validate_source_recipients(source,p_recipients,p_purposes);
  insert into private.source_excerpts(workspace_id,source_id,source_version,source_access_version,reviewed_by_user_id,body)
    values(p_workspace_id,p_source_id,source.content_version,source.access_version,private.current_actor_id(),p_body) returning id into excerpt_id;
  insert into private.excerpt_grants(workspace_id,excerpt_id,recipient_user_id,purpose)
    select p_workspace_id,excerpt_id,recipient,purpose from unnest(p_recipients) as recipient cross join unnest(p_purposes) as purpose;
  return private.complete_access_command(p_workspace_id,p_request_id,private.current_actor_id(),'excerpt_release',input,excerpt_id,1,'reviewed_excerpt_release');
end
$$;
create function private.revoke_source_sharing(
  p_workspace_id uuid,p_request_id uuid,p_source_id uuid,p_expected_content_version bigint,p_expected_access_version bigint
)
returns jsonb language plpgsql security definer set search_path = pg_catalog, private as $$
declare input jsonb; replay jsonb; source private.sources%rowtype;
begin
  perform private.require_workspace_role(p_workspace_id,array['owner','admin','editor','publisher']::private.workspace_role[]);
  if not private.source_custodian(p_workspace_id,p_source_id) then raise exception 'SOURCE_ACCESS_DENIED' using errcode = 'P0001'; end if;
  input := jsonb_build_array(p_source_id,p_expected_content_version,p_expected_access_version);
  replay := private.replay_access_command(p_workspace_id,p_request_id,private.current_actor_id(),'source_revoke',input);
  if replay is not null then return replay; end if;
  source := private.require_source_custodian(p_workspace_id,p_source_id,p_expected_content_version,p_expected_access_version,true);
  perform private.invalidate_source_reuse(p_workspace_id,p_source_id);
  update private.sources set state = 'private',access_version = access_version + 1 where id = source.id;
  return private.complete_access_command(p_workspace_id,p_request_id,private.current_actor_id(),'source_revoke',input,source.id,source.access_version + 1,'custodian_revocation');
end
$$;
revoke all on function private.share_source_original(uuid,uuid,uuid,bigint,bigint,uuid[],private.source_purpose[],boolean),
  private.release_reviewed_excerpt(uuid,uuid,uuid,bigint,bigint,text,uuid[],private.source_purpose[],boolean),
  private.revoke_source_sharing(uuid,uuid,uuid,bigint,bigint) from public,anon,authenticated,service_role,cadence_operator;
grant execute on function private.share_source_original(uuid,uuid,uuid,bigint,bigint,uuid[],private.source_purpose[],boolean),
  private.release_reviewed_excerpt(uuid,uuid,uuid,bigint,bigint,text,uuid[],private.source_purpose[],boolean),
  private.revoke_source_sharing(uuid,uuid,uuid,bigint,bigint) to cadence_command;
commit;
