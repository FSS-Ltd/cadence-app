begin;
create function private.brand_visible(p_workspace_id uuid, p_brand_id uuid)
returns boolean language sql stable security definer set search_path = pg_catalog, private as $$
  select private.workspace_accessible(p_workspace_id)
    and (current_setting('role',true) <> 'cadence_command' or private.current_actor_id() = private.current_user_id())
    and (p_brand_id is null or exists (
    select 1 from private.brands as brand where brand.workspace_id = p_workspace_id and brand.id = p_brand_id
      and exists (select 1 from private.workspace_memberships as member
        where member.workspace_id = p_workspace_id and member.user_id = private.current_user_id() and member.removed_at is null
          and (member.role in ('owner','admin') or exists (
            select 1 from private.brand_assignments as assignment
            where assignment.workspace_id = p_workspace_id and assignment.brand_id = p_brand_id and assignment.user_id = member.user_id)))
  ))
$$;
create function private.source_custodian(p_workspace_id uuid, p_source_id uuid)
returns boolean language sql stable security definer set search_path = pg_catalog, private as $$
  select private.workspace_accessible(p_workspace_id) and exists (
    select 1 from private.sources where workspace_id = p_workspace_id and id = p_source_id
      and coalesce(custodian_user_id, creator_user_id) = private.current_user_id()
  )
$$;
create function private.source_visible(p_workspace_id uuid, p_source_id uuid, p_version bigint, p_purpose private.source_purpose)
returns boolean language sql stable security definer set search_path = pg_catalog, private as $$
  select private.workspace_accessible(p_workspace_id) and exists (
    select 1 from private.sources as source where source.workspace_id = p_workspace_id and source.id = p_source_id
      and source.state in ('private','shared') and (source.expires_at is null or source.expires_at > statement_timestamp())
      and private.brand_visible(p_workspace_id, source.brand_id)
      and (p_purpose is null or p_purpose = any(source.permitted_purposes))
      and (coalesce(source.custodian_user_id,source.creator_user_id) = private.current_user_id()
        or ((p_version is null or p_version = source.content_version) and exists (
          select 1 from private.source_grants as permission where permission.workspace_id = p_workspace_id
            and permission.source_id = source.id and permission.recipient_user_id = private.current_user_id()
            and permission.revoked_at is null and permission.source_version = source.content_version
            and permission.access_version = source.access_version and permission.purpose = p_purpose)))
  )
$$;
create function private.excerpt_visible(p_workspace_id uuid, p_excerpt_id uuid, p_purpose private.source_purpose)
returns boolean language sql stable security definer set search_path = pg_catalog, private as $$
  select private.workspace_accessible(p_workspace_id) and exists (
    select 1 from private.source_excerpts as excerpt join private.sources as source
      on (source.workspace_id,source.id) = (excerpt.workspace_id,excerpt.source_id)
    where excerpt.workspace_id = p_workspace_id and excerpt.id = p_excerpt_id
      and excerpt.revoked_at is null and excerpt.erased_at is null
      and source.state in ('private','shared') and (source.expires_at is null or source.expires_at > statement_timestamp())
      and excerpt.source_version = source.content_version and excerpt.source_access_version = source.access_version
      and private.brand_visible(p_workspace_id,source.brand_id)
      and (p_purpose is null or p_purpose = any(source.permitted_purposes))
      and (coalesce(source.custodian_user_id,source.creator_user_id) = private.current_user_id() or exists (
        select 1 from private.excerpt_grants as permission where permission.workspace_id = p_workspace_id
          and permission.excerpt_id = excerpt.id and permission.recipient_user_id = private.current_user_id()
          and permission.purpose = p_purpose))
  )
$$;
revoke all on function private.brand_visible(uuid,uuid), private.source_custodian(uuid,uuid),
  private.source_visible(uuid,uuid,bigint,private.source_purpose), private.excerpt_visible(uuid,uuid,private.source_purpose)
  from public,anon,authenticated,service_role,cadence_command,cadence_operator;
grant execute on function private.brand_visible(uuid,uuid), private.source_custodian(uuid,uuid),
  private.source_visible(uuid,uuid,bigint,private.source_purpose), private.excerpt_visible(uuid,uuid,private.source_purpose)
  to authenticated,cadence_command;

alter policy sources_authorised_read on private.sources using (
  private.source_visible(workspace_id,id,null,private.current_access_purpose()));
alter policy sources_command_read on private.sources using (
  private.current_actor_id() = private.current_user_id() and private.source_visible(workspace_id,id,null,private.current_access_purpose()));
alter policy source_grants_participant_read on private.source_grants using (
  private.workspace_accessible(workspace_id) and private.source_custodian(workspace_id,source_id));
alter policy grant_command_read on private.source_grants using (
  private.current_actor_id() = private.current_user_id() and private.source_custodian(workspace_id,source_id));

-- Column grants keep private excerpt lineage inaccessible even through direct SQL.
grant select on private.brands,private.brand_playbooks,private.source_revisions to authenticated,cadence_command;
grant select (id,workspace_id,source_version,body,created_at) on private.source_excerpts to authenticated,cadence_command;
create policy brands_read on private.brands for select to authenticated,cadence_command
  using (private.brand_visible(workspace_id,id));
create policy playbooks_read on private.brand_playbooks for select to authenticated,cadence_command
  using (private.brand_visible(workspace_id,brand_id));
create policy revisions_read on private.source_revisions for select to authenticated,cadence_command
  using (erased_at is null and private.source_visible(workspace_id,source_id,version,private.current_access_purpose()));
create policy excerpts_read on private.source_excerpts for select to authenticated,cadence_command
  using (private.excerpt_visible(workspace_id,id,private.current_access_purpose()));

-- Removal must not allow a later invitation to reactivate historical grants.
create function private.remove_member_content_grants()
returns trigger language plpgsql security definer set search_path = pg_catalog, private as $$
begin
  delete from private.brand_assignments where workspace_id = new.workspace_id and user_id = new.user_id;
  update private.source_grants set revoked_at = clock_timestamp()
    where workspace_id = new.workspace_id and recipient_user_id = new.user_id and revoked_at is null;
  delete from private.excerpt_grants where workspace_id = new.workspace_id and recipient_user_id = new.user_id;
  return new;
end
$$;
revoke all on function private.remove_member_content_grants() from public,anon,authenticated,service_role,cadence_command,cadence_operator;
create trigger membership_content_grants_removed after update of removed_at on private.workspace_memberships
  for each row when (old.removed_at is null and new.removed_at is not null)
  execute function private.remove_member_content_grants();
commit;
