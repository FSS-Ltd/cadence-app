# Cadence: Vercel + Supabase feasibility

Research date: **5 October 2026**. Fixed choices: Vercel website, Supabase database, web app first, native iPhone app later.
Pilot: Jean and wife; iPhone 13 and iPhone 16 Pro Max. Future 8 GB minimum refers to public user devices, not a cloud-server spending limit.
No paid AI API/provider subscription is proposed. A separate AI server is paid hosting and remains conditional on the user's budget/permission.
No accounts, infrastructure, credentials or schemas were changed. No model or application performance was measured.

## 1. Recommended starting architecture

Use Next.js on **Vercel Pro**, with Supabase Auth, PostgreSQL, private media Storage and a durable publishing-job table.
Run one authenticated Vercel cron sweeper every minute; it claims due jobs atomically and performs bounded publishing steps.
Keep social API adapters and job transitions in shared server modules, so a later VPS worker can use the same logic.
Choose hosted inference on a separate UK/EU VPS if the budget permits; otherwise the plan must explicitly choose a compatible local/downloaded-model path.
AI generates drafts only. Persist approved text/media before scheduling; due publication never depends on a model or an awake phone.

```text
Phone/browser -> Vercel web/API -> Supabase Auth + brand/draft/schedule data
                              -> direct authorized Storage upload/download
Vercel Cron -> bounded publisher -> durable job claims -> official social APIs
Optional private AI host -> limited AI job access -> draft result in Supabase
```

Use **Vercel lhr1 + a specific Supabase eu-west-2 project** where available; functions otherwise default to US iad1.
The global CDN and service operations still need a separate residency/privacy review; selecting London is not proof every data flow remains UK-only. [Vercel region configuration](https://vercel.com/docs/functions/configuring-functions/region), [region codes](https://vercel.com/docs/regions), [Supabase residency](https://supabase.com/docs/guides/platform/regions)

## 2. Commercial hosting and base cost

Vercel Hobby is limited to **non-commercial personal use**. An internal FSS business tool should therefore plan for Pro from pilot launch. [Hobby policy, updated 14 September 2026](https://vercel.com/docs/plans/hobby)
Current Pro costs **US$20/month**, including one deploying team seat and US$20 monthly infrastructure credit; unused credit expires, and additional usage is billed.
Additional deploying seats cost US$20 each; ordinary Cadence users do not need Vercel developer seats. Unlimited read-only Vercel viewers are free. [Pro pricing, updated 15 September 2026](https://vercel.com/docs/plans/pro-plan)
Vercel prices exclude applicable taxes. Existing FSS subscriptions/shared credits have not been inspected; incremental costs may differ.

Supabase Pro starts at **US$25/month**, with US$10 compute credit covering one Micro project: 1 GB shared DB RAM, 8 GB database disk, 100 GB file storage and seven-day daily DB backups.
Extra projects start from US$10 compute; database disk overage is US$0.125/GB and file storage overage US$0.0213/GB. Keep development local initially. [Current pricing](https://supabase.com/pricing)
Free allows 500 MB DB, 1 GB files and small egress quotas, pauses after a week of inactivity and lacks automatic database backups; use it for a disposable prototype, not the dependable scheduling default. [Free limits](https://supabase.com/pricing), [backup availability](https://supabase.com/docs/guides/platform/backups)
**New-account planning floor: US$45/month + AI hosting if chosen + overages + independent media backup + applicable taxes.** This is not a fixed all-inclusive quote.
Spend alerts/caps cover specified billable resources; do not promise they are an absolute spending ceiling. Pausing a production project also pauses its scheduling service.

## 3. Vercel Functions are bounded execution

| Current Node/Fluid limit | Consequence |
|---|---|
| Pro defaults to 2 GB/1 vCPU; maximum 4 GB/2 vCPU | Configure publishing for measured resource use; not a persistent inference machine. |
| Default 300 seconds; 800 seconds generally available; 1,800 seconds extended beta | Divide upload/create/status work into recoverable steps; do not depend on beta duration. |
| Standard uncompressed function bundle 250 MB; large bundles up to 5 GB beta | Do not package multi-GB model weights into the ordinary application function. |
| Ordinary function request/response payload limit 4.5 MB | Upload media and download weights directly from object storage, not through ordinary function bodies. |

Sources: [Functions limits, updated 24 August 2026](https://vercel.com/docs/functions/limitations), [duration requirements](https://vercel.com/docs/functions/configuring-functions/duration).
`waitUntil()`/Next.js `after()` can extend work beyond the HTTP response, but share the function's deadline; timed-out promises are cancelled.
They are not durable scheduling, a continuously running worker or persistent model hosting. [Background-task lifecycle](https://vercel.com/docs/functions/functions-api-reference/vercel-functions-package)
Use private Supabase buckets, authorized direct/resumable uploads, and save object keys rather than large binaries in database rows. [Resumable upload guidance](https://supabase.com/docs/guides/storage/uploads/resumable-uploads)

## 4. Scheduling options and recovery

Vercel currently supports **100 cron jobs/project**; Pro minimum interval is one minute with per-minute precision. Hobby is daily with per-hour precision.
Cron has no separate charge, but invoked Functions consume normal usage. [Cron limits/pricing, updated 15 July 2026](https://vercel.com/docs/cron-jobs/usage-and-pricing)
Vercel cron delivery is **best effort**: missed requests, duplicate invocations and overlapping runs are possible; failed invocations are not retried.
Verify the bearer `CRON_SECRET`, fail closed when unset, and avoid redirects on the cron path. [Delivery, security and concurrency](https://vercel.com/docs/cron-jobs/manage-cron-jobs)
Vercel cron uses UTC; store due timestamps in UTC and retain the selected IANA zone for the calendar/BST rules. [Cron timezone](https://vercel.com/docs/cron-jobs)

| Option | Pilot fit | Trade-off |
|---|---|---|
| **Supabase durable jobs + Vercel Pro cron** | Recommended initial publisher | Fewest extra hosts; minute-based wake-ups and function deadlines require checkpoints/catch-up. |
| Supabase pg_cron + authenticated HTTP wake-up | Viable alternative scheduler | Database-native timing; additional secret/HTTP-run monitoring. Keep durable jobs separate from HTTP dispatch. |
| Supabase jobs + separate VPS publisher | Later option for sustained uploads/throughput | Persistent process and finer polling; extra hosting, patching, monitoring and recovery duties. |

Do not run two independent implementations that both create posts. A backup wake-up may call the **same** atomic claim path.
For the first two-user pilot, an indexed `publishing_jobs` table with due time, state, attempt count, lease expiry and a unique publication key is enough.
Claim and update jobs transactionally, commit before network calls, then checkpoint provider IDs/results. Do not keep a DB transaction open throughout an upload.
Query **all outstanding jobs due before now**, not just those assigned to the current cron minute. Apply an explicit lateness policy before publishing delayed posts.
Use bounded exponential backoff for safe transient operations and a reconnect state for expired tokens; never blindly retry an uncertain post-creation call.
Use `outcome_unknown` when a provider may have accepted a publication: reconcile provider IDs/status or obtain manual confirmation before retry.
Queue delivery cannot make an external API exactly-once. The provider may publish successfully immediately before the worker loses its response.

Supabase Queues/pgmq is an optional durable transport; its documented exactly-once delivery applies **within a visibility window**, not to external publication effects. [Queues guarantees](https://supabase.com/docs/guides/queues)
Supabase Cron can run from every second; its guidance recommends no more than eight concurrent jobs and ten minutes per job. These are performance recommendations. [Cron guidance](https://supabase.com/docs/guides/cron)
pg_cron + pg_net can invoke authenticated endpoints; store the dispatch secret in Vault. [Scheduling example](https://supabase.com/docs/guides/functions/schedule-functions)
Database webhooks fire on changed rows and use asynchronous pg_net; they are not a future-post scheduler. [Webhook semantics](https://supabase.com/docs/guides/database/webhooks)
pg_net uses **unlogged** request/response tables lost on crashes, keeps responses six hours by default and targets at most 200 requests/second.
Use it to wake a consumer, never as the sole durable publication queue or audit log. [pg_net limitations](https://supabase.com/docs/guides/database/extensions/pg_net)
Supabase Edge Functions have 256 MB RAM, two seconds CPU per request and bounded worker lifetime; they are not an LLM host either. [Edge limits](https://supabase.com/docs/guides/functions/limits)

## 5. Database, OAuth and secret boundaries

For Vercel SQL access, use the transaction pooler, a small application connection pool and compatible prepared-statement settings.
Session-level advisory locks do not survive transaction pooling; prefer persisted leases/atomic row claims. Require TLS and verify the server certificate where supported. [Connection modes and caveats](https://supabase.com/docs/guides/database/connecting-to-postgres)
Enable RLS on exposed tables with workspace membership/role policies; authenticated alone is not sufficient authorization. Secret/service-role keys stay server-only. [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)
Separate Cadence sign-in from permission to publish to a social account. Supabase Auth does **not** store social provider tokens in the project DB or refresh them automatically. [Provider-token responsibilities](https://supabase.com/docs/guides/auth/social-login)
Implement provider-specific connect/callback/state validation, least scopes, expiry tracking, refresh/reconnect, revocation and per-account ownership checks.
Store tokens encrypted in a private server-only structure, with audited access and key rotation; never include them in AI prompts, browser responses or ordinary logs.
Vault provides authenticated encryption at rest, but its decrypted SQL view requires strict privileges. It is an option for dispatch/provider secrets, not permission for public clients to read them. [Vault access model](https://supabase.com/docs/guides/database/vault)
Give an AI worker access only to authorized draft jobs/results; it does not need social publication tokens.
Daily Supabase backups omit Storage objects. Back up media separately and test restoring database, assets and encryption-key dependencies. [Backup scope](https://supabase.com/docs/guides/platform/backups)

## 6. Hosted AI and future downloaded-model choices

Hosted open weights remove a per-token AI-provider fee but consume paid hosting. A private VPS can serve both phones and the website without a multi-GB phone download.
Keep model execution on that host and submit durable AI jobs from Vercel; record results in Supabase and let the UI poll/subscribe instead of holding a function open indefinitely.
Start with one concurrent generation; benchmark CPU speed and quality before choosing server/model. Phone memory requirements do not constrain server RAM.
The **4 October observed** lean candidate was OVH UK 8 GB/4 vCore, from £6.29 ex VAT/£7.55 inc VAT; its link selects upfront12, so rolling price/stock remains unverified.
The observed 12 GB/6 vCore alternative was from £9.01 ex/£10.81 inc; larger RAM creates headroom, not a guaranteed speed improvement. [OVH UK cards](https://www.ovhcloud.com/en-gb/vps/vps-uk/)
A larger comparison tier was Lightsail London **16 GB/4 vCPU at US$84/month**, versus 8 GB/2 vCPU at US$44. More resources still require measured latency. [Lightsail tariff](https://aws.amazon.com/lightsail/pricing/)
These are hosting candidates, not selected services or spending authority. The previous memo records backup/availability qualifications.
Local download, browser inference and a bundled native-phone model remain separate device/runtime certification choices; model distribution cost exists even when inference has no vendor bill.

## 7. Multi-GB model distribution costs

Illustrative post-install download sizes **2.58–3.66 GB** imply **2,580–3,660 GB (2.58–3.66 decimal TB)** for 1,000 full downloads, before retries, updates or reinstalls.
Supabase Pro has **separate organization-wide** quotas of 250 GB uncached and 250 GB cached egress; the same allowances are shared with other project/service traffic.
Beyond each quota, uncached egress is **US$0.09/GB** and cached **US$0.03/GB**. [Current egress accounting and tariffs](https://supabase.com/docs/guides/platform/manage-your-usage/egress)

| Illustrative Supabase case; no other traffic | 2.58 GB × 1,000 | 3.66 GB × 1,000 |
|---|---|---|
| Every download classified cached | US$69.90 overage | US$102.30 overage |
| Every download classified uncached | US$209.70 overage | US$306.90 overage |

These are **two scenarios**, not guaranteed cache rates or absolute cost bounds; mixed usage has separate quotas and retries can add transfer.
Use immutable public weight paths only where licence/access rules permit; keep users' unpublished media private. New private signed URLs create new cache keys, so reuse/expiry/access need deliberate design. [Smart CDN cache semantics](https://supabase.com/docs/guides/storage/cdn/smart-cdn)
Vercel Pro's current Flat Rate CDN includes a 1 TB/1M-request tier, but **bulk file distribution and file-dominated bandwidth are out of scope**. Do not assume it subsidizes thousands of model downloads. [Eligibility and tiers](https://vercel.com/docs/pricing/flat-rate-cdn)
Vercel Blob objects above **512 MB** always cache-miss; each download adds origin transfer. Its current Pro billing is usage/credit based, not the old fixed free Blob allowance. [Blob limits/billing](https://vercel.com/docs/vercel-blob/usage-and-pricing)
London's published on-demand Blob transfer is **US$0.05/GB**, origin transfer **US$0.06/GB**, storage US$0.024/GB-month, with operation/CDN fees. [London tariff, updated 14 September 2026](https://vercel.com/docs/pricing/regional-pricing/lhr1)
For a single >512 MB object under those London rates, 2,580–3,660 GB transfer would be roughly **US$283.80–402.60 gross transfer charges**, before credit, storage, operations, taxes and other traffic; confirm the actual delivery/billing regime.
Avoid proxying weights through Vercel Functions. Use direct object/publisher downloads with resumable transfers, disk-space checks and verified SHA-256 manifests.

Direct publisher/Hub download can avoid Cadence's own weight egress bill, but remains an external availability, access, rate-limit and release-management dependency.
Pin the full repository revision and file hash, preserve applicable notices, and verify the artifact licence permits the intended bundling/mirroring/distribution.
Do not silently ship mutable `main` downloads or assume a publisher will host that file indefinitely. Keep an approved recovery/mirror plan without automatically spending money.
Hugging Face documents revision-pinned downloads, rate limits and gated access; a private access token must never be embedded in a public app. [Versioned downloads](https://huggingface.co/docs/huggingface_hub/guides/download), [rate limits](https://huggingface.co/docs/hub/rate-limits), [gated files](https://huggingface.co/docs/hub/models-gated)

## 8. Pilot acceptance gates and limitations

Test missed/duplicate cron requests, overlapping workers, expired leases, cancellation races, provider throttling, expired tokens and uncertain publication outcomes.
Run an overnight scheduled-post pilot with both phones asleep; verify a failed AI host does not stop already approved publications.
Measure sweeper wall time, database connection use, due-job lag, active CPU, provisioned-memory billing, media egress and actual backup/restore time.
Alert on stale scheduler heartbeat and oldest due job; after an outage, distinguish recoverable late work from content requiring reapproval.
Specify an initial ordinary-function deadline well below 800 seconds; checkpoint large uploads/status polling rather than relying on a single long request.
No hosting choice removes LinkedIn/Meta approval requirements or TikTok's internal-tool restrictions; native/manual fallback still belongs in the phased plan.
Budget, extra AI hosting permission, model download versus hosted inference and final platform selection remain pending.
Official pages were checked on the research date; the Supabase markdown changelog could not be fetched by the browser tool (unsupported content type), so no changelog-wide compatibility claim is made.
Bundled Vercel skill examples contain stale cron/body-size figures; this memo uses the linked current primary docs instead.
Research only: no automated application tests, credential review, hosting checkout or hardware benchmark was run.
