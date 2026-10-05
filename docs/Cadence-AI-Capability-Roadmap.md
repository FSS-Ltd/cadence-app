# Cadence: AI capability roadmap

Research and specification date: **5 October 2026**, Europe/London.
Status: proposed delivery scope; no features, provider grants, runtime evaluations or account tests have been implemented.
This updates the earlier [AI feature memo](research/2026-10-04-ai-feature-scope.md), whose day-one AI assumption was superseded by the user's funding decision.
Read with the [main plan](plans/2026-10-05-cadence.md) and [requirements record](Cadence-Requirements-and-Decisions.md).

## Confirmed direction and timing

- Launch network scope: LinkedIn, Facebook, Instagram, TikTok and X/Twitter. YouTube is future work.
- Content scope: text, images, carousels, landscape video and vertical video, with destination-specific capability checks. A requested format is not proof that every network supports that format through its API.
- Free now allows three selected launch networks, one account per network (three total), and limited AI alt-text generation plus analytics. Creator unlocks the broader AI catalogue; Professional and Teams inherit it. Plan names and account allowances do not grant platform permissions or unlimited AI compute.
- Requested AI features: analytics that explains results, timestamp/transcript-based video diagnostics where data permits, niche trends, automatic alt-text suggestions, captions, bios and SEO name suggestions. The catalogue below expands these into 33 bounded capabilities.
- Confirmed timing: AI remains deferred until funded, while its model-independent infrastructure, workflows and tests are prepared from the start to minimise later integration work. Enable hosted web AI when project revenue funds it. Native apps must include evaluated offline AI for their certified devices.
- Launch manual handoff is accepted where direct publication is unavailable; AI readiness and plan eligibility do not override a platform's actual account/format capability.

## Delivery order

| Stage | Scope | Release condition |
| --- | --- | --- |
| Now: prepared AI workflows and manual tools | Separate logins/membership, entitlements, task schemas, source/consent/input builders, generation job/usage contracts, proposal review/apply services, test fixtures, accessibility fields, deterministic reporting and sourced opportunity notes | Useful manually; model-independent pipeline tested using synthetic outputs; generation stays unavailable until funded; no inference service or model downloads |
| A1: first funded AI | Limited Free-and-above alt text when image inference passes; Creator-and-above drafting/repurposing, bio/name suggestions and source/review assistance | Funding, feature-specific plan/source checks, task evaluation, finite usage budgets and draft-only application boundary |
| A2: informed decisions | Limited Free-and-above analytics explanations and video diagnostics; Creator-and-above niche opportunities, campaign experiments and reuse assistance | Permitted metric/signal sources; compatible sufficient evidence; freshness, time-bin precision and uncertainty visible |
| A3: media and recurring assistance | Transcription, subtitles, media tagging, clip suggestions and bounded weekly packs | Modality/media pipeline tests, capacity/cost review, opt-in jobs and cancellation; no automatic publication by the model |

A1 starts with captions, platform variants, source repurposing and bio/name suggestions because they use material the owner supplies. Alt text is a first-AI-release priority with a separate vision gate and a limited Free allowance. Analytics explains what a measure means and which next test the evidence supports. Prepare video/time-bin/transcript contracts and manual evidence workflows early, then activate interpretation when data access, funding and evaluation pass. Actual inference in all 33 features is not a condition for the initial web app.

Recommended Free registry mapping: `alt_text`, `analytics_summary`, `period_comparison`, `topic_format_learning` and `video_retention_diagnosis`, with finite feature budgets to be agreed before activation. This implements the confirmed two categories; it does not unlock captions, replacement hooks/scripts, niche discovery or media rendering. A diagnostic may recommend testing a shorter intro or outro without generating replacement content. Creator-and-above retain the broader catalogue. Evaluate each feature independently; the Free allowance does not reactivate unfunded inference.

The “Now” stage spans the unfunded web milestones: task/permission/queue/proposal infrastructure in Phase 1, permitted reporting and sourced evidence workflows during internal proof in Phase 3. The funded phase connects evaluated runtimes; advanced media execution/rendering still needs its separately scoped pipeline tests.

## Preparation to build before a model is connected

The initial build deliberately includes AI readiness. It should avoid later reworking permissions, source selection, drafts, review or quotas when an engine is added. Reuse those domain services across task workflows rather than creating 33 independent assistants.

| Prepared element | Initial implementation and verification | Later model connection |
| --- | --- | --- |
| Feature registry and schemas | Stable feature keys for the catalogue; task purpose, input/output types, required modalities, plan/role rules and release state | Mark only evaluated features live for available runtimes; eligibility alone does not activate a feature |
| Consent/source-use policy | Per-source origin, permitted purpose, allowed workspace/brand, AI processing decision and expiry; explicit selected revisions | Runtime receives only permitted prepared inputs; deny unavailable provider AI uses |
| Task-input builders | Resolve IDs server-side; gather selected playbook/evidence, immutable asset references and computed facts; bound sizes | Transport these prepared inputs to the engine; a transport must not select broader data |
| Output contracts/validator | Typed caption variants, per-image alt text, profile suggestions, analytics observations, evidence-linked signals and calendar/media proposals | Parse and validate generated output; reject invalid fields/source IDs/lengths/dates without replacing user work |
| Job lifecycle | Persistent task identity, authorised input snapshot, queued/running/succeeded/failed/cancelled transitions, lease/correlation metadata and cancellation contracts | Add execution transport and measured progress; requests before activation return feature-unavailable rather than sit in an unserviceable queue |
| Usage/quota boundary | Per-workspace reservations/usage ledger, feature budgets, idempotency and concurrent admission tests; no assumed unlimited generations | Set evaluated units/allowances/cost accounting before release; reconcile reservation on completion/cancellation/failure |
| Proposal review and apply | Show source/metric evidence and diff; accept/reject/edit actions; expected revision checks; apply through existing content services | Model output becomes a normal proposal; stale output never silently overwrites a newer draft |
| Analytics/trend interfaces | Per-account metric definitions/verified tables; retention time-bin/skip-rate facts and exact-asset transcript alignment; signal provenance; missing/stale/denied states | Add permitted source integrations and AI interpretation; do not manufacture missing signals or exact drop timestamps from aggregates |
| Synthetic-output fixtures | Development/CI fixtures for valid/invalid output, malicious source instructions, conflicting brand, missing modality and failed/cancelled jobs | Replace fixture executor with actual engine adapter only in a funded evaluation environment; fixtures never masquerade as generated production output |
| User-facing workflow states | Manual fields work; explain when AI is unavailable, why a source cannot be used and what can be edited manually; no clickable action claiming live generation | Turn on evaluated actions behind the same task pipeline; preserve manual editing during AI outages |

The initial release's fixture tests prove orchestration, validation, permissions and review behaviour. They cannot prove model quality, image/audio understanding, latency, memory or cost. Future hosted/native transports must pass the same contracts plus actual workload evaluation. Provider/account integration and native offline support remain distinct implementation work.

## Input classes and authorisation

| Class | Examples | Use boundary |
| --- | --- | --- |
| O: original owner material | FSS notes, approved case-study facts, user-written drafts, owned images, supplied bio text, consented recordings | Selected workspace/brand and source use permissions; third-party rights/confidentiality still checked |
| M: measured performance | Permitted account/post counts, authorised CSVs, recorded enquiries, manually entered observations | Record origin, metric definition, window, post age, paid/organic status and access rules; application code computes figures |
| S: sourced niche signals | Authorised industry feeds, dated research notes, approved Google Trends exports, provider data with confirmed rights | Preserve source/region/period/fetch date/rights; link evidence; distinguish attention signals from actual account performance |
| C: community input | Permissioned audience questions, comments or messages | Minimise personal data; provider-specific AI purpose restrictions; no sensitive profiling or cross-client reuse |

Each proposed AI task must pass **workspace membership + role/action permission + plan entitlement + source permission + provider allowed use + feature release status + usage budget**. Recheck permissions when a queued task runs and before applying its result. Entitlement is owned by application code, not the AI prompt.

Store origin and applicable restrictions when data enters Cadence, including exports and pasted material. Copying provider content into a source record does not automatically remove its restrictions. Deleting or losing access to a source must remove/restrict derived copies and later retrieval where required. A team member's private material stays private unless explicitly shared for the destination brand.

## Capability catalogue

Every output below is editable and tied to selected source revisions, brand and account. “Generate” means create a proposal/draft; applying it uses the normal revision service and public changes need approval.

### A1: make a usable post faster

| ID | Capability | Inputs → output/action | Gate and value measure |
| --- | --- | --- | --- |
| 01 | Brand-playbook assistant | O: owner answers/examples → proposed audience, offer, pillars, tone, prohibited claims and CTA patterns | Owner accepts version; measure setup time and later brand edits |
| 02 | Caption generator | O: source facts, selected asset description and playbook → a small set of captions | Never invent claims/asset details; measure approved-caption time and unsupported claims |
| 03 | Hook and CTA variants | O: draft, audience and real offer → selectable openings/next steps | No fabricated scarcity/results; measure selection time and experiment outcomes separately |
| 04 | Rewrite and translate | O: draft and requested style/language → shorter, clearer or translated revision | Preserve names/numbers/meaning; language quality check; measure editing effort |
| 05 | Platform/account adaptation | O: approved source/draft, account playbook, format rules → distinct variants for selected destinations | Code validates current limits; explicit per-account preview; measure time for an approved multi-network batch |
| 06 | Evidence-led ideas | O: selected source facts, pillars and audience questions → angles with source links | Ideas labelled creative; no invented news or statistics; measure ideas converted into approved posts |
| 07 | Source repurposing | O: owned article/notes/transcript → posts, thread outline or campaign pieces | Claim/source links and separate revisions; measure usable outputs per source |
| 08 | Carousel writer | O: source, goal and template → slide order, concise copy, closing CTA and accessibility descriptions | Rendering is a template/media feature; no guaranteed conversion; measure slide editing time |
| 09 | Video production brief | O: facts/approved transcript → vertical/landscape scripts, shot list, on-screen text, title and thumbnail brief | No video generation claim; format/crop choices remain explicit; measure preparation time |
| 10 | Auto alt-text suggestions | O: actual image plus posting context → editable alt text per image/slide | Vision must be available/tested; review before approval; measure meaningful-image coverage and visual errors |
| 11 | Bio optimiser | O: owner-supplied current bio, audience, offer and verified links → options explaining changes | Draft and copy/apply manually initially; preserve facts; measure editing time and profile completeness |
| 12 | SEO name optimiser | O: genuine identity/business name, niche, location where relevant → display-name/headline options | Separate display name from username/handle; no availability or ranking promise; measure accepted changes and clarity |
| 13 | Search terms and hashtag suggestions | O/S: draft, niche and permitted keyword evidence → concise relevant terms/hashtags | Label relevance-only suggestions unless current measurements exist; code applies limits; no “trending” label from model memory |
| 14 | Source/claim review | O: draft and selected evidence → missing support, stale facts and quote/number checklist | Source ID/string checks in code; model cannot certify truth; measure unsupported additions caught/missed |
| 15 | Brand and accessibility review | O: revision, playbook and media metadata → tone, repeated phrasing, clarity and accessibility suggestions | Hard format/length/readiness rules are deterministic; measure false alarms and review time |

### A2: choose the next post with evidence

| ID | Capability | Inputs → output/action | Gate and value measure |
| --- | --- | --- | --- |
| 16 | AI analytics summary | M: verified computed facts table → evidence-linked observations, limitations and next tests | Allowed AI use confirmed per source; numbers calculated in code; measure numerical/source fidelity and reader usefulness |
| 33 | Video retention diagnosis | Eligible M + optional O: curve bins, compatible skip/viewed measure and exact-video timed transcript → drop windows, matched speech/context, plausible explanations and editing tests | Free analytics eligible when released; source precision limits timestamp detail; aggregate data cannot establish which line caused exits; no replacement script or automatic edit |
| 17 | Account/period comparisons | M: comparable posts and account/time windows → within-account observations and per-network explanations | Definitions/ages align; missing data is not zero; no universal blended engagement score; measure actionable valid comparisons |
| 18 | Topic/format learning | O + eligible M: content labels and comparable results → observed patterns for text/images/carousels/video | Keep sample size and confounders visible; no causal claim; measure useful experiment uptake |
| 19 | Posting-time experiments | M + owner constraints → suggested test windows | When insufficient data, explicitly a test suggestion; timezone resolved in code; measure scheduling effort and comparable outcomes |
| 20 | What to post next | O + eligible M/S: sources, calendar gaps, measured results → ranked next-draft proposals with reasons | Ranking criteria/version visible; no virality guarantee; measure accepted proposals and time to decision |
| 21 | Experiment designer | O/M: goal and baseline → one hypothesis, variable, metric and observation window | Owner accepts; inconclusive results supported; measure completed useful tests, not claimed causal uplift |
| 22 | Content-gap finder | O: calendar and pillars → uncovered questions, audiences or topics | A gap in the user's plan is not proof of market demand; measure approved gap-filling posts |
| 23 | Evergreen refresh | O + eligible M: prior owned posts and source freshness → refresh/repurpose shortlist | Check offers/dates/rights; new revision/approval; measure usable reuse and stale claims avoided |
| 24 | Niche trending/opportunity page | S + niche definition → sourced current signals grouped by niche, region and period | No unsupported global feed; each card shows evidence/freshness; measure relevant saved cards and decisions made |
| 25 | Trend-fit brief | Eligible S + O: dated signal, FSS expertise and owned facts → why it may matter and an original content angle | Signal rights permit generation; creative angle separate from measured trend; measure briefs converted into useful original posts |
| 26 | Audience-question organiser | Eligible C → themes, FAQs and follow-up source prompts | Redact identities; verify permitted categorisation purpose; measure research time and covered audience questions |
| 27 | Response drafts | O + eligible C → proposed reply in the account's voice | Read permissions do not grant AI reply-generation rights; no auto-DMs/replies; measure safe drafts accepted with minimal edits |

### A3: media and recurring assistance

| ID | Capability | Inputs → output/action | Gate and value measure |
| --- | --- | --- | --- |
| 28 | Voice-note/transcript capture | O: consented recording → time-stamped transcript, summary and candidate post facts | Preserve playback; names/numbers/accents evaluated; measure transcript correction and capture time |
| 29 | Subtitle assistance | O: owned video/audio → reviewed subtitle file and caption suggestions | Separate ASR/timing/export pipeline; no support claim from text generation alone; measure subtitle errors and preparation time |
| 30 | Media tags and OCR | O: actual image/frame → editable tags, visible text and search metadata | Tested vision/OCR; no face recognition/sensitive inference; measure retrieval time and OCR corrections |
| 31 | Clip recommendations | O: transcript/timestamps, optionally tested frames → start/end suggestions, title and reframing brief | Recommendation does not itself cut/render video; preserve context and rights; measure usable clip briefs |
| 32 | Weekly draft pack | O + eligible M/S: selected sources, goal and calendar → bounded campaign/draft proposals | Opt-in recurring generation, quota/cancellation, no auto-approval; measure batch time and approved/published yield |

## Account analytics: deterministic facts before AI interpretation

Create a metric definition for each provider/format: name, meaning, units, numerator/denominator, source time and permitted use. Keep impressions, reach, plays/views, watch time, saves, clicks and engagement separate. Do not fabricate unavailable metrics or convert “not fetched” into zero.

Every reporting card should explain **what this measures**, **what the observed result says**, **what it does not establish** and **what to inspect or test next**. A stored, reviewed glossary supplies the definition even without AI; funded interpretation adds account-specific context from permitted facts. For example, explain why watch duration and completion describe different things, or why a larger view count does not by itself establish enquiries or sales. Retain each network's own definition rather than inventing one shared meaning for similarly named measures.

Calculate totals, changes, weighted rates and sample sizes in code/SQL. Compare organic with organic and similar post ages/formats/windows; show the exact metric basis. Avoid averaging platform percentages or claiming unique cross-network reach from summed figures. Deduplicate only when a permitted identity/data source genuinely supports it.

The AI receives only a small, authorised facts table with evidence identifiers. It explains observations, asks about missing context and proposes tests. It cannot establish that a caption, time or hashtag caused a result. Early forecasts and “best time” claims remain out of scope until sufficient data and proper evaluation exist.

Video analytics adds an **observed pattern → possible explanation → next test** workflow. Code computes time-bin changes in percentage points or source units, compares compatible cohorts and aligns a supplied transcript only with the exact published cut. A drop coinciding with a line is evidence of timing, not proof that the line caused it; pacing, visual changes, audience targeting and a completed payoff are alternatives. Show a time range when bins are coarse, and an aggregate explanation when no curve is available. See the [video analytics coach specification](Cadence-Video-Analytics-Coach.md) and [platform access evidence](research/2026-10-05-video-diagnostics-network-access.md).

Prepare transcript references and human corrections now. Free may supply an owned timed transcript for analytics; it does not gain the general `transcript_capture`, subtitle or clip-generation tasks. Any later automatic transcription dependency needs its own permitted purpose, modality evaluation, release state and finite budget.

Useful non-AI reporting and manual alt-text fields should remain available according to the core product plan; an AI paywall should not prevent someone adding accessibility text. Decide reporting/history/AI usage allowances explicitly before public pricing, rather than implying that unlimited accounts includes unlimited imports, storage or generations.

## Niche trends: a truthful initial design

Use a per-brand niche definition: audience, industry, language, geography, topic keywords and excluded topics. Start the page with **Sourced opportunities**, **Rising in your own content** and **Saved research**; use “trending” only where a measurement actually supports it.

A signal card records source/link, observed or fetched time, original publication time, region, measurement period, keyword/topic, available measure and whether it is a measured signal or someone's observation. Preserve source attribution. An expired/stale signal loses its current label; a model's prior knowledge cannot refresh it. Sort measurable change in code, and have AI explain relevance separately.

| Source candidate | Credible use | Access/cost/rights gate |
| --- | --- | --- |
| User's own content and permitted counts | Identify rising topics within those accounts; use comparable windows | Not global trends; provider AI rules still apply to API-derived inputs |
| Google Trends official CSV export | User imports a selected search-interest chart with region/period/source | Google documents CSV export and requires attribution/terms; do not describe relative search interest as absolute search volume. [Export guidance](https://support.google.com/trends/answer/4365538?hl=en), [API announcement/data meaning](https://developers.google.com/search/blog/2025/07/trends-api) |
| Google Trends API | Potential later scheduled trend source | The current official page still requests alpha applications; Cadence has no grant. No unofficial scraping fallback or general-access promise. [Current alpha page](https://developers.google.com/search/apis/trends) |
| TikTok Creative Center | Link user to manual industry/time-frame research; retain permitted owner observations | UI access does not establish an API/redistribution licence. [TikTok trend workflow](https://ads-useast2a.tiktok.com/resources/help/article/how-to-use-trends?lang=en&redirected=2) |
| X trends/search | Official source candidate after a budget/access decision | Current prices include Trends at US$0.010/request and separately billed reads; outside the present budget. [Official pricing](https://docs.x.com/x-api/getting-started/pricing) |
| Permissioned industry feeds or owner's research | Summarise and link recent niche developments | Review specific feed licence/terms, fetch limits and permitted AI processing; no assumed right to reproduce full articles |
| LinkedIn/Meta discovery or third-party commercial feeds | Future scoped signals only | Confirm an approved product, access, intended AI use and retention; not a blanket five-network public-content search capability |

TikTok Research API requires eligible independent public-interest/non-commercial research. It is not a Cadence commercial trend-data workaround; its current overview's general “commercial analysis” wording does not override the Research Tools eligibility rules. [Eligibility](https://developers.tiktok.com/products/research-api/), [Research API FAQ](https://developers.tiktok.com/docs/en/research-api-faq)

Trending audio is not automatically licensed for business posts. TikTok directs commercial use towards its Commercial Music Library or appropriate separately secured rights. Do not copy a track across networks because it was available on TikTok. [Commercial music guidance](https://ads.tiktok.com/resources/help/article/commercial-music-library)

## Provider data and AI gates

**LinkedIn:** its Developer AI Policy generally prohibits AI inputs/training on Marketing API data except listed cases. Current app users' own content, with consent, can support drafting/modification; other authors' content has narrower prioritisation, categorisation and accessibility uses, and cannot be used to generate/modify content. Independently client-provided data is outside that specific policy, but is not automatically free of other rights/privacy obligations. API-derived profile fields and numerical analytics are not clearly authorised for AI by the own-content exception: keep AI ingestion disabled until the intended use is confirmed. Hosted third-party processing also needs the protective agreement required by the policy. [LinkedIn AI policy](https://learn.microsoft.com/en-us/linkedin/marketing/developer-ai-policy?view=li-lms-2026-08)

LinkedIn permits reporting for authorised accounts subject to its terms, requires separate LinkedIn views in cross-channel reporting and imposes data-class-specific restrictions. Deterministic reporting permission is not equivalent to AI input permission; derived summaries keep applicable origin/access restrictions. [Marketing terms, sections 3–5](https://www.linkedin.com/legal/l/marketing-api-terms), [restricted data uses/retention](https://learn.microsoft.com/en-us/linkedin/marketing/restricted-use-cases?view=li-lms-2025-09)

**Facebook/Instagram:** Meta's official Instagram collection establishes professional-account management/insights as a technical candidate; grants depend on the chosen flow. Current main Meta terms/insights pages could not be retrieved in this research. Revalidate permitted AI processing, sharing, scopes and data retention in the current documentation/app review before enabling API-derived AI inputs. Do not present a missing terms retrieval as permission. [Meta-owned collection](https://www.postman.com/meta/instagram/documentation/6yqw8pt/instagram-api?entity=request-23987686-db99ce99-bf76-475c-8b76-718576c11cae), [terms to verify](https://developers.facebook.com/terms/), [insights to verify](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/insights/)

**TikTok:** Display API lists an authorised user's public videos; the video object documents views, likes, comments and shares. This is a limited metadata/counts candidate, not proof of complete watch-time, audience or commercial trend access. Verify the approved product/use and permitted AI processing separately. [Display API](https://developers.tiktok.com/docs/en/display-api-overview), [video list](https://developers.tiktok.com/docs/en/tiktok-api-v2-video-list), [video fields](https://developers.tiktok.com/docs/en/tiktok-api-v2-video-object?enter_method=left_navigation)

**X:** API access is paid under the present published scheme. Its agreement prohibits using API/content to train or fine-tune foundation/frontier models. Drafting from the user's original Cadence content does not require X ingestion. Any later analysis of X-derived material still needs an access, purpose, retention and inference-processing review; a training restriction alone is not a universal inference permission. [Pricing](https://docs.x.com/x-api/getting-started/pricing), [developer agreement](https://docs.x.com/developer-terms/agreement)

**Profiles:** bio/display-name/headline/SEO suggestions start with owner-supplied facts and produce copyable drafts. They do not rename an account, change a handle, assert its availability or promise a search ranking. Add account-changing actions only after the actual endpoint/scope is verified, with explicit user approval and a preview of the final change.

## Alt text and accessibility acceptance

“Auto alt text” means automatically prepare a suggestion when the user adds a supported image, then show it for editing before approval. Use the actual image and its posting context. If image inference is unavailable, offer manual description; do not infer the image from a filename or caption alone.

Describe the meaningful information, visible text and purpose. Decorative web images may need empty alternatives; complex charts may need an adjacent longer explanation. Carousel images need their own descriptions. These decisions depend on context, which is why human review remains necessary. [W3C alt decision tree](https://www.w3.org/WAI/tutorials/images/decision-tree/), [complex images](https://www.w3.org/WAI/tutorials/images/complex/)

Never guess identity, disability, ethnicity, emotion or other sensitive characteristics. Validate applicable field lengths and whether the destination API actually accepts the field; where unsupported, show a clear manual accessibility instruction. Subtitles/transcripts are separate from image alternatives. Test real accessibility tasks and final provider output; do not label an AI description as an accessibility certification.

## Safe action boundary and evaluation

- AI can read only selected authorised sources/facts, propose a revision and save a new draft within its authorised workspace. Applying a suggestion uses version checks and never silently replaces accepted content.
- No model-accessible publish, approval, delete, credential, billing, permission, profile-change or arbitrary network/shell/database tools. Scheduling/campaign plans remain proposals until accepted through normal commands.
- Imported webpages, OCR, captions, transcripts and comments are untrusted input. Enforce source/action boundaries outside the prompt; keep credentials out of context. [OWASP prompt-injection guidance](https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html)
- Future tasks record feature/model/prompt version, selected source revisions, measured latency, output and acceptance/rejection. Retain minimal evaluation metadata; do not log private source text by default or train on customer content by default.
- Evaluate caption/repurpose/bio tasks on real permitted FSS examples; measure source fidelity, brand fit, edit time and useful-output acceptance. Evaluate analytics against fixed computed facts; test missing/zero/stale/incompatible metrics, rewatch ratios, coarse bins, transcript version/offset mismatch, percentage-point changes and unsupported causal claims. Evaluate trends for attribution/freshness and original angles.
- Evaluate alt text against the actual image/context with human accessibility review, including charts, text-heavy slides and uncertain details. Evaluate speech/media separately, including accents, noise, timing and peak resource use.
- Include cross-workspace/source isolation, adversarial imports, revoked permissions, plan downgrade, quota exhaustion, cancellation, failed generation and stale apply requests. A failed AI task must preserve manual editing and scheduling.

Proposed acceptance criteria should be set against the measured pilot baseline: lower median time per approved post/batch, lower rewriting effort, more usable drafts published, accurate calculations and more documented next-post decisions. Require no cross-tenant disclosure and no unauthorised actions in the evaluated suite. Set numeric task-quality/latency/usage thresholds in the funded evaluation; this planning document does not invent measured performance or a guaranteed growth uplift.

## Deliberate exclusions from the first AI release

Unrestricted web/social scraping, autonomous posting/replies, lead-list building, follower identity profiling, training a cross-customer model, guaranteed virality/search ranking, synthetic testimonials, general image/video generation and a full video editor are outside A1. They require distinct evidence, permissions, scope and budget decisions; they are not hidden dependencies of captions, analytics or the niche page.

Verification performed for this document: primary documentation research, source-limit/wording review, catalogue count and Markdown/local-link checks. No provider account access, paid services, model downloads, application code or hardware tests were performed.
