# Cadence: lean UK/EU hosting options

Research date: **4 October 2026**. Scope: hosted web application, dependable scheduling worker, shared open-weight AI, and two internal users.
Status: **conditional options; monthly budget, contract term, selected region and actual inference performance remain pending.**
No infrastructure was provisioned, accounts changed, purchases made, models downloaded or performance benchmarks run.
Prices below retain their published currencies; no exchange-rate conversions are assumed. Applicable taxes, renewal terms and live capacity must be checked before purchase.

## 1. Recommendation to carry into the build plan

Start with one Linux VPS running the web/API service, a separate publishing worker and a private inference process.
Use PostgreSQL for durable jobs and application data; do not add Redis, Kubernetes, Temporal or a separate search service for this two-user pilot.
Choose managed PostgreSQL if the budget supports it; otherwise document the operational burden of PostgreSQL on the VPS.
Treat an 8 GB shared server as a benchmark target, not proof that every 4B model plus the application will fit.
Consider a 12 GB server if its confirmed price is close: the user-device 8 GB requirement need not become an artificial server limit.
Use only reviewed direct social API integrations and manual native fallbacks; paid publishing intermediaries are outside the clarified scope.
The existing [publishing feasibility memo](2026-10-04-publishing-feasibility.md) remains the source for platform permissions and internal-tool restrictions.

## 2. Published compute options

| Option | Published specification | Published recurring price | Important qualification |
|---|---|---|---|
| OVHcloud UK VPS-2 | 4 vCores, 8 GB RAM, 75 GB NVMe, unlimited UK traffic, 1 Gbps | **From £6.29 ex VAT / £7.55 inc VAT per month** | Advertised “from” price; linked configurator selects `pricing=upfront12`. Rolling monthly quote unverified. |
| OVHcloud UK VPS-3 | 6 vCores, 12 GB RAM, 100 GB NVMe, unlimited UK traffic, 2 Gbps | **From £9.01 ex VAT / £10.81 inc VAT per month** | Same need to confirm commitment, renewal, region and capacity. |
| Hetzner CX33, Germany/Finland | Shared x86, 4 vCPU, 8 GB RAM, 80 GB NVMe, 20 TB EU traffic | **€8.49/month ex VAT and IPv4** | Cost-optimised landing page currently says unavailable; do not rely on immediate capacity. |
| Hetzner CAX21, Germany/Finland | Shared Arm, 4 vCPU, 8 GB RAM, 80 GB NVMe, 20 TB EU traffic | **€10.49/month ex VAT and IPv4** | Same capacity caveat; verify runtime/container Arm support before selecting. |
| Hetzner CPX32, Germany/Finland | Shared AMD, 4 vCPU, 8 GB RAM, 160 GB NVMe, 20 TB EU traffic | **€35.49/month ex VAT and IPv4** | More expensive fallback; live stock not confirmed. |
| DigitalOcean Basic, London candidate | 4 vCPU, 8 GiB RAM, 160 GiB SSD, 5,000 GiB transfer | **US$48/month** before applicable taxes | London is a listed region; exact size availability needs checkout/API confirmation. |
| AWS Lightsail Linux, London | 2 vCPU, 8 GB RAM, 160 GB SSD, 5 TB transfer, public IPv4 | **US$44/month** before applicable taxes | Fewer CPUs than the other 8 GB options; inference speed must be measured. |

Sources: [OVH UK VPS specifications](https://www.ovhcloud.com/en-gb/vps/vps-uk/), [OVH VPS-2 configurator with upfront12 selection](https://www.ovhcloud.com/en-gb/vps/configurator/?brick=VPS%2BModel%2B2&planCode=vps-2027-model2&pricing=upfront12&storage=75__SSD__NVMe&vcore=4__vCore).
OVH's current page labels this range “2027”; this is the observed product label, not a claim about a future launch date.
Hetzner prices follow the [15 June 2026 adjustment, updated 8 July](https://docs.hetzner.com/general/infrastructure-and-availability/price-adjustment/); older low-price comparisons are stale.
Hetzner specifications: [cost-optimised plans](https://www.hetzner.com/cloud/cost-optimized/), [regular-performance plans](https://www.hetzner.com/cloud/regular-performance/). Capacity warning: [cloud landing page](https://www.hetzner.com/cloud/).
DigitalOcean: [Droplet pricing/specifications](https://www.digitalocean.com/products/droplets), [London LON1 region, verified 1 October 2026](https://docs.digitalocean.com/platform/regional-availability/).
AWS: [Lightsail pricing](https://aws.amazon.com/lightsail/pricing/), [London eu-west-2 availability](https://docs.aws.amazon.com/lightsail/latest/userguide/understanding-regions-and-availability-zones-in-amazon-lightsail.html).

## 3. Database choices

**Self-hosted PostgreSQL:** no additional managed-database subscription, but consumes the same RAM/disk and requires patching, monitoring, encrypted backups and restore drills.
A VM failure can then stop web access, scheduling, AI and database together. Container separation is not high availability.
Use migrations, bounded connection pools and indexed due-job queries; preserve a later move to managed PostgreSQL.

**Supabase Pro:** **US$25/month** includes compute credit for one Micro project, 1 GB shared database RAM, 8 GB database disk, 100 GB file storage, and 250 GB egress plus 250 GB cached egress.
Database overage is US$0.125/GB, file storage US$0.0213/GB, ordinary egress US$0.09/GB and cached egress US$0.03/GB. Extra projects add cost. [Pricing](https://supabase.com/pricing)
Select a **specific London eu-west-2** region; a general Europe selection does not establish a London deployment. [Regions](https://supabase.com/docs/guides/platform/regions)
Pro includes seven days of daily database backups. Storage objects require separate backup; database restore recovers their metadata, not deleted media files. [Backup scope](https://supabase.com/docs/guides/platform/backups)
Free has small quotas, inactivity pausing and no automated database backups; it can support a prototype, but should not be the dependable pilot default. [Free plan limits](https://supabase.com/pricing)
Keep development local initially instead of paying for a second hosted project.

**AWS Lightsail managed PostgreSQL:** the encrypted entry plan is **US$30/month**, with 2 GB RAM, 80 GB disk and 100 GB transfer; encrypted HA starts at US$60.
The US$15 entry plan explicitly has no data encryption, so it is excluded from the proposed production default. [Managed-database pricing](https://aws.amazon.com/lightsail/pricing/)

## 4. Backup, media and bandwidth costs

OVH VPS cards advertise a daily backup of the previous 24 hours; verify actual retention at checkout rather than assuming seven days.
Its general backup description keeps copies in the same datacentre and excludes additional disks: this does not cover a datacentre disaster. [VPS backup description](https://www.ovhcloud.com/en-gb/vps/)
Separate encrypted logical database backups and an off-site media copy are still required.

Hetzner server backups cost **20% of the server price**, with seven slots; primary IPv4 adds **€0.50/month**, IPv6 is free. [Billing](https://docs.hetzner.com/cloud/billing/faq/), [IP pricing](https://docs.hetzner.com/cloud/servers/primary-ips/overview/)
Attached volumes are not covered by server backups. [Backup scope, updated 3 September 2026](https://docs.hetzner.com/cloud/servers/backups-snapshots/overview/)
Thus CX33 plus IPv4 and server backups is approximately **€10.69/month ex VAT**, if available; CPX32 is approximately **€43.09**. Neither includes an independent off-site copy.

DigitalOcean's basic backup plans add **20% for weekly or 30% for daily**; an US$48 server with daily backup is **US$62.40/month** before taxes and other services. [Backup pricing, verified 9 March 2026](https://docs.digitalocean.com/products/backups/details/pricing/)

OVH Standard S3-compatible storage lists **£0.0060809/GiB/month ex VAT for Single Zone** or **£0.012118 for Multi Zone**, with requests/retrieval and listed traffic included.
At 50 GiB retained, these are approximately **£0.30 / £0.61 monthly**, before taxes; availability in the required region must be confirmed. [Object-storage tariff](https://www.ovhcloud.com/en-gb/public-cloud/prices/)
Count **all retained versions, backups and media** when estimating storage; a 5 GB live database can require substantially more than 5 GB backup storage.
Prefer Standard for small frequently accessed backups; archive minimum-retention and retrieval rules can defeat apparent savings.
A separate region reduces datacentre risk; the same provider/account still leaves shared failure and access risks.

Lightsail object storage offers **US$3/month for 100 GB storage and 250 GB transfer**; instance/disk snapshots cost **US$0.05 per chargeable GB/month**.
Additional block storage costs US$0.10 per allocated GB/month. Inbound and outbound traffic count toward bundle allowances; overage still needs monitoring. [AWS storage and transfer pricing](https://aws.amazon.com/lightsail/pricing/)
Snapshots are charged according to stored snapshot usage; do not multiply the full disk size by every daily snapshot without checking incremental billing.

## 5. Budget scenarios, not spending commitments

| Scenario | Working monthly expression | What it buys / excludes |
|---|---|---|
| Cheapest UK pilot, conditional | Confirmed OVH contract quote + off-site retained GiB × chosen storage rate | VM, self-hosted DB, bounded CPU inference. Operational work is substantial; advertised server rate is conditional. |
| Lean UK with managed data | Confirmed OVH quote **+ US$25** Supabase Pro + independent backup storage | More inference headroom and fewer database maintenance duties; no guessed currency conversion. |
| EU cost candidate | CX33 **€10.69 ex VAT** including IPv4/server backup + off-site storage | Conditional on inventory and tested CPU throughput; self-hosted DB. |
| London alternative | DigitalOcean **US$62.40 + US$25 = US$87.40**, plus independent media backup | Daily VM backup and managed Supabase database; overages/taxes excluded. |
| AWS London upgrade | Lightsail **US$44 + US$30 + US$3 = US$77**, plus snapshot usage | VM, encrypted managed DB and 100 GB media bucket; not HA, taxes/overages/off-site copy excluded. |

For example, 100 GB of separately chargeable AWS snapshot storage would add US$5; this is illustrative, not a measured Cadence backup footprint.
No total includes an unquoted domain registration, app-distribution charge, monitoring add-on or future GPU service.
The allowed monthly ceiling and willingness to prepay are still pending user answers.

## 6. Making inference coexist with scheduling

Do not call hosted AI “free”: open weights can remove licence/per-token charges, while the VPS still supplies paid CPU, memory, disk and bandwidth.
The separate [model comparison](2026-10-04-small-model-comparison.md) identifies suitable candidates and licence conditions.
Gemma “effective” parameter names do not establish footprint: Google estimates E2B Q4 loading at 2.9 GB and E4B at 4.5 GB before context/software overhead. [Memory documentation](https://ai.google.dev/gemma/docs/core)
Its optimized mobile format is not automatically the same artifact or footprint on a Linux VPS.

Proposed starting resource allowances below are engineering targets, **not benchmark measurements**:

| Workload | Initial allowance on an 8 GiB VM |
|---|---|
| OS, proxy and ordinary system overhead | Approximately 0.5–0.8 GiB |
| Web/API and publishing worker | Approximately 0.8–1.2 GiB combined, measured under pilot load |
| Self-hosted PostgreSQL, if chosen | Approximately 0.5–1 GiB, with tuned connections/cache |
| AI process, including weights/cache/buffers | Initially cap near 3.5–4 GiB; accept only artifacts that fit |
| Remaining margin | Keep at least approximately 1 GiB under normal combined load |

Measure complete-system peaks instead of merely adding model file size; upper ends of these allowances cannot all be consumed simultaneously.
Begin with text-only inference, one resident model, one generation, 2K–4K context and bounded output.
Reserve publishing capacity and enforce an AI memory limit; AI overload should produce an unavailable/queued draft state rather than kill the publishing worker.
Build release artifacts in CI rather than compiling Next.js and quantizing models on the production VM.
Avoid server-side video rendering/transcoding during the initial pilot; upload prepared assets and validate metadata.
Keep the inference listener private and expose authenticated, rate-limited Cadence draft endpoints; never expose raw model ports publicly.
Persist approved drafts/media before scheduling. The publishing worker must not call the model to complete a due publication.
Shared vCPU performance varies; verify cold start, normal draft latency, sustained inference and simultaneous scheduling on the actual instance.

## 7. Single-VM reliability and upgrade gate

Use automatic process restart, health checks, disk/memory alarms, bounded logs and unattended security updates with a documented maintenance window.
Store job claims durably with leases; re-check cancelled/approved state before publishing and recover expired claims after restart.
Reconcile ambiguous provider responses before retrying create calls; a restored database may lag a post already published externally.
Maintain encrypted off-site backups, record recovery keys separately, and test a full restore before real scheduled posting.
Proposed pilot targets: **RPO 24 hours, RTO 4 hours**, subject to a timed drill and user acceptance; these are not provider guarantees.
Database snapshots alone do not prove application-consistent recovery. Include OAuth-secret encryption keys, media and configuration in the recovery procedure.
Upgrade when AI interferes with due jobs, sustained memory pressure occurs, recovery targets fail, or more users require parallel drafts.
First separate inference or database from web/worker; add a second publishing worker only with tested lease/duplicate protection.
AWS London is a viable later path; RDS/SQS/S3 or multi-instance designs require a fresh costed decision rather than automatic adoption.
Before external users, repeat restore/security tests and review platform approval, data residency, spend controls and support obligations.

## 8. Remaining decisions and verification limits

Confirm monthly budget, prepaid commitment tolerance, strict UK versus UK/EU residency, and acceptable AI draft wait.
Confirm whether shared hosted inference is the initial topology or existing FSS hardware is intended to supply AI.
Obtain final region-specific quotes and live stock; public price cards are not an order confirmation.
No source here proves acceptable inference speed, total memory use or Cadence availability on any quoted instance.
Supabase's changelog fetch failed during this pass; pricing, region and backup conclusions use its accessible current official pages.
Final social platform selection and native iPhone distribution method remain outside this hosting decision and pending clarification.
