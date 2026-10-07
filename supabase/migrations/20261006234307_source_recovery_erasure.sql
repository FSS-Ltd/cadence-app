begin;
create function private.recover_orphaned_source(
  p_workspace_id uuid,p_request_id uuid,p_source_id uuid,p_expected_content_version bigint,p_expected_access_version bigint,
  p_custodian_id uuid,p_reason_code text
)
returns jsonb language plpgsql security definer set search_path = pg_catalog, private as $$
declare input jsonb; replay jsonb; source private.sources%rowtype; departed boolean; disabled boolean; required_prefix text;
begin
  perform private.require_workspace_role(p_workspace_id,array['owner']::private.workspace_role[]);
  input := jsonb_build_array(p_source_id,p_expected_content_version,p_expected_access_version,p_custodian_id,p_reason_code);
  replay := private.replay_access_command(p_workspace_id,p_request_id,private.current_actor_id(),'source_recover',input);
  if replay is not null then return replay; end if;
  select * into source from private.sources where workspace_id = p_workspace_id and id = p_source_id;
  if not found or source.state not in ('private','shared','revoked')
    or (source.expires_at is not null and source.expires_at <= clock_timestamp()) then
    raise exception 'SOURCE_ACCESS_DENIED' using errcode = 'P0001';
  end if;
  select member.removed_at is not null,person.disabled_at is not null into departed,disabled
    from private.workspace_memberships as member join private.app_users as person on person.id = member.user_id
    where member.workspace_id = p_workspace_id and member.user_id = coalesce(source.custodian_user_id,source.creator_user_id);
  required_prefix := case when source.custodian_user_id is null then 'creator_' else 'custodian_' end;
  if not coalesce((departed and p_reason_code = required_prefix || 'departed')
    or (disabled and p_reason_code = required_prefix || 'disabled'),false) then
    raise exception 'SOURCE_ACCESS_DENIED' using errcode = 'P0001';
  end if;
  if not exists (select 1 from private.workspace_memberships as member join private.app_users as person on person.id = member.user_id
    where member.workspace_id = p_workspace_id and member.user_id = p_custodian_id and member.removed_at is null
      and member.role in ('owner','admin','editor','publisher') and person.email_verified and person.disabled_at is null
      and (source.brand_id is null or member.role in ('owner','admin') or exists (
        select 1 from private.brand_assignments where workspace_id = p_workspace_id and brand_id = source.brand_id and user_id = p_custodian_id))) then
    raise exception 'SOURCE_ACCESS_DENIED' using errcode = 'P0001';
  end if;
  if source.content_version is distinct from p_expected_content_version or source.access_version is distinct from p_expected_access_version then
    raise exception 'VERSION_CONFLICT' using errcode = 'P0001';
  end if;
  perform private.invalidate_source_reuse(p_workspace_id,p_source_id);
  update private.sources set custodian_user_id = p_custodian_id,state = 'private',access_version = access_version + 1 where id = source.id;
  insert into private.source_recoveries(workspace_id,source_id,actor_user_id,custodian_user_id,reason_code)
    values(p_workspace_id,p_source_id,private.current_actor_id(),p_custodian_id,p_reason_code);
  return private.complete_access_command(p_workspace_id,p_request_id,private.current_actor_id(),'source_recover',input,source.id,source.access_version + 1,p_reason_code);
end
$$;
create function private.erase_private_source(
  p_workspace_id uuid,p_request_id uuid,p_source_id uuid,p_expected_content_version bigint,p_expected_access_version bigint
)
returns jsonb language plpgsql security definer set search_path = pg_catalog, private as $$
declare input jsonb; replay jsonb; source private.sources%rowtype;
begin
  perform private.require_workspace_role(p_workspace_id,array['owner','admin','editor','publisher']::private.workspace_role[]);
  if not private.source_custodian(p_workspace_id,p_source_id) then raise exception 'SOURCE_ACCESS_DENIED' using errcode = 'P0001'; end if;
  input := jsonb_build_array(p_source_id,p_expected_content_version,p_expected_access_version);
  replay := private.replay_access_command(p_workspace_id,p_request_id,private.current_actor_id(),'source_erase',input);
  if replay is not null then return replay; end if;
  source := private.require_source_custodian(p_workspace_id,p_source_id,p_expected_content_version,p_expected_access_version,true);
  perform private.invalidate_source_reuse(p_workspace_id,p_source_id);
  update private.source_revisions set title = null,body = null,erased_at = clock_timestamp()
    where workspace_id = p_workspace_id and source_id = p_source_id and erased_at is null;
  update private.source_excerpts set body = null,erased_at = clock_timestamp()
    where workspace_id = p_workspace_id and source_id = p_source_id and erased_at is null;
  update private.sources set title = '[Deleted]',brand_id = null,client_authority_confirmed = false,
    expires_at = null,state = 'deleted',deleted_at = clock_timestamp(),access_version = access_version + 1 where id = source.id;
  -- Active text is erased atomically. External backup/restore propagation stays
  -- pending for the step 1.8 independent-ledger pipeline, never falsely complete.
  insert into private.erasure_ledger(workspace_id,subject_user_id,source_id,reason_code)
    values(p_workspace_id,source.creator_user_id,p_source_id,'source_active_text_erased');
  return private.complete_access_command(p_workspace_id,p_request_id,private.current_actor_id(),'source_erase',input,source.id,source.access_version + 1,'custodian_erasure');
end
$$;
revoke all on function private.recover_orphaned_source(uuid,uuid,uuid,bigint,bigint,uuid,text),
  private.erase_private_source(uuid,uuid,uuid,bigint,bigint) from public,anon,authenticated,service_role,cadence_operator;
grant execute on function private.recover_orphaned_source(uuid,uuid,uuid,bigint,bigint,uuid,text),
  private.erase_private_source(uuid,uuid,uuid,bigint,bigint) to cadence_command;
commit;
