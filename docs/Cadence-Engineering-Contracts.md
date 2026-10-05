# Cadence — engineering contracts

Planning document, 5 October 2026; privacy/identity decisions updated 5 October 2026. No application code, migrations, executed SQL or live API tests are represented here.
Use with the phased build plan and [requirements](Cadence-Requirements-and-Decisions.md).
Commercial allowances and role defaults are expanded in [plans and team access](Cadence-Plans-and-Team-Access.md).
Vercel hosts the initial web application; Clerk supplies identity, while Supabase supplies PostgreSQL and private media Storage. See the [privacy architecture](Cadence-Privacy-Architecture.md) for data residency and access controls.
LinkedIn, Facebook, Instagram, TikTok and X/Twitter are available in the launch product; YouTube follows later.
Availability means supported editorial workflows and truthful delivery options, not five verified direct-publishing integrations.
The user accepts manual handoff where automatic delivery needs paid API access or provider approval.
All requested formats are in scope: text, images, carousels, landscape video and vertical video. Provider/account capability determines each actual delivery mode.
Both pilot users have separate logins and are workspace owners; either may explicitly approve their own content.
Free includes three selected networks, one account per selected network (three total), and limited AI alt text plus analytics. Teams includes five total logins, counting owners, with paid additional logins; the extra-seat price is undecided.
AI execution is deferred until project revenue funds it. The initial build deliberately prepares the typed pipeline, persistence, permissions and tests; production generation remains disabled. The eventual web feature uses hosted AI; native releases require tested offline AI.

## Data ownership and storage

Use one SQL migration history under `supabase/migrations/`, generated Supabase database types, and validated application DTOs.
Tenant-owned rows carry `workspace_id`. Composite foreign keys enforce matching tenant/brand relationships alongside RLS.
An authenticated user still needs membership and the relevant brand/source/account permission. Never authorise from editable user metadata.
Store timestamps as `timestamptz`; retain the user's IANA zone, initially `Europe/London`, for display and rescheduling.

| Entity | Ownership, relationship and invariant |
| --- | --- |
| `workspaces`, `workspace_members` | Workspace membership unique on `(workspace_id, user_id)`; DB membership controls access. |
| `app_users` | Internal UUID primary key mapped to a unique immutable Clerk subject string; deletion tombstones prevent webhook replay from restoring an identity. Email is not an authorization key. |
| `workspace_invitations` | Scoped role/account grants, verified intended identity, hashed acceptance secret, expiry and seat reservation; one-time acceptance under workspace control lock. |
| `workspace_plan_assignments`, `plan_catalog_versions` | Server-controlled current plan/version, effective time, origin, trusted additional-seat grant quantity and immutable base limit definitions; no client entitlement writes. Grant changes increment the assignment version and record their operator/billing origin and audit reason. |
| `workspace_account_selection` | Explicit enabled account/network selection within the effective plan; disconnected retained identities and history remain visible. |
| `brands` | Workspace-owned playbook, audience and voice; brand membership added where access is narrower than workspace membership. |
| `sources` | Creator-owned original/imported material, provenance, consent, permitted uses and retention category/expiry. Private by default, versioned and attributable. Workspace ownership alone grants no read access. |
| `source_grants` | Versioned, explicit recipient, resource and purpose scope. Revocation blocks future reads/derivatives and eligible unsent work; it does not retroactively retract content already published externally. |
| `source_excerpts` | Separately reviewed immutable snapshot, with source/version lineage and explicit release grant. Contains no original filename, private URL, transcript or unselected source fields. |
| `erasure_requests` | Requested scope, state, actor, timestamps and completion evidence. Independent deletion ledger survives backup restore; replay before restored data is made available. |
| `media_assets` | Private object key, owner, checksum, MIME/format, size and readiness; approved content references immutable objects. |
| `content_items` | Brand-owned editorial item and current draft/version; destination variants retain their own revisions. |
| `content_revisions` | Append-only typed payload, format, revision number, author, source/media references and destination-independent `content_hash`. |
| `revision_sources` | Links revision to source identity/content version; reuse still requires current permission. |
| `social_accounts` | Brand-owned manual or connected destination identity, connection status and per-account capability matrix; identity cannot be silently reassigned. |
| `approvals` | Exact publication, revision, destination account, destination-bound `approval_payload_hash`, actor, time and revocation record. |
| `publications` | Selected immutable revision and destination, current approval, UTC due time, zone, status, optimistic version and separate machine-readable block reason. |
| `publishing_jobs` | Publication/action, due time, step, attempts, lease token/expiry and durable checkpoint. |
| `publication_attempts` | Append-only attempt/correlation ID, phase, provider references and sanitised result. |
| `audit_events` | Scoped actor/action/object/time; records approval, scheduling, rescheduling, cancellation and recovery decisions. |
| `generation_runs`, `generation_jobs` | Initial AI-ready schema: workspace/actor/task/schema versions, authorised input references, availability/entitlement decision, bounded proposal, queued execution state and lease metadata; no active production execution yet. |
| `ai_quota_reservations` | Initial atomic reservation/settlement structure for future hosted work, with run identity, expiry, policy version and bounded units; disabled admission creates no reservation. |
| Later learning tables | Metric observations, experiments, outcomes and evidence-linked learnings; add when the reporting milestone needs them. |

Keep provider credentials encrypted in a private server-only structure with restricted access and rotation.
Media bytes belong in private Storage, not database rows or large Vercel request bodies. Authorised clients upload directly.
Use new object keys for new content; disable overwrite of approved assets. `contentHash` covers canonical public content, asset keys/checksums and metadata.
`approvalPayloadHash` additionally binds that content hash to the immutable revision and exact provider/destination identity; the two hashes are distinct.
Temporary signed URL tokens are delivery details excluded from both hashes.
Source revocation/deletion must block affected unsent publications pending review and remove future AI eligibility; invalidate dependent derivatives/caches and preserve only permitted minimal audit evidence. Reuse requires an explicit recipient/resource-version/purpose grant; brand membership is insufficient. Recovery of orphaned material is a separate fresh-authenticated, reasoned and custodian-bound audited command.

### Identity, privacy and error contracts

Resolve every session using a verified Clerk token and live protected policy. A validated server context is derived by the authentication boundary; clients cannot provide actor IDs, MFA claims or workspace roles.

```ts
type AuthenticationContext = {
  readonly userId: string;
  readonly clerkSubjectId: string;
  readonly sessionId: string;
  readonly authenticatedAt: string;
  readonly secondFactorVerified: boolean;
};

type AuthenticationPolicy =
  | { readonly mode: "closed_pilot"; readonly allowedSubjects: readonly [string, string]; readonly workspaceId: string }
  | { readonly mode: "mfa_required" };

type SourceGrant = {
  readonly sourceId: string;
  readonly sourceVersion: number;
  readonly recipientUserId: string;
  readonly purpose: "editorial_reuse" | "excerpt_release" | "analytics" | "ai_proposal";
  readonly accessVersion: number;
  readonly revokedAt: string | null;
};
```

These are DTO examples, not shipped application types. Missing/unknown policy denies. `closed_pilot` requires the two configured Clerk subjects, the exact FSS pilot workspace and an active session; it is unavailable to other workspaces. `mfa_required` validates a current second-factor claim on every protected API/Storage route. High-impact commands require a verified session whose authentication time is within ten minutes. MFA requirements do not come from a user-editable claim.

Source commands include explicit-version `share`, `revoke`, `release_reviewed_excerpt`, `recover_orphan` and `erase`. Mutations carry an idempotency key and expected object/access version. Machine-readable failures distinguish `AUTH_REQUIRED`, `MFA_REQUIRED`, `AUTHENTICATION_TOO_OLD`, `SOURCE_ACCESS_DENIED`, `SOURCE_GRANT_REVOKED`, `ERASURE_PENDING` and `VERSION_CONFLICT`; responses reveal no private source metadata to an unauthorised actor. Never turn owner status into implicit source access.

For private media and source responses, set `Cache-Control: no-store`, use private authorised Storage policies and avoid browser persistence. Preview, CI and sample fixtures use synthetic content only until the step 1.8 readiness gate. Accepted schedules remain durable after normal logout but recheck current membership/approval before dispatch.

### Illustrative PostgreSQL relationships

This abbreviated DDL demonstrates tenant/brand consistency. It omits RLS, functions, supporting tables and full state constraints; it is not a migration.

```sql
create table workspaces (id uuid primary key);
create table brands (
  id uuid primary key,
  workspace_id uuid not null references workspaces(id),
  unique (workspace_id, id)
);
create table content_items (
  id uuid primary key,
  workspace_id uuid not null,
  brand_id uuid not null,
  unique (workspace_id, brand_id, id),
  foreign key (workspace_id, brand_id)
    references brands(workspace_id, id)
);
create table content_revisions (
  id uuid primary key,
  workspace_id uuid not null,
  brand_id uuid not null,
  content_item_id uuid not null,
  revision_number integer not null check (revision_number > 0),
  payload jsonb not null,
  content_hash text not null check (content_hash ~ '^[0-9a-f]{64}$'),
  unique (content_item_id, revision_number),
  unique (workspace_id, brand_id, content_item_id, id),
  foreign key (workspace_id, brand_id, content_item_id)
    references content_items(workspace_id, brand_id, id)
);
create table social_accounts (
  id uuid primary key,
  workspace_id uuid not null,
  brand_id uuid not null,
  provider text not null,
  external_account_id text,
  canonical_identity text not null,
  unique (workspace_id, provider, external_account_id),
  unique (workspace_id, provider, canonical_identity),
  unique (workspace_id, brand_id, id),
  foreign key (workspace_id, brand_id)
    references brands(workspace_id, id)
);
create table publications (
  id uuid primary key,
  workspace_id uuid not null,
  brand_id uuid not null,
  content_item_id uuid not null,
  revision_id uuid not null,
  account_id uuid not null,
  version integer not null default 1 check (version > 0),
  scheduled_at timestamptz,
  time_zone text not null default 'Europe/London',
  foreign key (workspace_id, brand_id, content_item_id, revision_id)
    references content_revisions(workspace_id, brand_id, content_item_id, id),
  foreign key (workspace_id, brand_id, account_id)
    references social_accounts(workspace_id, brand_id, id)
);
create index publications_calendar
  on publications(workspace_id, scheduled_at);
```

Full migrations also need immutable-revision enforcement, membership/RLS policies, controlled transitions and approval-scope validation.
Index membership by user/workspace; revisions by item/number; attempts by publication/time; sources by expiry; every hot FK lookup.
Add a partial due-job index on `(run_after, id)` for pending/retry jobs and a unique active publication/action key.
Store populated provider post identifiers uniquely within provider/account scope. Queue uniqueness does not guarantee external exactly-once publication.
Use security-invoker views; privileged functions require restricted `EXECUTE`, fixed `search_path` and explicit caller authorisation.
For RLS updates, apply both `USING` and `WITH CHECK`; tenant reassignment must fail. Run database security advisors when implementation begins.

## Workspace plans, roles and quotas

Plan ownership is the workspace, not the login. The same social accounts, sources and calendar belong to the workspace; members act with their own identities.
Assign the internal FSS workspace a complimentary Teams plan through an authorised operator action. No billing provider, checkout or payment collection is needed now.
The following commercial allowances distinguish confirmed quantities from remaining proposed defaults:

| Plan | Networks | Accounts per network | Users | Future AI entitlement |
| --- | --- | --- | --- | --- |
| Free | Up to three selected launch networks | One enabled account per selected network, three total | **Proposed:** one | Limited alt text and analytics when released |
| Creator | All five launch networks | One enabled account per network | **Proposed:** one | Yes |
| Professional | All five launch networks | Unlimited enabled accounts | **Proposed:** one | Yes |
| Teams | All five launch networks; multiple users share accounts | Inherits Professional unlimited accounts | Five included seats, including owners; paid additions. FSS pilot uses two | Yes |

Unlimited account connections do not confer unlimited AI compute, media storage, schedules or provider access. Define those allowances separately before public pricing.
Operational AI/media/job-rate controls must not silently impose a numeric account cap on the Professional plan's unlimited account allowance.
Do not invent numeric AI allowances while inference is deferred. A plan entitlement does not activate an unavailable feature.
Solo-plan user counts, extra-seat price and the public capacity-reduction policy remain explicit product decisions. Free's three networks/three accounts (one per network)/limited AI categories and Teams' five included seats are confirmed. Teams inherits Professional plus owner/admin/editor/publisher roles.
**Proposed commercial safeguard:** one active solo workspace per user/subscription, plus explicitly invited Teams access; do not offer unlimited self-service Free workspaces that bypass its network/account allowance. Confirm before public launch.

| Membership role | Proposed permissions |
| --- | --- |
| Owner | Workspace settings, members, permitted account connections, editorial work and explicit approval/scheduling; cannot assign own paid entitlement. |
| Admin | Invite/manage non-owner members, account administration, editorial work and publishing, excluding ownership transfer or operator-only plan grants. |
| Editor | Permitted sources, drafts and revisions; no approval, scheduling or account credentials. |
| Publisher | Editorial work, explicit approval, scheduling, cancellation and manual confirmation for assigned accounts; no member/connection administration. |
| Viewer (**recommended addition**) | Read permitted calendar, content and results; no mutations or AI task submissions. |

Implement owner/admin/editor/publisher permissions and negative tests in the first build, even though both pilot users are owners; Viewer remains a recommended addition. Neither users nor models receive another member's password.
Workspace membership can be narrowed by account/brand assignment. Every operation intersects live membership, action permission and accessible objects.
The operator privilege that grants plans is separate from workspace ownership and cannot be added through normal member management.
Preserve at least one active owner: role change, member removal and explicit owner transfer take the same workspace control lock and reject the last-owner transition. Admins cannot transfer or remove ownership.

```ts
type PlanCode = "free" | "creator" | "professional" | "teams";
type LaunchNetwork = "linkedin" | "facebook" | "instagram" | "tiktok" | "x";
type QuantityLimit = { kind: "finite"; maximum: number } | { kind: "unlimited" };
type FeatureAvailability = "deferred" | "enabled" | "temporarily_unavailable";
type WorkspacePlanDto = {
  workspaceId: string; plan: PlanCode; assignmentVersion: number; catalogVersion: string;
  effectiveAt: string; origin: "pilot_comp" | "operator" | "billing";
  networks: { limit: QuantityLimit; selected: readonly LaunchNetwork[] };
  accountsPerNetwork: QuantityLimit; users: QuantityLimit; additionalSeats: number;
  usage: { enabledAccounts: Readonly<Record<LaunchNetwork, number>>; activeMembers: number; reservedInvites: number };
  ai: { entitled: boolean; allowedFeatures: readonly AiFeatureKey[]; availability: FeatureAvailability };
};
```

`QuantityLimit.maximum` is a validated non-negative integer; a finite limit must never use `-1` to mean unlimited.
The resolved Teams seat limit is `5 + additionalSeats`; `additionalSeats` is a validated non-negative integer from trusted grants and is zero for non-Teams plans. Protected internal operations assign grants now; later only verified billing events or authorised operations update them. Client requests cannot grant capacity. Count active memberships, including owners, plus reserved unexpired invitations. Expired/revoked invitations release capacity; acceptance converts a reservation to active membership without counting twice.
`networks.selected` is the allowed current selection, not a claim that direct publishing works on those networks. Provider capabilities remain separate.
`ai.availability` is the suite gate; the task registry also checks each feature's release/modality state, so releasing captions cannot accidentally enable unfunded trend or video tasks.
`ai.entitled` means at least one AI category is eligible, not access to every task. Free's recommended `allowedFeatures` are `alt_text`, `analytics_summary`, `period_comparison`, `topic_format_learning` and `video_retention_diagnosis`; other keys require Creator or above. Server policy resolves the feature list and quotas, and every task rechecks its exact feature. No client boolean, task-family substitution or diagnostic follow-up can unlock caption/script generation.
Return plan/usage through `GET /api/v1/workspaces/{id}/plan`; require membership, expose no credentials and accept no client-supplied entitlement overrides.
Illustrative current FSS response includes `plan:"teams"`, `origin:"pilot_comp"`, `accountsPerNetwork:{kind:"unlimited"}`, `users:{kind:"finite",maximum:5}`, `additionalSeats:0`, `usage:{enabledAccounts:{linkedin:0,facebook:0,instagram:0,tiktok:0,x:0},activeMembers:2,reservedInvites:0}` and `ai.entitled:true`, with all registry keys in `ai.allowedFeatures` and `ai.availability:"deferred"`. The sample account counts are illustrative, not an inventory of connected FSS accounts.
There is no public self-upgrade route now. An internal operator command accepts workspace, catalog/plan, expected assignment version, effective time and reason; validates configured limits and writes an audit event.
Later verified billing events may call that same service, with event deduplication; a checkout success URL or client flag is not entitlement evidence.

Illustrative server read below assumes one current effective assignment row per workspace, active membership status and immutable catalog JSON. Bind `$2` from the verified session, never a request's user ID; future changes advance the current row only in the effective-change transaction.

```sql
select p.workspace_id, p.plan_code, p.assignment_version,
       p.catalog_version, p.effective_at, p.origin, c.limits
from workspace_plan_assignments p
join workspace_members m on m.workspace_id = p.workspace_id
  and m.user_id = $2 and m.status = 'active'
join plan_catalog_versions c on c.version = p.catalog_version
  and c.plan_code = p.plan_code
where p.workspace_id = $1 and p.effective_at <= now();
```

No row maps to inaccessible/not found. Validate catalog limits and the trusted additional-seat quantity against the DTO schema; resolve `users.maximum` from the base five plus grants and read enabled-account/member/unexpired-reserved-invite counts in the same consistent read. The abbreviated SQL omits grant resolution. Quota admission uses locks below, not this non-locking display query.
Account-selection mutations require owner/admin permission, an idempotency key, `expectedAssignmentVersion`, selected network/account IDs and acknowledgement of previewed blocked publications; reject inaccessible identities or unpermitted catalog choices.

### Atomic admission and effective changes

1. Lock the workspace access/plan control row before quota admission, privileged mutations or effective membership/plan changes. Where publications also need locks, always take workspace control first, then publication IDs in consistent order.
2. Re-read the current assignment, actor membership and catalog limits inside that transaction; count active identities/reserved seats under the same lock.
3. Resolve the provider's stable external identity before final connected-account admission. Enforce uniqueness on `(workspace_id, provider, external_account_id)` when populated.
   Manual destinations require a normalised provider/profile identity and user attestation; reserve quota through unique `(workspace_id, provider, canonical_identity)`. Reconcile aliases when a verified provider ID becomes available, preserving history.
4. Reconnecting an existing identity updates its grant and consumes no new slot. Multiple labels/brands must not duplicate one provider identity to evade limits.
5. Count enabled manual destinations and OAuth-linked accounts alike; manual delivery and format aliases cannot bypass limits. Enabled disconnected accounts keep their slot until explicitly disabled; disabling releases future-use capacity but preserves history. Re-enabling is a new quota admission.
6. Validate quotas again when an OAuth callback commits its connection; an earlier successful initiation cannot reserve unlimited capacity. Return a clear limit error and retain no unnecessary rejected credential.
7. Creator admission checks the count within that provider; Free admission checks at most three selected networks and the confirmed one-account-per-network limit (three total). Professional bypasses only finite account-count checks.
8. Teams member invitation and acceptance use bounded, expiring seat reservations; serialise both operations to prevent concurrent oversubscription. Five included seats plus trusted grants must cover active members and reserved unexpired invitations, counting all owners. Accept once by converting the reservation; expire/revoke once to release it. Neither a client quantity nor an unverified payment redirect changes the allowance.
9. Critical mutations and dispatch read current database membership/entitlements under the same access-control lock; client state, editable metadata or stale JWT plan claims cannot grant access. Effective member removal blocks subsequent privileged mutations immediately.
10. Apply a downgrade/switch only after its effective selection is explicit: chosen retained network/accounts/seats, effective time and acknowledgement. Keep historical data and authorised export/read access.
11. At the effective change, mark excess accounts disabled and queued unsent jobs blocked; recheck enabled account, plan version and actor authority immediately before dispatch. Never silently publish from a disabled account.
12. In-flight attempts retain their frozen approval and reconcile external outcomes; downgrade cannot retract a dispatched post. Audit the change, affected jobs and later re-enablement; do not automatically restart blocked jobs.
13. A paid-seat cancellation never deletes content or silently removes members and cannot orphan the last owner. Define public effective-date/grace/member-selection policy before commercialisation. Until it exists, reject internal reductions below active plus reserved unexpired seats; an owner resolves excess membership/invitations explicitly under the same lock before the lower capacity takes effect.

Exposed membership/content tables use least-privilege grants and RLS. Plan assignment mutations and quota-control functions are server-only, authorise callers explicitly and prevent alternate direct-write paths.
[Supabase's current RLS guidance](https://supabase.com/docs/guides/database/postgres/row-level-security) supports both grants and row policies; JWT metadata does not replace fresh workspace state.
Required implementation tests: simultaneous last-slot connections, reconnect identity, rejected callback, Free's fourth-network denial and second-account-on-one-network denial, stale assignment, fifth-seat invitation races, sixth seat without/with a trusted grant, invitation acceptance/expiry without double-counting, client seat-grant denial, non-destructive capacity reduction/last-owner protection, downgrade before/after dispatch and cross-workspace plan edits.

## Publishing types and capabilities

Provider input/output is validated at the adapter boundary. Do not persist arbitrary successful HTTP responses as proof of publication.
Capabilities are per account and format: `supported`, `unsupported`, `permission_required` or `unverified`.
Assess publishing, status lookup, analytics and AI-data eligibility separately. Preserve last-check time, grant scopes and connection expiry.
Record delivery mode (`manual`/`direct`) and budget gate (`available`/`blocked`/`not_assessed`) separately; paying a fee does not verify a capability.

```ts
type PublicationStatus =
  | "draft" | "approved" | "scheduled" | "publishing" | "processing"
  | "published" | "failed" | "outcome_unknown"
  | "cancel_requested" | "cancelled" | "manual_required";
type PublicationBlock = {
  code: "PLAN_LIMIT_REACHED" | "ACCOUNT_DISABLED" | "SOURCE_USE_REVOKED"
    | "MEMBER_PERMISSION_REVOKED" | "CAPABILITY_UNAVAILABLE" | "APPROVAL_INVALID" | "LATENESS_REVIEW_REQUIRED";
  since: string;
  permittedRecoveryActions: readonly ("manage_accounts" | "review_sources" | "reapprove" | "reconnect" | "reschedule" | "revalidate")[];
};
type ProviderPostReference = { kind: "post"; id: string };
type ProviderReference = ProviderPostReference | { kind: "operation"; id: string };
type TerminalEvidence = { checkedAt: string; method: "terminal_create_response" | "status_lookup"; visibilityMatchesApproval: true };
type MediaReference = { objectKey: string; sha256: string; altText?: string };
type PublishPayload = {
  text: string;
  format: "text" | "image" | "carousel" | "video";
  media: readonly MediaReference[];
  metadata: Readonly<Record<string, unknown>>;
};
type ApprovedPublication = {
  publicationId: string; revisionId: string; accountId: string;
  approvalId: string; contentHash: string; approvalPayloadHash: string; payload: PublishPayload;
};
type PublishResult =
  | { kind: "published"; reference: ProviderPostReference; evidence: TerminalEvidence; url?: string }
  | { kind: "processing"; reference: ProviderReference; checkAfter: string }
  | { kind: "outcome_unknown"; reference?: ProviderReference }
  | { kind: "failed"; code: string; disposition: "safe_retry" | "reconnect" | "permanent" };
type ReconciliationResult = PublishResult | { kind: "manual_verification_required" };
type ServerAccountContext = { accountId: string; externalAccountId: string; accessToken: string };
interface PublishingAdapter {
  publish(input: ApprovedPublication, account: ServerAccountContext, attemptId: string): Promise<PublishResult>;
  reconcile(reference: ProviderReference | undefined, account: ServerAccountContext, attemptId: string): Promise<ReconciliationResult>;
}
```

These are illustrative contracts, not shipped interfaces. Concrete formats receive strict provider-specific runtime schemas before support is enabled.
The service constructs `ApprovedPublication` from validated database state; accepting that shape from a client does not establish approval.
The adapter receives only its account's server-side credentials. Never serialise this context into client responses, AI inputs or logs.
Checkpoint large uploads/container creation before later steps; a processing result must not be presented as a verified public post.
`published` requires a post identifier and documented terminal-create or status evidence matching the approved audience/visibility; operation/upload acceptance stays `processing`.
If API permissions cannot resolve an uncertain outcome, request manual verification rather than recreating the post.

## Versioned REST API

Routes authenticate and validate, then delegate to scoped services. JSON DTOs use UUID identifiers, bounded strings, validated ISO dates and explicit formats.
The browser authenticates with Clerk. The supported Clerk-to-Supabase third-party integration supplies verified token identity; internal user UUIDs map to unique Clerk subject IDs. Server operations resolve live database membership, role, grants and plan entitlement on every protected command. Invite-only pilot; no anonymous publication mutations. Never use Clerk public metadata as an authorisation source.
Mutations carry `expectedVersion` where they change an existing object. Scope idempotency keys to actor/workspace/operation and request hash.
Repeated identical keys return the existing result; the same key with different input returns `409 IDEMPOTENCY_CONFLICT`.
Require idempotency keys for revision, approval, schedule, cancellation and manual-confirmation mutations; reject unexpected DTO fields.
Also require them for manual account creation, account selection, invitations, invite acceptance, role changes/removal and revalidation. Membership commands use the target membership/invitation version plus current assignment version where quota changes; actor/tenant identity comes from the verified session/path scope.

| Runtime schema | Required validation |
| --- | --- |
| Approval | Positive integer version, UUID revision/account IDs, lowercase 64-character `approvalPayloadHash`; recompute from content hash/revision/destination. |
| Schedule | Positive version, UUID approval ID, UTC ISO timestamp, recognised IANA zone; explicit handling of past/ambiguous times. |
| Revision | Discriminated provider/format payload with that route's current limits, accessible source/media IDs and whitelisted metadata. |
| Media completion | Owned pending upload, trusted verification of actual bytes/type/size/integrity; client declarations alone cannot mark it ready. |
| Provider result | Discriminated result kind, bounded identifiers, validated timestamps and safe status/error mapping. |
| Member/invitation command | Explicit role enum, positive membership/invitation/assignment versions as applicable, accessible bounded grants and current owner/admin authority; no last-owner removal or admin owner transition. |
| Manual account | Recognised launch provider, owned brand, normalised provider profile identity, user attestation and positive assignment version; manual identity does not itself verify OAuth posting rights. |

| Method and route | Contract |
| --- | --- |
| `GET /api/v1/brands` | Accessible brands/playbooks. |
| `GET /api/v1/workspaces/{id}/plan` | Effective assignment, finite/unlimited limits, scoped usage and feature availability; read only. |
| `POST /api/v1/workspaces/{id}/account-selection` | Authorise current plan/version and explicitly select enabled accounts/network; atomically apply quotas and block affected unsent jobs. |
| `POST /api/v1/workspaces/{id}/invitations` | Owner/admin invites a non-owner role with bounded account/brand grants; validate Teams allowance and atomically reserve a seat. |
| `POST /api/v1/invitations/{id}/accept` | Signed-in verified intended recipient presents acceptance secret in the body; check hash/expiry/version, current inviter authority and effective seat policy; consume reservation once. |
| `PATCH /api/v1/workspaces/{id}/members/{userId}` | Owner/admin changes permitted non-owner role/scope using expected membership version; ownership transitions use the separate owner command. |
| `DELETE /api/v1/workspaces/{id}/members/{userId}` | Owner/admin removes permitted membership under version/control lock (`If-Match` membership version); only an owner may remove another owner, preserving the last owner; block unsent work and preserve outcomes. |
| `POST /api/v1/workspaces/{id}/owner-transfer` | Separate explicitly authorised owner command, verified target member/version and last-owner protection; admin cannot invoke it. |
| `POST /api/v1/sources` | Capture source metadata/text with ownership and permitted-use fields. |
| `POST /api/v1/media/uploads` | Authorised direct-upload instruction; completion must verify readiness. |
| `POST /api/v1/media/{id}/complete` | Finalise owned upload after size/type/checksum checks. |
| `POST /api/v1/content` | Create editorial item in an accessible brand. |
| `POST /api/v1/content/{id}/revisions` | Create immutable validated revision with evidence/media references. |
| `POST /api/v1/publications` | Select exact revision and destination; return draft publication/version. |
| `POST /api/v1/publications/{id}/approve` | Explicit approval of exact revision/account/hash; self-approval allowed in pilot. |
| `POST /api/v1/publications/{id}/schedule` | Validate current approval and atomically create/update durable job. |
| `POST /api/v1/publications/{id}/cancel` | Cancel unstarted work or record cancellation request for in-flight work. |
| `POST /api/v1/publications/{id}/manual-confirmation` | User verifies manual publication with URL/identifier/evidence when available. |
| `POST /api/v1/publications/{id}/revalidate` | Authorised publisher/owner explicitly rechecks every block, current approval/permissions/plan and lateness policy using expected version; audited clearance, no external create in this request. |
| `GET /api/v1/publications/{id}` | Status, revision, schedule, nullable `blockedReason`, permitted attempts and actionable recovery options. |
| `GET /api/v1/calendar?from=...&to=...&zone=...` | Scoped calendar query with bounded date range. |
| `POST /api/v1/accounts/{provider}/connect` | Authorised OAuth initiation with server-held state/PKCE where applicable. |
| `POST /api/v1/accounts/manual` | Owner/admin creates a provider/profile destination with normalised identity, brand grant, attestation and assignment version; same atomic account/network quota as OAuth. |
| `GET /api/v1/accounts/{provider}/callback` | Verify state, exchange grant and associate exact permitted account. |
| `GET /api/internal/publish/sweep` | Cron-secret authenticated bounded consumer; not a user endpoint. |

Approval request, after the user sees the exact revision/destination/media, includes `Idempotency-Key: <unique-request-key>`:

```json
{"expectedVersion":3,"revisionId":"<revision-uuid>","accountId":"<account-uuid>","approvalPayloadHash":"<64-character-sha256>"}
```

The placeholders denote validated UUID/hash fields; the service recomputes `contentHash`, then the destination-bound `approvalPayloadHash`.
Example successful approval response: `201` with `{"approvalId":"<approval-uuid>","publicationId":"<publication-uuid>","version":4,"status":"approved"}`.
Scheduling request includes `Idempotency-Key: <unique-request-key>`:

```json
{"expectedVersion":4,"approvalId":"<approval-uuid>","scheduledAt":"2026-10-07T08:00:00Z","timeZone":"Europe/London"}
```

Example scheduling response: `202` with `{"publicationId":"<publication-uuid>","version":5,"status":"scheduled","scheduledAt":"2026-10-07T08:00:00Z","timeZone":"Europe/London"}`.
This represents server-accepted scheduling, not successful publication. The calendar displays 09:00 BST for that timestamp.
Rescheduling uses the same route/new key/current version. Time changes are explicitly authorised and audited; unchanged public content does not require blanket reapproval.
Changing revision, destination or public media/metadata invalidates the pending approval and requires a new explicit approval.

| HTTP | Error examples |
| --- | --- |
| `400` | `VALIDATION_FAILED`, invalid/ambiguous local time requiring explicit offset selection. |
| `401` | `AUTHENTICATION_REQUIRED`. |
| `403` | `PERMISSION_DENIED`, `ROLE_REQUIRED`, `PLAN_REQUIRED` for a visible object/action. |
| `404` | `NOT_FOUND` for missing or inaccessible objects; do not disclose other tenants. |
| `409` | `VERSION_CONFLICT`, `APPROVAL_REQUIRED`, `IDEMPOTENCY_CONFLICT`, `OUTCOME_UNKNOWN`, `PLAN_LIMIT_REACHED`, `LAST_OWNER_REQUIRED`. |
| `422` | `CAPABILITY_UNAVAILABLE`, `MEDIA_NOT_READY`, `SOURCE_USE_NOT_PERMITTED`, `FEATURE_NOT_RELEASED`, `FEATURE_UNAVAILABLE`. |
| `429` | `RATE_LIMITED` with bounded retry guidance. |
| `503` | `DEPENDENCY_UNAVAILABLE` without claiming an uncertain provider create failed safely. |

Error envelope: `{"error":{"code":"VERSION_CONFLICT","message":"This post changed. Review the latest version.","requestId":"<correlation-id>"}}`.
Do not return raw provider secrets/errors. Connection status and recovery actions can show `RECONNECT_REQUIRED` without exposing credentials.
Invitation secrets are body-only, stored hashed, short-lived and excluded from logs; do not trust a caller-supplied email to prove recipient identity. Scope role grants to the inviter's authority and recheck that authority at acceptance.
Test expired/withdrawn/replayed invitations, a different verified recipient, revoked inviter, quota changes and concurrent last-owner removal/demotion. Invalid or inaccessible invitations do not disclose workspace or member details.
`blockedReason` is separate from publication status, preserving approved/scheduled history while the job is blocked. Responses explain code/time and only the viewer's permitted recovery actions.
Restored plan/source/member permission does not automatically restart blocked work. Explicit revalidation checks current approval/hash/source/media/account/plan/member state and overdue policy, audits the new scheduling authority and clears the block only when all checks pass; past times require an explicit publish-now or reschedule decision.

## Transaction, lease and permission rules

1. Lock workspace access/plan control, then publication; verify live membership/action permission and optimistic version. Do not trust a client-supplied workspace or approval assertion.
2. Verify selected revision/account and recomputed `approvalPayloadHash` match an unrevoked approval; validate current source/media permission, account health, enabled plan selection and selected capability.
3. Atomically commit publication schedule plus its active job. Roll back both if any invariant fails; no external API call occurs in this transaction.
4. Claim due work using atomic row locking/claim updates, with lease token, expiry and attempt checkpoint. Commit before network calls.
5. Query outstanding `run_after <= now()` jobs; apply an explicit lateness policy rather than looking only at this cron minute.
6. In a short transaction, lock workspace access/plan control then publication, verify lease/cancellation/approval/permission state, current membership and enabled account/plan, then atomically record `dispatch_started`. Cancel/revoke/edit commands use the same lock order.
7. Commit the dispatch checkpoint before HTTP; never hold a database transaction over network calls. Later cancellation is a request, not a guarantee the external effect can be prevented.
   Freeze the in-flight revision/account/hash; further edits create unsent draft work rather than replacing the dispatched attempt's approved snapshot.
8. Persist provider identifiers promptly and condition completion on the lease token. Expired workers cannot overwrite a newer claim's state.
9. A lost response or expired lease after dispatch enters reconciliation/`outcome_unknown`; absence of a saved post ID does not prove failure.
10. Retry only demonstrably safe failures/steps with bounded backoff and provider rate-limit guidance. Never blindly repeat uncertain post creation.
11. Cancellation after dispatch is `cancel_requested` until the external outcome is known; published content cannot be represented as locally cancelled.
12. Manual confirmation records the user and evidence/URL, marks the route manual, and resolves the job without silently triggering a new API create.
13. Scope worker access and audit state changes. Keep session-level advisory locks out of transaction-pooled Vercel connections.

Test duplicate/overlapping cron, stale leases, response loss after success, approval edits, revocation, cancellation races, DST, missing media and two-user conflicts.
Restore drills include database, Storage objects and encryption-key dependencies; Supabase database backups do not themselves restore media objects.
Future native offline edits synchronise with version checks. A native schedule becomes accepted only after online server acknowledgement.

## AI-ready pipeline — prepared first, activated when funded

This section specifies code/schema to build during the first implementation phase; this planning task has not implemented or executed it.
Prepare the task registry, input builder, generation-run/job persistence, quota service, result validation and proposal-acceptance flow now. Keep production availability `deferred`, with no active runner, downloaded model, paid API or automatic generation.
Use test-only fake providers with fixed fixtures to verify the full pipeline; they are not a production model or user-visible generated result.
The earlier nine task examples represented initial families, not the full catalogue. Prepare stable keys and shared contracts for all [33 capabilities](Cadence-AI-Capability-Roadmap.md) in the first feature registry; each key maps to a family, versioned input/output schema, required modality, data policy, role, allowance and release gate.

```ts
import type { VideoDiagnosisInput } from "@cadence/analytics/video-evidence";

type AiFeatureKey =
  | "brand_playbook" | "caption" | "hook_cta" | "rewrite_translate"
  | "platform_adaptation" | "evidence_ideas" | "source_repurpose" | "carousel_copy"
  | "video_brief" | "alt_text" | "bio" | "seo_name" | "search_terms"
  | "claim_review" | "brand_accessibility_review" | "analytics_summary" | "video_retention_diagnosis"
  | "period_comparison" | "topic_format_learning" | "posting_time_experiments"
  | "next_post" | "experiment_design" | "content_gaps" | "evergreen_refresh"
  | "niche_opportunities" | "trend_fit" | "audience_questions" | "response_drafts"
  | "transcript_capture" | "subtitles" | "media_tags_ocr" | "clip_recommendations" | "weekly_pack";
type AiTaskFamily = "text" | "alt_text" | "insights" | "structured_copy"
  | "transcript" | "subtitles" | "media_annotations" | "clip_suggestions" | "calendar_plan";
type GenerationStatus = "queued" | "running" | "succeeded" | "failed" | "cancelled";
type EvidenceReference = { id: string; kind: "source" | "media" | "metric" | "trend"; version: string };
type TimedText = { startMs: number; endMs: number; text: string };
type AuthorisedAiInput = {
  workspaceId: string; actorId: string; family: AiTaskFamily; inputSchemaVersion: string;
  brandId: string; playbookVersion: string; evidence: readonly EvidenceReference[];
  context: readonly { evidenceId: string; permittedExcerpt: string }[];
  media: readonly { kind: "image" | "audio" | "video"; assetId: string; sha256: string; mimeType: string }[];
  constraints: { language: string; maximumOutputCharacters: number };
} & (
  | { feature: Exclude<AiFeatureKey, "video_retention_diagnosis">; taskData?: never }
  | { feature: "video_retention_diagnosis"; family: "insights"; taskData: VideoDiagnosisInput }
);
type AiProposal =
  | { kind: "text_suggestions"; suggestions: readonly string[]; evidenceIds: readonly string[] }
  | { kind: "alt_text"; assetId: string; text: string; evidenceIds: readonly string[] }
  | { kind: "insights"; insights: readonly { statement: string; evidenceIds: readonly string[]; limitations: string }[] }
  | { kind: "video_retention_diagnosis";
      interpretations: readonly { factIds: readonly string[]; hypothesis: string;
        alternatives: readonly string[]; limitations: readonly string[]; transcriptSegmentIds: readonly string[] }[];
      experiments: readonly { factIds: readonly string[]; changeToTest: string;
        measureDefinitionId: string; comparisonPlan: string; limitations: readonly string[] }[] }
  | { kind: "structured_copy"; sections: readonly { sequence: number; title: string; text: string; evidenceIds: readonly string[] }[] }
  | { kind: "transcript"; assetId: string; language: string; segments: readonly TimedText[] }
  | { kind: "subtitles"; assetId: string; language: string; cues: readonly TimedText[] }
  | { kind: "media_annotations"; assetId: string; tags: readonly string[];
      visibleText: readonly { text: string; box: { x: number; y: number; width: number; height: number } }[] }
  | { kind: "clip_suggestions"; assetId: string;
      clips: readonly { startMs: number; endMs: number; title: string; reason: string; evidenceIds: readonly string[] }[] }
  | { kind: "calendar_plan"; timeZone: string;
      entries: readonly { localDate: string; localTime?: string; accountId: string; proposedText: string; evidenceIds: readonly string[] }[] };
type GenerationResult = {
  feature: AiFeatureKey; outputSchemaVersion: string; proposal: AiProposal; modelVersion: string;
  runtimeVersion: string;
  measuredUsage: { kind: "measured"; quantities: readonly {
    unit: "input_tokens" | "output_tokens" | "audio_ms" | "video_ms" | "images"; quantity: number;
  }[] } | { kind: "unavailable" };
};
interface GenerationProvider {
  generate(input: AuthorisedAiInput, signal: AbortSignal): Promise<GenerationResult>;
}
```

Runtime schemas validate bounded inputs/outputs, permitted task variants, actual owned evidence IDs and task/output correspondence; TypeScript alone does not validate model output.
Registry definitions must cover every `AiFeatureKey`; the proposal union is a shared family envelope, while each feature's schema enforces its exact structure and limits. Synthetic fixtures cover all catalogue keys without activating their executors.
Feature schemas bound excerpt size, media bytes/duration/frame count, output items and task runtime as applicable. Usage comes from validated executor/provider measurements, not generated text; convert units under the versioned quota policy, and reconcile unavailable measurements rather than treating them as zero.
Validate timed segments/cues/clips against the selected media duration, ordering and permitted bounds; OCR boxes use bounded normalised coordinates. Calendar proposals use validated dates/IANA zones and explicit DST handling before normal scheduling commands.
Transcription/ASR, image/OCR inference, subtitle export/rendering, media decoding/clipping and recurring pack executors remain separately funded/evaluated implementations; shared job states, typed proposals and review interfaces are prepared now.
Only the server input-builder service constructs `AuthorisedAiInput` after live membership/action checks. Client-supplied fields with that type do not establish authorisation.
Include only specifically permitted content; do not send tokens, membership data, private unrelated sources or unrestricted provider API responses to a model.
Prepare typed media references, checksum/size/MIME validation and modality requirements now. Later execution resolves approved private assets through authorised transport and uses a provider supporting that modality; filename-only alt text cannot be treated as visual inspection.
No active quota policy means execution remains unavailable; neither Free's limited feature eligibility nor a Creator entitlement activates unbounded AI work.
Trend/analytics inputs carry permitted evidence provenance, observation/source time, sample limitations and policy eligibility. Provider-derived data is included only where policy permits that exact AI use.
`video_retention_diagnosis` uses the `insights` family with its dedicated proposal branch and structured `taskData:VideoDiagnosisInput` contract in the [coach specification](Cadence-Video-Analytics-Coach.md). The proposed shared analytics package exports that type and runtime schema; the import above describes a future workspace export, not an installed module. The server input builder supplies numeric `RetentionFact` records, definition/snapshot/cohort/policy metadata and aligned timed segments with IDs, or an explicit missing/unaligned state. The provider returns bounded interpretations/experiments; the server attaches existing computed facts to form the full `VideoDiagnosis` report. Timestamp ranges and numeric facts come from code, not generated strings; missing curves/transcripts cannot become inferred evidence. Replacement copy, clip selection/rendering and general transcription remain separate tasks.

| Boundary | Initial implementation requirement |
| --- | --- |
| Task registry | Exhaustive 33 stable feature keys mapped to family, versioned task/input/output schemas, modalities, role requirement, data categories, bounded budget class and acceptance target. |
| Input builder | Verify accessible brand/source/media/account evidence and consent/policy; construct bounded context from permitted originals or eligible observations. |
| Availability/entitlements | Intersect the exact feature allow-list (limited Free categories or broader Creator+), release state, member role, source eligibility and finite allowance; read fresh database state. |
| Run/job persistence | Scoped run/task/policy versions, permitted evidence references, idempotency key, status, lease and sanitised errors; encrypted/retained context only when needed. |
| Quota reservations | Lock workspace allowance, reserve once per accepted run, record expiry, settle actual usage or release on safe cancellation/failure; unlimited accounts do not bypass compute limits. |
| Provider interface | Neutral `generate` interface above; test fixtures only initially. Later hosted/native implementations obey the same task and proposal schemas. |
| Proposal acceptance | Validate actor/object version, create a normal content/playbook suggestion or revision only after explicit user acceptance; never grant approval or publish. |

The scaffolded `POST /api/v1/ai/generations` accepts `feature`, accessible `brandId`, `evidenceIds`, constraints and an idempotency key; its registry derives the family/schema, authenticates/authorises first, then returns `422 FEATURE_NOT_RELEASED` while rollout is deferred.
Do not queue production work or consume a reservation for that response. Later accepted admission returns `202` with a run ID; `GET /api/v1/ai/generations/{id}`, `POST /api/v1/ai/generations/{id}/cancel` and `POST /api/v1/ai/generations/{id}/apply` remain workspace/role scoped, with idempotency/version checks for mutations.
Before future queued execution, recheck current plan/membership, evidence consent, availability and reservation validity. Revocation blocks unsent model work; already sent context cannot be recalled.
Persist only validated proposals with evidence/model/runtime/task versions. Missing evidence or invalid output fails safely; an invented trend/metric must not become a stored fact.
Hosted execution leases and reservation settlement need deterministic retry/idempotency tests; uncertain provider billing is reconciled rather than assumed free.
The model has no provider credentials, account-change, approval, scheduling or external publishing authority. Bio/name outputs are recommendations until an authorised user applies them.
No dormant production runner or paid infrastructure is deployed until funding and model evaluation are approved. Funding activates the provider adapter after tests, rather than redesigning the pipeline.
Native offline inference uses the same proposal rules. Hosted access requires server entitlements; offline AI needs a signed, expiring feature-specific grant and an agreed grace policy because immediate remote revocation cannot be guaranteed while offline. Free permits only its released alt-text/analytics features and bounded local usage; premium tasks require the broader grant.

Required pipeline tests before completion of the initial build: Free allow-listed category admission and premium-task denial; direct/family/disguised-follow-up bypass rejection; entitled-but-unreleased response; finite Free quota exhaustion/races; editor generate/draft-only permissions; cross-tenant evidence rejection; expired consent; duplicate reservation/settlement; cancellation and stale lease; invalid output; transcript/time-bin mismatch; unsupported causal/timestamp claims; explicit proposal acceptance; fake fixture cannot enable production generation.
