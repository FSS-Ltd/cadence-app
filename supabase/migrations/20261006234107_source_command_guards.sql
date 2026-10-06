begin;
create function private.require_source_custodian(
  p_workspace_id uuid,p_source_id uuid,p_content_version bigint,p_access_version bigint,p_allow_expired boolean default false
)
returns private.sources language plpgsql security definer set search_path = pg_catalog, private as $$
declare source private.sources%rowtype;
begin
  perform private.require_workspace_role(p_workspace_id,array['owner','admin','editor','publisher']::private.workspace_role[]);
  select * into source from private.sources where workspace_id = p_workspace_id and id = p_source_id
    and coalesce(custodian_user_id,creator_user_id) = private.current_actor_id();
  if not found then raise exception 'SOURCE_ACCESS_DENIED' using errcode = 'P0001'; end if;
  if source.state in ('erasure_pending','deleted') then raise exception 'ERASURE_PENDING' using errcode = 'P0001'; end if;
  if not p_allow_expired and source.expires_at is not null and source.expires_at <= clock_timestamp() then
    raise exception 'SOURCE_GRANT_REVOKED' using errcode = 'P0001';
  end if;
  if source.content_version is distinct from p_content_version or source.access_version is distinct from p_access_version then
    raise exception 'VERSION_CONFLICT' using errcode = 'P0001';
  end if;
  return source;
end
$$;
create function private.validate_capture_text(
  p_title text,p_body text,p_category private.source_category,p_purposes private.source_purpose[],
  p_client_authority boolean,p_allowed_data_confirmed boolean,p_expires_at timestamptz
)
returns void language plpgsql security invoker set search_path = pg_catalog, private as $$
begin
  if p_title is null or length(btrim(p_title)) not between 1 and 240
    or p_body is null or length(btrim(p_body)) not between 1 and 50000
    or p_category is null or p_allowed_data_confirmed is distinct from true
    or (p_category = 'client_confidential' and p_client_authority is distinct from true)
    or p_client_authority is null or p_purposes is null or cardinality(p_purposes) not between 1 and 4
    or array_position(p_purposes,null) is not null
    or cardinality(p_purposes) <> (select count(distinct purpose) from unnest(p_purposes) as purpose)
    or (p_expires_at is not null and p_expires_at <= clock_timestamp()) then
    raise exception 'INVALID_INPUT' using errcode = 'P0001';
  end if;
end
$$;
create function private.validate_source_recipients(
  p_source private.sources,p_recipients uuid[],p_purposes private.source_purpose[]
)
returns void language plpgsql security invoker set search_path = pg_catalog, private as $$
begin
  if p_recipients is null or cardinality(p_recipients) not between 1 and 25
    or array_position(p_recipients,null) is not null
    or cardinality(p_recipients) <> (select count(distinct recipient) from unnest(p_recipients) as recipient)
    or p_purposes is null or cardinality(p_purposes) not between 1 and 4 or array_position(p_purposes,null) is not null
    or cardinality(p_purposes) <> (select count(distinct purpose) from unnest(p_purposes) as purpose)
    or not (p_purposes <@ p_source.permitted_purposes) then
    raise exception 'INVALID_INPUT' using errcode = 'P0001';
  end if;
  if private.current_actor_id() = any(p_recipients) or exists (
    select 1 from unnest(p_recipients) as recipient where not exists (
      select 1 from private.workspace_memberships as member join private.app_users as person on person.id = member.user_id
      where member.workspace_id = p_source.workspace_id and member.user_id = recipient
        and member.removed_at is null and person.email_verified and person.disabled_at is null
        and (p_source.brand_id is null or member.role in ('owner','admin') or exists (
          select 1 from private.brand_assignments as assignment where assignment.workspace_id = p_source.workspace_id
            and assignment.brand_id = p_source.brand_id and assignment.user_id = recipient))
    )
  ) then raise exception 'SOURCE_ACCESS_DENIED' using errcode = 'P0001'; end if;
end
$$;
create function private.invalidate_source_reuse(p_workspace_id uuid,p_source_id uuid)
returns void language plpgsql security invoker set search_path = pg_catalog, private as $$
begin
  update private.source_grants set revoked_at = clock_timestamp()
    where workspace_id = p_workspace_id and source_id = p_source_id and revoked_at is null;
  update private.source_excerpts set revoked_at = clock_timestamp()
    where workspace_id = p_workspace_id and source_id = p_source_id and revoked_at is null;
end
$$;
revoke all on function private.require_source_custodian(uuid,uuid,bigint,bigint,boolean),
  private.validate_capture_text(text,text,private.source_category,private.source_purpose[],boolean,boolean,timestamptz),
  private.validate_source_recipients(private.sources,uuid[],private.source_purpose[]),private.invalidate_source_reuse(uuid,uuid)
  from public,anon,authenticated,service_role,cadence_command,cadence_operator;
commit;
