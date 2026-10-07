begin;
-- The guard establishes only verified, transaction-local context. Content reads
-- below remain SECURITY INVOKER and must pass table RLS and column grants.
create function private.begin_source_read(p_workspace_id uuid,p_purpose private.source_purpose)
returns void language plpgsql security definer set search_path = pg_catalog, private as $$
begin
  perform private.require_workspace_role(p_workspace_id,array['owner','admin','editor','publisher','viewer']::private.workspace_role[]);
  perform set_config('app.access_purpose',coalesce(p_purpose::text,''),true);
end
$$;
revoke all on function private.begin_source_read(uuid,private.source_purpose) from public,anon,authenticated,service_role,cadence_operator;
grant execute on function private.begin_source_read(uuid,private.source_purpose) to cadence_command;
grant select (search_document) on private.source_excerpts to cadence_command;
create function private.read_source_revision(p_workspace_id uuid,p_source_id uuid,p_version bigint,p_purpose private.source_purpose)
returns jsonb language plpgsql security invoker set search_path = pg_catalog, private as $$
declare source private.sources%rowtype; revision private.source_revisions%rowtype; grants jsonb := null; can_manage boolean;
begin
  perform private.begin_source_read(p_workspace_id,p_purpose);
  if not private.source_visible(p_workspace_id,p_source_id,p_version,p_purpose) then
    raise exception 'SOURCE_ACCESS_DENIED' using errcode = 'P0001';
  end if;
  select * into source from private.sources where workspace_id = p_workspace_id and id = p_source_id;
  select * into revision from private.source_revisions where workspace_id = p_workspace_id and source_id = p_source_id
    and version = coalesce(p_version,source.content_version) and erased_at is null;
  if not found then raise exception 'SOURCE_ACCESS_DENIED' using errcode = 'P0001'; end if;
  can_manage := private.source_custodian(p_workspace_id,p_source_id);
  if can_manage then
    select coalesce(jsonb_agg(jsonb_build_object('recipientId',recipient_user_id,'purpose',purpose) order by recipient_user_id,purpose),'[]'::jsonb)
      into grants from private.source_grants where workspace_id = p_workspace_id and source_id = p_source_id
        and revoked_at is null and source_version = source.content_version and access_version = source.access_version;
  end if;
  return jsonb_build_object('kind','source','id',source.id,'brandId',source.brand_id,'title',revision.title,'body',revision.body,
    'category',source.category,'permittedPurposes',source.permitted_purposes,'contentVersion',source.content_version,
    'revisionVersion',revision.version,'accessVersion',source.access_version,'expiresAt',source.expires_at,
    'visibility',source.state,'isCustodian',can_manage,'grants',grants);
end
$$;
create function private.read_reviewed_excerpt(p_workspace_id uuid,p_excerpt_id uuid,p_purpose private.source_purpose)
returns jsonb language plpgsql security invoker set search_path = pg_catalog, private as $$
declare result jsonb;
begin
  perform private.begin_source_read(p_workspace_id,p_purpose);
  if not private.excerpt_visible(p_workspace_id,p_excerpt_id,p_purpose) then raise exception 'SOURCE_ACCESS_DENIED' using errcode = 'P0001'; end if;
  select jsonb_build_object('kind','excerpt','id',id,'body',body,'reviewedVersion',source_version,'createdAt',created_at)
    into result from private.source_excerpts where workspace_id = p_workspace_id and id = p_excerpt_id;
  return result;
end
$$;
create function private.search_private_library(
  p_workspace_id uuid,p_resource text,p_query text,p_after_id uuid,p_limit integer,p_purpose private.source_purpose
)
returns jsonb language plpgsql security invoker set search_path = pg_catalog, private as $$
declare items jsonb; next_cursor text; search_query tsquery;
begin
  perform private.begin_source_read(p_workspace_id,p_purpose);
  if p_resource is null or p_resource not in ('sources','excerpts','brands') or p_query is null or length(p_query) > 200
    or p_limit is null or p_limit not between 1 and 100 or p_purpose is null then
    raise exception 'INVALID_INPUT' using errcode = 'P0001';
  end if;
  search_query := plainto_tsquery('simple',p_query);
  if p_resource = 'sources' then
    select coalesce(jsonb_agg(value order by id),'[]'::jsonb) into items from (
      select source.id,jsonb_build_object('id',source.id,'title',revision.title,'preview',left(revision.body,240),
        'contentVersion',source.content_version,'accessVersion',source.access_version,'visibility',source.state,
        'isCustodian',private.source_custodian(p_workspace_id,source.id)) as value
      from private.sources as source join private.source_revisions as revision
        on (revision.workspace_id,revision.source_id,revision.version) = (source.workspace_id,source.id,source.content_version)
      where source.workspace_id = p_workspace_id and (p_after_id is null or source.id > p_after_id)
        and private.source_visible(p_workspace_id,source.id,source.content_version,p_purpose)
        and (btrim(p_query) = '' or revision.search_document @@ search_query)
      order by source.id limit p_limit + 1
    ) as page;
  elsif p_resource = 'excerpts' then
    select coalesce(jsonb_agg(value order by id),'[]'::jsonb) into items from (
      select id,jsonb_build_object('id',id,'preview',left(body,240),'reviewedVersion',source_version,'createdAt',created_at) as value
      from private.source_excerpts where workspace_id = p_workspace_id and (p_after_id is null or id > p_after_id)
        and private.excerpt_visible(p_workspace_id,id,p_purpose) and (btrim(p_query) = '' or search_document @@ search_query)
      order by id limit p_limit + 1
    ) as page;
  else
    select coalesce(jsonb_agg(value order by id),'[]'::jsonb) into items from (
      select brand.id,jsonb_build_object('id',brand.id,'name',brand.name,'version',brand.version,'accessVersion',brand.access_version,
        'audience',playbook.audience,'voice',playbook.voice,'guidance',playbook.guidance) as value
      from private.brands as brand join private.brand_playbooks as playbook
        on (playbook.workspace_id,playbook.brand_id,playbook.version) = (brand.workspace_id,brand.id,brand.version)
      where brand.workspace_id = p_workspace_id and (p_after_id is null or brand.id > p_after_id)
        and private.brand_visible(p_workspace_id,brand.id) and (btrim(p_query) = '' or position(lower(p_query) in lower(brand.name)) > 0)
      order by brand.id limit p_limit + 1
    ) as page;
  end if;
  if jsonb_array_length(items) > p_limit then
    next_cursor := items -> (p_limit - 1) ->> 'id';
    select jsonb_agg(value order by ordinal) into items from jsonb_array_elements(items) with ordinality as page(value,ordinal) where ordinal <= p_limit;
  end if;
  return jsonb_build_object('resource',p_resource,'items',items,'nextCursor',next_cursor);
end
$$;
revoke all on function private.read_source_revision(uuid,uuid,bigint,private.source_purpose),
  private.read_reviewed_excerpt(uuid,uuid,private.source_purpose),private.search_private_library(uuid,text,text,uuid,integer,private.source_purpose)
  from public,anon,authenticated,service_role,cadence_operator;
grant execute on function private.read_source_revision(uuid,uuid,bigint,private.source_purpose),
  private.read_reviewed_excerpt(uuid,uuid,private.source_purpose),private.search_private_library(uuid,text,text,uuid,integer,private.source_purpose)
  to cadence_command;
commit;
