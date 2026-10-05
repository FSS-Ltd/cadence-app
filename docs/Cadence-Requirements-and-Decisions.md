# Cadence — requirements and decisions

Updated: 5 October 2026. Status: requirements record supporting the [full phased plan](plans/2026-10-05-cadence.md) and [privacy architecture](Cadence-Privacy-Architecture.md). Five launch networks, format families, manual handoffs, tier families, Free's three selected networks/three total accounts/limited AI categories, Teams' five included logins and AI funding deferral are confirmed. Free allows one account per selected network. Live account grants remain implementation checks; plan prices and the extra-seat price remain undecided.

## Intended outcome

Build Cadence as an internal social media management, scheduling and posting tool for Jean and his wife at FSS. Host the website so both can use it from anywhere, provide an iPhone experience, prove the workflow through regular use, fix problems, then advertise the product publicly.

The recovered identity is Cadence, with **Every Post Builds.** as the main tagline and **Don’t Just Guess.** as the campaign line. See [recovered planning](Cadence-Recovered-Planning.md) for the source conversations, visual direction and original product loop.

## Privacy and security decisions

Treat user and client information as a release requirement at every build step. Captures and drafts are private to their creator until they explicitly share selected material. Workspace ownership, administration, shared brands and social-account access do not grant access to private captures. Sharing a reviewed excerpt exposes only that separate snapshot; it does not reveal the original capture, transcript, title, filename or private URL. An authorised, audited recovery path handles orphaned records.

Use Clerk for login and session identity, with Supabase Postgres and private Storage for Cadence data. Internal UUIDs map to unique Clerk subject IDs; application roles, memberships, permissions and plan entitlements come from live database state. Clerk receives no user content in metadata. Clerk identity data is US-hosted, so data-flow, processor and international-transfer records are required before live operation. Prefer the planned London Vercel/Supabase regions for application content, but verify actual service/control-plane residency and contractual terms rather than treating a region as a compliance guarantee.

Build and test required MFA. The closed pilot may temporarily disable MFA only for its exact two designated Clerk identities in the designated FSS pilot workspace, using a protected database policy that fails closed if missing or unknown. Sensitive commands require an active Clerk session and fresh authentication within ten minutes. MFA becomes mandatory across application and Storage access before any public onboarding; no pilot exception carries forward.

Allow ordinary personal drafts and explicitly authorised client-confidential notes. Do not admit highly sensitive records. Keep private web content in memory and authorised server storage; use `no-store`, prevent service-worker/shared-cache persistence, and omit content and credentials from telemetry. Store social OAuth credentials separately with authenticated encryption and versioned keys. Back up database, private media and required key material through an isolated London task to dedicated encrypted object storage. Full restore, replay of the independent deletion ledger and reconciliation must pass before access or publishing is reopened.

Detailed trust boundaries, retention defaults, restoration controls and the per-step privacy acceptance matrix are in the [privacy architecture](Cadence-Privacy-Architecture.md). These choices do not claim legal compliance or provider approval.

## Confirmed by the user

| Requirement | Source |
| --- | --- |
| Internal first, for FSS, Jean and his wife. | User clarification, 4 October. |
| Hosted website accessible from anywhere. | 4 October answer 1. |
| Web application first, then an app to download for their iPhones. | 4 October answer 1 and 5 October answer 2. |
| Advertise after enough internal use, bug fixing and proof that it works. | 4 October answer 1. |
| No payments outside the database and hosting; Apple Developer membership accepted for the later native app. | 4 October answer 2 and 5 October answer 2. |
| Defer AI features and spending until project revenue can fund them; prepare the initial application for later integration. | Latest 5 October answer 2, superseding the original day-one AI request. |
| Research the most capable model for an 8 GB public-device target; Gemma 4 is a suggested starting point. | Original build-plan request and 5 October answer 1. |
| Ask questions until the requirements are sufficiently clear. | Original build-plan request. |
| Include LinkedIn, Facebook, Instagram, TikTok, X/Twitter and YouTube in future plans. | Latest 5 October network clarification; launch order is not specified. |

The later detailed 5 October answers refine that roadmap:

| Requirement | Confirmed decision |
| --- | --- |
| Launch networks | LinkedIn, Facebook, Instagram, TikTok and X/Twitter all available from the start; YouTube later. |
| Content | Images, text-only posts, carousels, landscape video and vertical video; use each destination's actual supported format/route. |
| Publication routes | Manual handoffs accepted where automatic posting requires paid API access or approval. |
| Logins/accounts | Separate logins for Jean and his wife; support multiple social accounts per network. |
| Free | Up to three selected launch networks, one account per selected network and three total accounts; limited AI alt-text generation and analytics when funded and released. |
| Creator | All launch networks, one account per network; unlocks the broader AI catalogue when funded and released. |
| Professional | All launch networks, unlimited accounts per network; Creator AI included. |
| Teams | Builds on Professional, with five total logins including owners, shared accounts and owner/admin/editor/publisher roles; additional logins are paid additions, with price undecided. |
| Plan preparation | Different access tiers and their enforcement are part of the first build, before public sales. Prices and checkout provider are not decided. |
| AI timing/preparation | Defer execution until funded, but prepare the model-independent pipeline now to minimise later integration coding. This supersedes the earlier minimal-preparation/no-AI-tables proposal. |
| AI features | AI analytics, evidence-aware video retention diagnosis, niche trend discovery, alt-text generation, captions, bio optimisation, SEO name suggestions and a researched wider capability roadmap. Free's confirmed access categories are alt text and analytics; broader generation requires Creator or above. |

See [plans/team access](Cadence-Plans-and-Team-Access.md), [AI capabilities](Cadence-AI-Capability-Roadmap.md), [video analytics coach](Cadence-Video-Analytics-Coach.md), the [network/format evidence](research/2026-10-05-six-network-publishing-addendum.md) and [competitive pricing and positioning](Cadence-Competitive-Pricing-and-Positioning.md).

The latest Free policy supersedes the earlier one-network/one-account/no-AI boundary. Recommended task mapping is `alt_text`, `analytics_summary`, `period_comparison`, `topic_format_learning` and `video_retention_diagnosis`; these implement the confirmed two AI categories, with finite allowances still undecided. Check the exact feature allow-list, role, source permission, released state and quota rather than a blanket AI boolean. Analytics explains computed facts, possible causes and a next editing test; replacement hooks, captions and scripts are separate Creator-and-above generation tasks. No AI executes before funding.

The user's 5 October answers resolve and supersede parts of the original clarification round:

| Decision | Confirmed requirement |
| --- | --- |
| Pilot phones | iPhone 13 and iPhone 16 Pro Max. |
| Meaning of 8 GB | A desired minimum device-memory target for future public distribution, intended to make the app and local AI widely usable; not a limit imposed on the hosting server. |
| Initial distribution | Web application first. |
| Later distribution | Native iPhone app; the user will obtain Apple Developer membership. |
| Website provider | Vercel. |
| Database provider | Supabase. |
| AI delivery timing | Prepare for AI in the initial web application; add it when project revenue funds the feature. |
| Web AI topology | Hosted AI when the feature is added. |
| Native AI requirement | Offline AI must ship with the native apps. |

The 8 GB goal becomes an engineering compatibility target. Certifying local AI requires named device, OS, runtime, artifact, context and workload tests; installed RAM alone cannot establish issue-free operation on every device. Hosted AI can serve compatible web clients without requiring each phone to load the model.

## Requirements carried forward from recovered planning

These are earlier proposals to preserve in the draft specification, subject to the user's corrections:

- Capture authorised real material, create brand-specific drafts, review and approve an exact revision, schedule/publish, then learn from comparable results.
- Separate private sources and brand permissions; reuse across brands only when permitted.
- AI suggests editable content. Approval and external publishing remain explicit user actions.
- Schedule accepted content on the backend so publication does not depend on a phone or browser staying open.
- Treat each destination's publishing, analytics, format support and AI-data permissions independently.
- Keep a clearly labelled manual posting route for unsupported capabilities and approval delays.
- Preserve a usable drafting and calendar workflow when AI is unavailable.
- Retain the approved revision, destination, provider identifiers and attempt history; reconcile ambiguous publishing results before retrying.
- Use Europe/London as the initial time zone, with explicit dates and correct daylight-saving handling.

Earlier proposed brands were Jean's personal brand, FSS and NexSteps. The final launch brand/account inventory is not yet confirmed.

## Decisions needed before choosing the final build path

1. **Remaining quantities:** public plan prices, additional Teams seat price, finite AI allowances and proposed solo-plan user/workspace policy remain undecided. Free's three networks/three total accounts/one per selected network/limited AI categories and Teams' five included logins plus paid additions are settled; do not ask them again.
2. **Implementation inventory:** actual personal/business/Page/channel identities, grants, initial brands and source permissions are checked during setup. A network name does not prove API permission.
3. **Commercial/operational policy:** prices, AI/storage/throughput allowances, downgrade/grace policy and delivery capacity need explicit decisions before public sales. Initial estimates use a staffing assumption rather than a promised date.

Planning defaults: one experienced full-time developer, no fixed launch date, and a manually granted internal Teams workspace with both pilot users as owners who can explicitly approve their own posts. The pilot uses two active logins within the confirmed five-seat capacity. Additional capacity is five plus trusted additional-seat grants, assigned by protected internal operations initially and verified billing events later. Active memberships and reserved unexpired invitations count; a client cannot grant seats. Decide the public capacity-reduction policy before sales; it must preserve a last owner, content and history and must not silently remove users. Other defaults here are proposals, not additional answers supplied by the user. Automatic support is verified per account/format; all five launch networks have a permitted manual route when needed.

Deferred AI-phase decisions: exact funding/hosting allowance, selected model and acceptable generation wait; installed OS/free storage and certified native-device support. Offline AI on the iPhone 13 is unverified. Native delivery cannot silently replace required offline AI with hosted inference. Resolve device/model fit before promising the supported native-device list.

AI topology and offline timing are now settled for planning. Do not keep asking the earlier cost/topology questions during the initial web-app work. No elapsed waiting time is treated as an answer or approval.

## Deferred AI research and limits

The existing model/deployment notes are reference material for the future funded phase. Further model selection research, installations, inference hosting and active generation are paused. The newly requested capability/data-permission research supports the plan. Initial AI preparation now includes typed tasks/input builders, versioned prompts, output validation, persisted generation/proposal states, feature-specific tier/quota/permission checks and an editable suggestion workflow tested with synthetic fixtures. Prepare metric time-bin definitions, immutable video/transcript identities, verified timeline mappings and evidence provenance now; deterministic reporting can use authorised manual evidence during the pilot. Production interpretation/generation remains disabled until funded and validated.

- Evaluate one default model and one smaller fallback. The research shortlist includes Qwen3.5-4B, optimized Gemma 4 E4B, LFM2.5-2.6B and Granite 4.2-3B; this is not a measured ranking for FSS.
- Separate model download size, weight-loading estimates, process memory and whole-device memory. Validate the chosen artifact and runtime on the actual hardware.
- Start bounded text tasks with one generation at a time and short context. Add voice/image execution only after separate compatibility and resource checks.
- Run a blind comparison on authorised FSS examples before committing to a model. Model licence, source permissions, factual fidelity, editing effort, memory and latency are acceptance gates.
- Self-hosted weights avoid a per-token AI provider bill but still consume hosting resources. They must fit within the agreed hosting budget.
- Apple distribution costs and platform API approval restrictions are real constraints, not features that model choice can solve.

Current proposal: Vercel web/API, Clerk identity and Supabase Postgres/private Storage, with independent durable publishing jobs. The first usable release provides manual capture, brand playbooks, editing/revisions, review, calendar, five-network supported publication routes and enforced plans/team permissions. Prepare the model-independent AI orchestration/review pipeline and test contracts, but do not provision an inference server, download models or advertise generation as working. Connecting and evaluating an actual model remains funded work.

When project revenue funds the feature, add hosted AI to the web application. The native release requires an actual offline generation route for each certified device. Apple's system model can be evaluated on eligible devices; a compatible downloadable model may be necessary elsewhere. The iPhone 13 must not depend on Apple Intelligence support. Native publishing still needs connectivity to accept schedules and sync results; previously accepted server schedules execute with phones offline.

See the dated research notes in [research](research/). Research is based on primary documentation. No model has been installed or benchmarked on the user's hardware, no social accounts have been connected, and no application code or infrastructure has been created.

## Requested final deliverable

A developer-ready phased plan covering stack alternatives, architecture and trust boundaries, hosting and costs, security, data model, APIs, web/iPhone interfaces, background jobs, explained folders, development/release workflow, testing, monitoring and recovery, milestones with acceptance criteria, risks, and the path from the two-user pilot to a public product.

The plan should deliver the scheduling/posting web product first, prepare it for later AI, and gate hosted web AI and offline native AI behind project-revenue funding and their own acceptance tests. Final dates and model performance cannot be certified through documentation research alone.
