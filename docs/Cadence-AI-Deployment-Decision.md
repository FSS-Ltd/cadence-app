# Cadence — hosted AI versus downloadable AI

Decision brief: 5 October 2026. Based on primary-source research and the user's latest answers. This recommends a route for the phased build plan; it does not record a selected host, purchase, deployed application or completed device benchmark.

**Latest 5 October scope update:** AI execution/spending remains deferred until funded, with substantial preparation now to minimise later model-integration coding. Build task/input/output contracts, generation/proposal state, feature-specific permission/usage checks and the review/apply pipeline with test-only synthetic outputs. Hosted web AI and required offline native execution remain funded work. Free now has limited alt-text/analytics eligibility; Creator, Professional and Teams unlock the broader catalogue when released. The options below remain research references; the earlier active-AI-first-release recommendation is superseded by the [current requirements record](Cadence-Requirements-and-Decisions.md), [capability roadmap](Cadence-AI-Capability-Roadmap.md) and [video analytics coach](Cadence-Video-Analytics-Coach.md).

Confirmed commercial quantities: Free allows up to three selected launch networks, one account per selected network and three total accounts. This supersedes its earlier one-network/one-account/no-AI policy. Teams inherits Professional, includes five total logins counting owners, and supports paid extra logins at an undecided price. The FSS pilot uses two active members within five seats. Resolve capacity as five plus protected operator grants initially or verified billing grants later; clients cannot grant capacity. Count active memberships and reserved unexpired invitations, and define a public reduction policy that preserves owners/content and never silently removes users. See [plans and team access](Cadence-Plans-and-Team-Access.md).

Recommended Free feature allow-list: `alt_text`, `analytics_summary`, `period_comparison`, `topic_format_learning` and `video_retention_diagnosis`, with finite allowances still undecided. Enforce each exact key rather than treating a general AI boolean or task family as permission. Analytics explains computed facts, possible causes and a next editing experiment; replacement hooks, captions and scripts remain separate Creator-and-above tasks. Feature eligibility does not activate unfunded execution or remove source/device gates.

## Recommendation

**Build the web product first. When AI is funded, add hosted open-weight AI to the web app and offline AI to the native apps.**

Vercel hosts the website/API. Supabase provides authentication, Postgres, private media storage and durable publishing jobs. When AI is funded, a separate AI host can process draft-generation jobs for the web application. This can give both pilot phones the same online AI capability without loading model weights into either phone.

For the later native app, offline generation is a release requirement on every certified supported device. Evaluate Apple's built-in model on eligible phones and a tested downloadable model where needed. Model download can be optional on a device that already has a working system-model route; hosted inference cannot replace the required offline capability. Prefer an Apple-hosted on-demand asset pack over putting gigabytes of weights into every app installation.

Model, host and device certification remain decisions for the funded phase. There is no active AI feature or AI compute spending in the initial web-release scope.

## Confirmed constraints

- Users: Jean and his wife at FSS; internal use before advertising publicly.
- Pilot devices: iPhone 13 and iPhone 16 Pro Max.
- Web application first, hosted on Vercel; database on Supabase.
- Native iPhone app later; Apple Developer membership will be obtained for it.
- No paid AI API or social-management subscriptions. Compute, storage and bandwidth belong within hosting costs.
- Future 8 GB device-memory target for local AI. The hosting server can have a different specification.
- AI should eventually cover as much useful work as practical; feature delivery is deferred until project revenue funds it.

## Options compared

| Route | Future web AI | Later native app | Main benefit | Main trade-off | Recommendation |
| --- | --- | --- | --- | --- | --- |
| Self-managed hosted model | Both phones use it online | Online enhancement alongside required local AI | Broad client compatibility; model updates centrally; no phone model download | Extra hosting, operational work, network dependency and shared capacity | Funded web AI route |
| Model bundled inside app | Does not supply AI to the website | Native runtime and weights installed together | Local generation without a separate Cadence model download | Large install/update for every user; local memory/heat still need certification | Avoid as the universal default |
| Native model download | Does not supply AI to the website | Tested local route where needed for the required offline capability | Offline/private prompt processing; smaller initial app | Storage, battery, runtime maintenance, model updates and device tests | Preferred Gemma distribution route later |
| Apple's system model | Not a website API | Eligible native devices, including the 16 Pro Max | No Cadence weight download or developer inference fee | OS/settings/readiness/quality gates; iPhone 13 is outside supported hardware | First native local route to test |
| Browser/PWA local model | Possible experiment | Separate from native implementation | Could avoid an additional inference server | Safari/runtime compatibility, cache eviction, download size and memory unverified | Optional experiment, not the dependable pilot baseline |
| Existing FSS computer | Can serve online clients if securely reachable | Can serve both phones | Uses existing hardware | Sleep/power/connectivity/maintenance; remote availability not assured | Consider only if suitable always-on hardware exists |

Apple's supported hardware includes iPhone 16 models and excludes iPhone 13. Native model availability still needs an eligible OS, settings and a ready model. [Apple requirements](https://support.apple.com/en-gb/121115), [Foundation Models](https://developer.apple.com/documentation/foundationmodels)

Safari supports WebGPU, while the researched LiteRT browser integration remains early preview with text input/output. Browser support alone does not certify a given model on either phone. [WebKit release](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/), [LiteRT browser API](https://developers.google.com/edge/litert-lm/js)

## Model recommendation: separate server and phone trials

| Trial | Starting candidates | Selection rule |
| --- | --- | --- |
| Hosted Linux CPU | Qwen3.5-4B Q4_K_M; Granite4.2-3B Q4_K_M as the compact challenger/fallback | Blind FSS usefulness and source fidelity first; accept only a host/artifact combination passing memory, latency and concurrency gates |
| Native system AI | Available Apple Foundation Models on the 16 Pro Max | Use the same writing tasks; check readiness, offline use, output limits and app lifecycle |
| Native downloadable AI | Optimized Gemma 4 E2B baseline, then E4B quality comparison on eligible test hardware | Select the most useful artifact passing device memory, latency, battery and storage gates |

Qwen's current 4B runtime bundle is about 3.3 GB; IBM's official Granite Q4 language file is about 2.24 GB. Both are Apache-2.0 candidates. File sizes are not peak RAM, and publisher benchmarks do not rank FSS copywriting. [Qwen card](https://huggingface.co/Qwen/Qwen3.5-4B), [Qwen runtime package](https://ollama.com/library/qwen3.5:4b), [Granite card](https://huggingface.co/ibm-granite/granite-4.2-3b), [Granite artifacts](https://huggingface.co/ibm-granite/granite-4.2-3b-GGUF/tree/main)

Gemma 4 remains a strong native candidate. Its optimized E2B/E4B packages differ materially from ordinary GGUF/Ollama bundles. The official E4B QAT GGUF language file alone is about 5.15 GB before context/runtime and optional modality components; mobile loading figures cannot be copied into a Linux server estimate. [Gemma deployment guidance](https://ai.google.dev/gemma/docs/core), [official E4B GGUF](https://huggingface.co/google/gemma-4-E4B-it-qat-q4_0-gguf/tree/main)

There is no demonstrated universal winner for every 8 GB device. Do not ship four models/runtimes simultaneously. Choose one production server model plus a fallback configuration during funded AI evaluation; choose native options separately.

## Hosting costs and the capacity choice

These are published planning figures, not checkout quotes or spending commitments. Currencies are retained; taxes, usage overages, backup requirements and existing FSS subscriptions can change the total.

| Component | Published planning figure | Qualification |
| --- | --- | --- |
| Vercel Pro | US$20/month, one deploying seat and US$20 infrastructure credit | FSS business use should use Pro; ordinary Cadence users do not need developer seats |
| Supabase Pro | Starts US$25/month, compute credit covering one Micro project | Daily DB backups, private storage and usage allowances; media needs separate backup |
| Lean UK CPU AI candidate | OVH 8 GB / 4 vCore from £6.29 ex VAT; 12 GB / 6 vCore from £9.01 ex VAT | Advertised links select upfront12; rolling price, stock and actual inference speed require confirmation |
| Higher-capacity London CPU comparison | Lightsail 16 GB / 4 vCPU, US$84/month | More memory allows additional model trials; it does not establish faster drafting |
| On-demand GPU comparison | Runpod 24 GB pool, approximately US$0.69 per billed worker-hour | EU location/inventory must be confirmed; startup and idle time are billed; storage is additional |

New-account baseline: **US$45/month plus the chosen AI host, overages, independent media backup and applicable taxes**. Existing paid FSS plans may make some costs shared rather than incremental. [Vercel Pro](https://vercel.com/docs/plans/pro-plan), [commercial-use restriction](https://vercel.com/docs/plans/hobby), [Supabase pricing](https://supabase.com/pricing), [OVH UK](https://www.ovhcloud.com/en-gb/vps/vps-uk/), [Lightsail](https://aws.amazon.com/lightsail/pricing/)

When the AI phase is funded, begin by testing the lean CPU route for the two owners. Set a visible queue and one active generation. Choose a different host or GPU only if measured latency/quality misses the agreed target. Additional RAM and vCPUs are capacity figures, not measured model throughput.

The GPU rate gives illustrative compute costs of US$13.80 for 20 billed hours or US$503.70 for 730 hours, before storage and tax. These are not usage forecasts; keep scale-to-zero, maximum one worker and bounded requests for a trial. A constantly warm serverless worker is a different cost choice. Region availability, cold-load latency, processing terms and larger-model quality still need verification. [Runpod rate card](https://www.runpod.io/pricing), [billed phases](https://docs.runpod.io/serverless/pricing)

Free model weights eliminate a vendor token bill, not compute costs. A larger hosted model can exceed the phone's memory target because it does not execute on the phone. Public hosted AI will need usage/concurrency limits and a measured capacity budget; unlimited free inference is not assumed.

Vercel Functions and Supabase Edge Functions have bounded resources and lifetimes. Neither ordinary service is proposed as a persistent model host. Submit durable AI jobs rather than holding a web request open for long packs. [Vercel limits](https://vercel.com/docs/functions/limitations), [Supabase Edge limits](https://supabase.com/docs/guides/functions/limits)

## Native distribution: preferable to bundling every model

Apple-hosted Background Assets explicitly support machine-learning models and include 200 GB hosting capacity in Developer membership. For iOS 26+ TestFlight/App Store apps, evaluate an on-demand model pack. Its data downloads can bypass Cadence's Vercel/Supabase transfer bill. This is asset hosting, not hosted inference or a CDN for the web app. The reviewed sources do not establish unlimited bandwidth. [Apple-hosted delivery](https://developer.apple.com/videos/play/wwdc2025/325/), [supported assets](https://developer.apple.com/documentation/backgroundassets/downloading-apple-hosted-asset-packs)

The researched native LiteRT packages are approximately 2.58 GB for E2B and 3.66 GB for E4B on disk. Keep the tested runtime in the app; make model data optional. Apple currently limits the main iOS app to 4 GB uncompressed, while managed assets are separate. Verify exact packaging, licences, runtime file access and App Review requirements. [Native packages](https://huggingface.co/litert-community/gemma-4-E2B-it-litert-lm), [E4B package](https://huggingface.co/litert-community/gemma-4-E4B-it-litert-lm), [build limits](https://developer.apple.com/help/app-store-connect/reference/app-uploads/maximum-build-file-sizes/)

Do not silently deliver an incompatible live asset-pack update to older app builds. Track model/runtime compatibility, integrity, free disk, cancellation, removal and rollback. A phone's eligibility to download a pack does not establish its ability to run the model.

For comparison, 1,000 complete 2.58 GB downloads are 2,580 GB before updates/retries. If all were Supabase cached egress, with no other traffic, the Pro allowance gives an illustrative US$69.90 overage; all uncached gives US$209.70. Actual cache mix/shared usage can differ. Vercel's flat CDN scope excludes bulk file distribution. [Supabase egress](https://supabase.com/docs/guides/platform/manage-your-usage/egress), [Vercel CDN eligibility](https://vercel.com/docs/pricing/flat-rate-cdn)

## Preparation in the first web release

- Build human-editable brand playbooks, an authorised source library, useful source provenance/permissions and immutable draft revisions because the current product needs them.
- Keep editing, approval, scheduling and provider integrations in focused services with explicit typed inputs. Document future generation as permitted source/context in, editable draft proposal out.
- Prepare typed tasks, authorised input builders, prompt/output schemas, persisted generation/proposal jobs, feature-specific allow-lists, finite quota reservations, suggestion review/apply and synthetic fixture tests now. Prepare time-bin definitions, immutable video/transcript bindings, verified timeline mapping and provenance for deterministic analytics/manual evidence. Production requests truthfully report unavailable until release. Add no active inference host/model or production fixture executor; connect the real adapter and measure quality/cost when funded.

## Product and trust boundaries for the funded AI phase

```text
Web/PWA on either phone
  -> Vercel authenticated Cadence API
     -> Supabase: permitted sources, drafts, approvals, job records
     -> durable AI job -> separately hosted inference -> validated proposal

Vercel publisher wake-up
  -> atomic due-job claim in Supabase
  -> immutable approved content -> authorised social API

Later native app
  -> same authenticated Cadence API
  -> certified offline system/Gemma engine -> editable draft
```

- Keep AI job access narrow. The inference process never needs social OAuth tokens, approval privileges or another brand's private sources.
- Validate generated structure, account/brand/source identifiers and business constraints outside the model. Model citations are review aids, not proof of truth.
- Calculate metrics in code/SQL. AI explains computed results and suggests experiments; it does not invent numbers or guarantee growth.
- Video explanations use compatible metric definitions/cohorts, measured time-bin resolution and a transcript of the exact published cut or a verified mapping. Missing curves, coarse quartiles, replay-sensitive measures, unknown denominators and edited/unverified timelines suppress unsupported precision. A coincident line and retention change do not prove causation. Test these cases before activating the diagnostic feature.
- Persist approved content/media before scheduling. Already accepted posts publish while phones are offline or inference fails.
- Durable job state, checkpoints and reconciliation handle missed wake-ups and ambiguous provider responses. Queue delivery does not guarantee an external post happens exactly once.
- Enable Supabase RLS and matching grants on exposed tables; keep secret/service keys server-only. Use explicit membership checks in privileged server paths. [RLS guidance](https://supabase.com/docs/guides/database/postgres/row-level-security)
- Label hosted versus local processing. A selected local/private request never silently falls back to a server.

## How this shapes the phased build

| Phase | Deliverable | Gate before moving on |
| --- | --- | --- |
| 0: Feasibility | Confirm launch accounts and permitted publication routes; define source/review contracts | Selected account capabilities and fallback paths confirmed; no AI host required |
| 1: First useful web release | Separate logins, tier/Teams enforcement, five-network multi-format editorial loop and prepared AI task/job/proposal pipeline | Both phones can use the core loop; quota/role/fixture tests pass; production generation remains unavailable |
| 2: Publishing loop | Revision approval, calendar, first account adapter and manual fallback | Approved posts publish with phones asleep; retries do not blindly duplicate posts |
| 3: Internal proof | Deterministic reporting from permitted API/manual evidence, video/transcript inspection where aligned, learning notes, recovery and regular two-user use | Facts and precision/coverage limits remain visible without AI; core workflow and recovery tests pass |
| 4: Funded AI and native app | Limited Free-and-above alt-text/analytics AI; broader Creator+ generation; native capture/offline drafts/sync and tested feature-specific local routes | Project revenue funds delivery/operation; exact feature/finite-quota gates, evidence fidelity and certified local routes pass |
| 5: Public readiness | Independent beta, tenant isolation, capacity budgets, supported-device matrix and onboarding | Product/support/platform/security gates pass before wider advertising |

These are the delivery stages, not a delivery-date promise. Public web beta can follow internal proof without waiting for AI funding; native release requires its funded offline/device gates. The [full sixteen-part build plan](plans/2026-10-05-cadence.md) provides tasks and acceptance criteria for the confirmed five-network launch and accepted manual routes; YouTube is later.

## Remaining essential answers

1. Public plan/extra-seat prices, finite AI quotas and proposed solo-plan user/workspace policy remain undecided. Free's three networks/three total accounts/one per network/limited AI categories and Teams' five included logins plus paid additions are confirmed.
2. Actual account grants, initial brands and source rights during setup; all five launch networks, format families and accepted manual handoffs are settled.
3. Public prices/usage allowances and delivery capacity, where something other than the plan's explicit assumptions is required.

Funding allowances, installed OS versions and latency targets will be resolved when the AI/native phase is scheduled. The supplied model/hosting options and proposed [evaluation scorecard](research/2026-10-05-ai-evaluation-scorecard.md) remain references. Capability/data-permission research supports the requested preparation; model selection, downloads, inference provisioning and execution remain deferred.

Research only: no accounts or infrastructure were changed, no model downloaded, and no device/server benchmark performed. Older research notes retain their original dates and assumptions; the [current requirements record](Cadence-Requirements-and-Decisions.md) governs the next plan revision.
