# Cadence publishing feasibility and delivery gates

Research date: 4 October 2026, Europe/London.
Scope: internal social media tool for Jean, his wife and FSS, with a possible later public SaaS phase.
The 5 October roadmap now includes LinkedIn, Facebook, Instagram, TikTok, X and YouTube; launch priority, account types, brands and formats remain **pending user confirmation**.
**Current-scope update:** AI is deferred until project revenue. The original AI-first delivery suggestions below are historical; use the [5 October publishing addendum](2026-10-05-six-network-publishing-addendum.md) and current requirements for the delivery sequence and paid-API constraints.
This memo records documentation research; no authenticated API calls, account connections or real publishing tests were performed.

## Recommended starting decision

Build Cadence's original-source library, brand playbooks, manual drafting, editing and approval workflow first; AI is deferred under the 5 October decision.
Add one confirmed publishing route after an account-level feasibility spike.
Keep a native posting handoff available for unsupported accounts, formats and approval delays.
Treat publishing access, analytics access, format support and AI-data eligibility as separate capabilities.
An internal-only app has materially different approval prospects from a public product.

## Current platform evidence

| Route | Verified official evidence | Consequence |
| --- | --- | --- |
| LinkedIn personal publishing | Share on LinkedIn provides self-service `w_member_social`. | Reasonable first direct adapter if LinkedIn is selected; posting does not grant analytics/history access. |
| LinkedIn personal analytics | `r_member_postAnalytics` belongs to reviewed Community Management and provides the authenticated member's post statistics. | Access request is a dependency; use manual metrics/import while unavailable. |
| LinkedIn organisation publishing | `w_organization_social` and an appropriate company-page role are required. | Confirm FSS page roles and app approval before promising automatic company posting. |
| LinkedIn personal history | `r_member_social` is closed to new access requests. | Keep Cadence-authored originals and returned post IDs; do not promise complete historical import. |
| Instagram professional accounts | Meta's own collection confirms Business/Creator publishing and Reels' container/status/publish sequence. | Inventory exact account type and login route; validate each selected format. |
| TikTok direct posting | Direct Post guidelines exclude apps limited to private/internal groups and utilities limited to accounts managed by oneself/team. | Do not promise Cadence's own internal-only Direct Post integration; use native handoff or a compliant managed provider. |
| YouTube publishing | Uploads from unverified API projects created after 28 July 2020 are private-only until the required audit. | Make public automatic publishing conditional on audit; keep native upload fallback. |

LinkedIn evidence:

- [Open permissions / Share on LinkedIn](https://learn.microsoft.com/en-us/linkedin/shared/authentication/getting-access), updated 26 June 2025.
- [Current product access and scopes](https://learn.microsoft.com/en-us/linkedin/marketing/increasing-access?view=li-lms-2026-09), updated 17 August 2026.
- [Posts API and page roles](https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/posts-api?view=li-lms-2026-09).
- [Member post statistics](https://learn.microsoft.com/en-us/linkedin/marketing/community-management/members/post-statistics?view=li-lms-2026-09), updated 15 May 2026.
- [Community Management overview / closed personal-history permission](https://learn.microsoft.com/en-us/linkedin/marketing/community-management/community-management-overview?view=li-lms-2026-02), updated 15 May 2026.

LinkedIn Community Management is limited to registered legal organisations and commercial use cases.
The request needs verified business email, organisation details, website/privacy policy and verification by the associated LinkedIn Page.
Development-tier approval precedes integration and Standard-tier review, including a screencast and reviewer credentials.
Development has documented daily quotas, no batch GETs and disabled social-action push notifications.
Standard-tier acceptance is discretionary; the plan must not assume a guaranteed review date.
[App review requirements](https://learn.microsoft.com/en-us/linkedin/marketing/community-management-app-review?view=li-lms-2026-09), updated 11 February 2026.

Instagram evidence and limits:

- [Meta's Instagram collection: account types, login and publishing](https://www.postman.com/meta/instagram/documentation/6yqw8pt/instagram-api?entity=request-23987686-d785a76f-5a0d-4766-ba59-8b587770422c).
- [Meta's Reels workflow and Instagram Login](https://www.postman.com/meta/instagram/documentation/6yqw8pt/instagram-api?entity=request-23987686-fdf7020f-3cd0-4a5d-859b-66fb856b80b6).
- Facebook Login requires a Page linked to the Instagram professional account; Instagram Login does not require that link.
- The collection documents Facebook Login Stories publishing for Business accounts only; do not generalise across routes without current verification.
- Personal/consumer Instagram accounts are outside the documented professional API route.
- Current Standard/Advanced access, business verification and permission review must be checked against the chosen route and dashboard during the spike.
- Facebook Page publishing needs its own account/format/permission assessment; do not treat an Instagram grant as Facebook Page publishing access.

Meta's [current publishing reference](https://developers.facebook.com/docs/instagram-platform/content-publishing/), [access-level reference](https://developers.facebook.com/docs/graph-api/overview/access-levels/) and [Facebook Page posting reference](https://developers.facebook.com/docs/pages-api/posts/) repeatedly returned HTTP 429 during research.
Meta-owned Postman examples support the baseline above but are supplemental, not a substitute for the current reference and live account tests.

Trial Reels are **unverified for Cadence's API route**.
Meta confirms a native non-followers-first workflow and optional later sharing; the announcement is not an API contract.
Recent third-party technical claims conflict on API availability and eligibility, so neither universal API support nor impossibility is established here.
Plan native handoff until current official documentation and an eligible account test settle this feature.
[Meta's native Trial Reels announcement](https://about.fb.com/news/2024/12/trial-reels-try-content-non-followers-first-see-what-perfoms-best?trk=public_post_comment-text), published December 2024 and updated June 2025.

TikTok and YouTube evidence:

- [TikTok Direct Post guidelines and internal/private-use restriction](https://developers.tiktok.com/doc/content-sharing-guidelines).
- [TikTok Direct Post guide](https://developers.tiktok.com/docs/en/content-posting-api-get-started), updated 4 August 2026: scope approval and audit; unaudited publishing is private-only.
- [TikTok status polling and webhooks](https://developers.tiktok.com/docs/en/content-posting-api-reference-get-video-status), updated 4 August 2026: processing/moderation and public availability are separate stages.
- [YouTube upload API](https://developers.google.com/youtube/v3/docs/videos/insert): private-only restrictions for affected unverified projects.
- A managed provider still requires validation of the actual connected account, content format, workflow and contract; do not present it as a way to bypass platform rules.

## AI and data boundaries

LinkedIn's Developer AI Policy generally prohibits Marketing API data as AI input/training except specified use cases.
Consenting current Cadence users' own content can support creating/modifying content within the permitted scope.
Other users' API-derived content has narrower prioritisation/categorisation/accessibility exceptions; it cannot be freely repurposed into generated posts.
The policy excludes independently client-provided data from those particular API-data requirements.
AI-generated publishing must include user involvement and editing tools.
Running Gemma or another model locally does not remove platform data restrictions.
[Developer AI Policy](https://learn.microsoft.com/en-us/linkedin/marketing/developer-ai-policy?view=li-lms-2026-04), updated 14 January 2026.

Record provenance, owning account/brand, consent, permitted AI purpose and retention category for imported material.
Prefer original source notes and Cadence-authored drafts for brand-aware generation.
Keep reporting deterministic by default; review any planned AI input consisting of API-derived metrics or comments against the relevant policy.
Separate original drafts from imported platform data rather than assigning one retention rule to everything.
LinkedIn's restrictions describe 48-hour member social-activity storage and generally 24-hour profile storage, with use/export limitations.
Aggregate analytics and independently authored originals need their own classification; do not blindly apply those windows to every category.
[Restricted uses and storage summary](https://learn.microsoft.com/en-us/linkedin/marketing/restricted-use-cases?view=li-lms-2025-09), updated 28 August 2025.
[Marketing API terms and data categories](https://business.linkedin.com/marketing-solutions/marketing-partners/become-a-partner/marketing-developer-program/terms-and-conditions).

## Lean publishing-provider options

| Option | Verified current constraints | Delivery implication |
| --- | --- | --- |
| Buffer API | Personal keys and third-party OAuth with PKCE are documented. Available on all plans, including Free, with plan-dependent limits. | Pilot candidate if channel/format limits and residency are acceptable. Keep Cadence as content/approval source of truth. |
| Buffer reporting | Full production analytics is unavailable; experimental post metrics are personal-key-only and unavailable to third-party OAuth apps. | Do not make production reporting depend on experimental queries; manual/export or separately authorised network APIs remain necessary. |
| Postiz self-host | Current repository licence/site say AGPL-3.0; own social developer apps and approvals are required. | Self-hosting does not inherit the cloud service's platform permissions; evaluate licensing before copying/forking code into the product. |
| Postiz resources | Floor 2 GB/2 vCPU for light use; small-team recommendation 8 GB RAM. Postgres, Redis and Temporal are part of the stack. | Postiz plus a local LLM on one 8 GB host needs its own capacity benchmark; separate hosting may be necessary. |
| Postiz API | API-key and third-party OAuth support; OAuth documentation lists analytics endpoints. | Check per-network metrics and reconciliation behaviour in the spike rather than assuming complete analytics. |
| Direct adapters | Most control but permissions and each provider's changes remain Cadence's maintenance responsibility. | Implement incrementally, starting with the highest-value confirmed route. |

Provider evidence:

- [Buffer authentication and OAuth](https://developers.buffer.com/guides/authentication.html).
- [Buffer official API capabilities and analytics limitations](https://support.buffer.com/en-us/articles/what-is-buffers-api-GtIYIQilz5).
- [Postiz current repository licence](https://github.com/gitroomhq/postiz-app/blob/main/LICENSE) and [official self-host/cloud description](https://postiz.com/).
- [Postiz system requirements](https://docs.postiz.com/self-host/installation/system-requirements).
- [Postiz Public API](https://docs.postiz.com/public-api/introduction) and [OAuth documentation](https://docs.postiz.com/public-api/oauth).
- No provider price is needed to select the research gate; confirm actual pilot plan limits, residency, processing terms and cost after user scope is known.

## Required phased consequences and acceptance gates

1. **Discovery:** confirm launch networks, actual account types/roles and priority formats; choose adapter; document capabilities per connected account.
2. **Editorial pilot:** capture original sources, apply brand playbooks, write editable drafts and require human approval; native handoff works from the first usable release. AI follows later after revenue.
3. **Publishing spike:** prove an authorised text/image/video example where applicable, capture provider identifiers, verify status separately, and test analytics access independently.
4. **Reliable scheduler:** durable jobs, approval revision lock, timezone/DST handling, cancellation, reconnection/token renewal, rate limits, retries and ambiguous-result recovery.
5. **Network expansion/reporting:** add formats only after contract tests; preserve metric definitions/source/timestamp and distinguish unavailable values from zero.
6. **Public SaaS gate:** tenant/account isolation, per-tenant OAuth, reviews, deletion/retention workflows, and adapter licensing/residency assessment before external onboarding.

Store capability results per account: publishing mode, formats, permissions, status lookup, analytics, review/access tier, rate limits, expiry and AI-data eligibility.
Prefer `supported`, `unsupported`, `permission_required` and `unverified` to a single global platform-enabled flag.
Publishing states must distinguish scheduled, publishing, processing, published, failed and **outcome_unknown**.
An accepted upload or scheduled-provider job is not proof of a publicly visible post.
Persist provider job/post/container IDs, immutable approved revision and attempt history.
After a timeout, reconcile using authorised status/read endpoints before repeating a create request; require manual verification when permission cannot settle the outcome.
Never automatically retry an ambiguous create result as a fresh post.
LinkedIn's Posts API returns the published post identifier in `x-restli-id`; persist it immediately.
TikTok may withhold public post IDs until moderation completes; preserve its publish ID and consume status/webhooks.

## Freshness and remaining verification

LinkedIn warns Marketing API version **202510 sunsets on 15 October 2026**; use a currently supported version and schedule regular adapter upgrades.
Provider documentation was retrieved/crawled in September–October 2026, but live grants and the selected account capabilities remain untested.
Meta developer-reference retrieval and Trial Reels verification remain incomplete as described above.
Initial rollout priority and account/format selection are still pending user input. All six networks are on the future roadmap; automatic support remains gated per account and format.
