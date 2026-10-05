# Cadence — plans, accounts and team access

Updated 5 October 2026. Product/engineering specification only; no billing, application code or live plan assignments have been implemented.
Use with the [phased plan](plans/2026-10-05-cadence.md), [requirements](Cadence-Requirements-and-Decisions.md) and [engineering contracts](Cadence-Engineering-Contracts.md).

## Confirmed scope

- Launch networks: LinkedIn, Facebook, Instagram, TikTok and X/Twitter. YouTube is a later addition.
- Jean and his wife have separate Cadence logins. Multiple social accounts per network must be supported by the product and allowed according to the workspace's plan.
- Plan families: Free, Creator, Professional and Teams. Free has limited alt-text/analytics AI eligibility; Creator unlocks the broader AI catalogue when funded and released.
- Free includes up to three selected launch networks, one account per selected network and three total accounts. Teams includes five total logins, including owners; each additional login is a paid addition, with its price undecided.
- Desired content includes images, text-only posts, carousels and landscape/vertical video. Each destination's native/API formats are verified independently.
- Prepare plan enforcement during the first build; public pricing, checkout and billing provider remain undecided.

## Plan matrix

| Plan | Networks | Social accounts | Collaboration | AI entitlement |
| --- | --- | --- | --- | --- |
| Free | Up to three selected launch networks | One account per selected network, three total | **Proposed:** one user | Limited alt-text generation and analytics when funded/released |
| Creator | All five launch networks | One account per network | **Proposed:** one user | Yes, once the funded feature is released |
| Professional | All five launch networks | Unlimited accounts per network | **Proposed:** one user | Yes, once released |
| Teams | All five launch networks | Professional's unlimited accounts | Five included logins, including owners; paid additional logins | Yes, once released |

Teams inheritance and its five included seats are confirmed. Do not claim unlimited seats or set a commercial price from this specification; the extra-seat amount remains undecided. Future YouTube inclusion should be an explicit catalog decision rather than an accidental consequence of a string named `all`.

“Unlimited accounts” means no plan-level account-count ceiling on Professional. It does not promise unlimited storage, AI compute, publishing throughput or provider API capacity. Define those separate allowances transparently before public sales; never introduce a hidden connection cap and continue to advertise unlimited accounts.

The latest Free policy supersedes the earlier one-network/one-account/no-AI boundary. AI remains deferred until funded, with substantial model-independent preparation in the initial build. A feature entitlement expresses eligibility; it does not mean an unfunded feature is available. Manual posting handoffs where required are also confirmed. No paid plan or AI subscription is purchased by this planning work.

## Workspace, user and social account boundaries

The workspace owns content, connected accounts, the plan assignment and usage allowance. A login identifies a person; it is not itself a social account or a paid plan. Membership grants that person scoped actions in a workspace.

Proposed FSS pilot: one internal Teams workspace, manually granted for testing, with Jean and his wife as owners. This is two active members within a five-seat capacity, with no additional-seat grant initially. Each signs in separately and can select the shared accounts they have permission to use. Internal access exercises the same policies as customers; do not create an unchecked superuser path or shared password.

An account is a stable provider identity, not an upload format or login session. Reconnecting the same identity refreshes its grant and does not consume another slot. A new identity requires a slot. Count manually configured destinations as well as linked accounts so manual handoff cannot bypass the plan limit. OAuth consent, Page/channel access and brand/source permissions remain separate checks.

Use a workspace/account picker and clear labels for provider, identity, brand, account health, enabled route and permissions. Two Instagram accounts are two identities; one account supporting Reels and images remains one identity.

## Team roles and approvals

Recommended role defaults:

| Role | Permitted actions |
| --- | --- |
| Owner | Workspace administration, memberships, account management, content, approval and publishing; public billing administration when added |
| Admin | Invite/manage non-owner members, account connections, content and publishing; no owner transfer or self-awarded plan upgrades |
| Editor | Capture/edit drafts, prepare media and submit for review; no approval or external publishing |
| Publisher | Draft/edit, review/approve and schedule/cancel permitted accounts; no membership or connection administration |
| Viewer | Read permitted content/calendar/results; no modifications or publishing |

Only authorised internal operations can assign a paid/comped plan before billing exists. Being a workspace owner does not authorise editing the subscription entitlement directly.

Both pilot owners may self-approve. A future optional second-person rule can be enabled by a Teams owner when useful; it is not compulsory for FSS. If enabled later, enforce it on the server, including self-approval restrictions and distinct actor checks.

Restrict brands/accounts where needed. Team membership alone must not expose another brand's private sources or every connected account. Removing a member blocks subsequent sensitive commands using current database membership; do not wait for a cached token role to refresh. Preserve the actual outcome of already dispatched external requests.

Maintain at least one active owner. Role changes/removals and owner transfer use the workspace access-control lock; concurrent requests cannot orphan the workspace. Admins cannot remove/demote owners or perform owner transfer.

## Enforcement and entitlement changes

An operation passes only when all applicable checks pass:

```text
valid session
  + current workspace membership and action permission
  + brand/source/account access
  + current plan entitlement and available quota
  + released feature flag
  + actual provider capability, grant and permitted data use
  -> authorised command
```

The UI can explain a blocked action, but the server/database enforce it. Native clients cannot grant themselves a tier. Future local AI needs an explicit offline-entitlement refresh/grace policy: indefinite offline operation and immediate remote revocation cannot both be guaranteed. Resolve and test that policy before native sales.

Connect-account and invite-member commands lock/check the relevant workspace entitlement in a transaction, then reserve capacity where necessary. Account activation consumes the reservation once; failures release it. Teams capacity is **five included seats plus trusted additional-seat grants**. Count active memberships, including every owner, plus reserved unexpired invitations; accepting an invitation converts its existing reservation into membership without double-counting. Expired/revoked invitations release the reservation. Only protected internal operations can grant additional capacity initially; later, verified billing events use the same audited service. Owners, admins and clients cannot award seats or treat a checkout redirect as payment evidence. Test two simultaneous connects for the final Creator slot and two simultaneous invites for the last seat.

Plan changes have an effective time, policy version, audit record and a preview of affected networks/accounts/jobs. On downgrade, ask the owner to select retained accounts; do not erase sources, drafts, history or social identities. Disable affected future dispatch and show the remedy. In-flight requests retain their approved snapshot and require outcome reconciliation.

Cancelling a paid additional seat cannot orphan the last owner, erase content or silently remove members. Before commercialisation, decide the effective date, grace period and explicit owner-controlled member/invitation selection for a capacity reduction. Until that policy exists, reject internal reductions below active members plus reserved unexpired invitations; show the owner what must be resolved. Any later reduction uses the workspace lock, audited changes and last-owner protection.

An unsent publication blocked by a plan, member, source or account change exposes a machine-readable blocking reason and permitted recovery action alongside its historical status. Reconnecting/upgrading alone must not silently restart it: require explicit audited revalidation, including approval and late-schedule checks.

Do not permit unrestricted creation of multiple Free workspaces to emulate a higher tier. **Proposed:** one active solo workspace per personal subscription, while separately allowing invited Teams membership. Confirm the commercial policy before public onboarding; workspace limits are not yet a user-confirmed requirement.

Initially assign plans through restricted internal operations and synthetic fixtures. Do not implement checkout, payment cards, webhook handlers or dormant billing-provider code. Later billing can update the same authoritative assignment after verified events, with idempotent event processing and a defined payment-failure/grace policy.

## AI access and value

Every AI task must pass the exact server-resolved feature allow-list, role, data permission, release state and finite usage allowance. Recommended Free keys are `alt_text`, `analytics_summary`, `period_comparison`, `topic_format_learning` and `video_retention_diagnosis`; this maps the confirmed alt-text/analytics categories without granting the entire insights family. Other keys require Creator/Professional/Teams. An editor may generate a permitted draft but cannot publish it. Browser flags, a general `ai.entitled` boolean, task-family substitution or a diagnostic follow-up cannot unlock premium generation. Build task/input/output contracts, generation/proposal tracking, quota checks and the suggestion-review boundary now; verify with test-only synthetic outputs while production execution stays disabled. Finite Free quotas remain undecided, and missing quota policy keeps execution unavailable.

Keep ordinary deterministic analytics distinct from AI. A report can calculate reach or engagement without sending provider data to a model. AI interpretation needs confirmed permitted inputs; a paid plan cannot override a social provider's data restrictions.

Initial funded priorities include limited Free-and-above alt text and analytics, with captions/repurposing, bio/name recommendations and broader next-post/trend generation at Creator and above. Genuine trend discovery and AI analytics depend on authorised data, meaningful samples and source attribution. Analytics separates computed observations, possible explanations and a next test; it can suggest shortening an intro without generating a replacement hook or script. See the [AI capability roadmap](Cadence-AI-Capability-Roadmap.md) and [video analytics coach](Cadence-Video-Analytics-Coach.md). Missing/coarse bins, incompatible denominators/cohorts, rewatch-sensitive measures and unverified transcript/video timelines limit the explanation; no causal or exact timestamp claim may exceed the evidence.

AI allowances are not yet priced. Define a bounded usage policy and measured per-task cost before launch. Account-count “unlimited” is not an unlimited-inference promise. Do not silently turn a private/offline task into hosted processing.

## Required acceptance checks

1. Free cannot activate a fourth network, a fourth total account or a second account on the same network; Creator also rejects a second account on a network. Test concurrent requests and manual destinations against these confirmed limits.
2. Professional activates many accounts without an artificial plan-count limit; ordinary job/media/rate controls remain visible and separately defined.
3. Separate FSS logins can collaborate on permitted shared accounts. Editor, publisher and viewer negative tests reject prohibited commands and indirect IDs.
4. Cross-workspace invitations/accounts/content cannot cross tenant boundaries; reconnecting an identity does not duplicate usage.
5. Effective downgrade/revocation blocks affected unsent work and preserves drafts/history; dispatch races resolve truthfully.
6. Free may request only its exact allow-listed alt-text/analytics features when released and within allowance; direct premium requests, family substitutions and disguised caption/script follow-ups fail. Entitled-but-deferred tasks report “not released” with no production queue or quota consumption; no working-feature claim is made prematurely. Test finite allowance exhaustion and concurrent last-quota-slot admission.
7. A user/owner cannot self-upgrade by editing profile/JWT metadata, a cached entitlement or an exposed plan-assignment row.
8. Teams admits five total active/reserved logins; a sixth requires a trusted additional-seat grant. Invitations count until accepted, expired or revoked; acceptance does not consume capacity twice. A client cannot grant capacity. Seat reductions preserve the last owner and content and cannot silently remove users.
9. Video diagnostics reject cross-account/expired evidence and suppress unsupported detail for missing bins, coarse quartiles, zero/unknown or mismatched denominators, incompatible rewatch definitions, wrong/edited transcript timelines and unsupported causal claims. An earlier diagnosis is invalidated when the published cut/transcript mapping changes; deterministic reporting remains useful without model execution.

Plan/extra-seat prices, capacity-reduction/grace policy, proposed solo-plan user/workspace policy, offline entitlement grace and finite usage allowances remain explicit decisions. Free's three selected networks/three total accounts/one per network/limited alt-text and analytics categories, Teams' five included seats and inheritance, AI funding timing and accepted launch handoffs are confirmed. No application/SQL/provider/device tests have been executed for this document.
