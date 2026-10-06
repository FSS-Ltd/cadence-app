# Cadence documentation

Collected on 5 October 2026. This folder contains the product planning, engineering specifications, research and recovered branding assembled for Cadence. The application shell is being implemented under `apps/web`; service integration and user-data features remain gated by the numbered plan.

## Start here

1. [Requirements and decisions](Cadence-Requirements-and-Decisions.md) — confirmed scope, privacy requirements and unresolved choices.
2. [Full phased build plan](plans/2026-10-05-cadence.md) — stack, architecture, numbered PR gates and acceptance criteria.
3. [Engineering contracts](Cadence-Engineering-Contracts.md) — publishing rules, data boundaries, permissions and illustrative implementation contracts.
4. [Privacy architecture](Cadence-Privacy-Architecture.md) — identity, data flows, private-source access, retention, deletion, backup/recovery and each step's privacy acceptance.
5. [Delivery evidence](Cadence-Delivery-Evidence.md) — current PR, CI, review, merge evidence and blocker for the active build step.
6. [Stitch design implementation record](Cadence-Design-Implementation.md) — authoritative UI/UX references and privacy-safe implementation mapping.
7. [Authentication setup](Cadence-Authentication-Setup.md) — Clerk/Supabase environment setup, webhook handling and pilot provisioning boundaries.

## Implemented foundation records

- [Database and access foundation](Cadence-Database-Access-Foundation.md) — step 0.2 schema boundaries, roles, synthetic verification and deployment limits.
- [Delivery evidence](Cadence-Delivery-Evidence.md) — the authoritative step, PR, check and merge status.

The current requirements and phased plan govern implementation. The dated research records preserve evidence and earlier options; follow each document's status notes when an earlier assumption has been superseded.

## Current product specifications

| Document | Purpose |
| --- | --- |
| [Plans and team access](Cadence-Plans-and-Team-Access.md) | Free, Creator, Professional and Teams entitlements, social-account limits and team roles. |
| [Competitive pricing and positioning](Cadence-Competitive-Pricing-and-Positioning.md) | Competitor comparisons, proposed differentiation and unapproved pricing hypotheses. |
| [Video analytics coach](Cadence-Video-Analytics-Coach.md) | Explain retention evidence, measured drop-off windows, transcript alignment and useful next experiments. |
| [AI capability roadmap](Cadence-AI-Capability-Roadmap.md) | Planned AI features, tier access, prerequisites and delivery gates. |
| [AI deployment decision](Cadence-AI-Deployment-Decision.md) | Preparation now, funded hosted AI later, and offline AI for future native apps. |
| [Recovered product and brand planning](Cadence-Recovered-Planning.md) | Original chat references, brand direction, colours, typography and recovered product context. |
| [Design-system board](CadenceDesignSystem.png) | Recovered Cadence visual reference. |

Current confirmed scope: start internally for FSS with separate logins for Jean and his wife; use Vercel and Supabase for the web app; support LinkedIn, Facebook, Instagram, TikTok and X, with manual posting handoffs where required. YouTube follows later. Free allows three chosen networks with one account per network, three accounts total. Its future AI access is limited to alt-text generation and analytics. Broader AI starts at Creator. Teams includes five total logins and paid additional seats. AI execution is deferred until funded, with integration preparation included from the first build. Prices remain decisions to validate.

The recovered board is available here. Standalone production logo files, app icons and the original downloadable UI/Stitch briefs have not been recovered; the recovered planning document records these gaps.

## Research library

All research is dated. Platform access, API capabilities, licences and prices need checking again before implementation or purchase.

| Area | Records |
| --- | --- |
| Publishing | [Initial feasibility](research/2026-10-04-publishing-feasibility.md); [launch formats and future YouTube](research/2026-10-05-six-network-publishing-addendum.md). |
| Hosting | [Earlier hosting options](research/2026-10-04-hosting-options.md); [Vercel and Supabase feasibility](research/2026-10-05-vercel-supabase-feasibility.md). |
| AI scope | [Initial feature research](research/2026-10-04-ai-feature-scope.md); [future evaluation scorecard](research/2026-10-05-ai-evaluation-scorecard.md). |
| AI models and deployment | [Small-model comparison](research/2026-10-04-small-model-comparison.md); [local deployment](research/2026-10-04-local-ai-deployment.md); [iPhone feasibility](research/2026-10-04-iphone-ai-feasibility.md); [distribution options](research/2026-10-05-ai-distribution-options.md). |
| Competitors | [Buffer and Later](research/2026-10-05-competitors-buffer-later.md); [Publer and Metricool](research/2026-10-05-competitors-publer-metricool.md); [SocialBee and Hootsuite](research/2026-10-05-competitors-socialbee-hootsuite.md); [Planable and Sprout Social](research/2026-10-05-competitors-planable-sprout.md). |
| Video analytics | [Meta evidence](research/2026-10-05-video-diagnostics-meta.md); [network access and precision](research/2026-10-05-video-diagnostics-network-access.md). |

The filename “six-network-publishing-addendum” includes future YouTube research; the confirmed initial scope is five networks.

## Calculations and source records

- [Competitor price calculations — HTML](research/2026-10-05-competitor-price-calculations.html)
- [Competitor price calculations — notebook with saved outputs](research/2026-10-05-competitor-price-calculations.ipynb)
- [Competitor sources — JSON](research/2026-10-05-competitor-sources.json)
- [Competitor sources — saved HTML receipt](research/sources/cadence-competitor-pricing-sources-2026-10-05.html)
- [Video analytics sources — JSON](research/2026-10-05-video-analytics-sources.json)
- [Video analytics sources — saved HTML receipt](research/sources/cadence-video-analytics-sources-2026-10-05.html)
- [File manifest](FILE-MANIFEST.json) — original-file mapping and SHA-256 checksums for the copied bundle.

Original files remain preserved in the FSS CTO project. Copies have portable local links; external research and original-chat links still require internet access and any relevant account permissions.
