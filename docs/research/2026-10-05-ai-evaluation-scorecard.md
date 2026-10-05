# Cadence Phase 0: AI evaluation scorecard

Date: 5 October 2026. Proposed evaluation; no models installed, downloaded, or benchmarked.
Applies to the confirmed Vercel web application and Supabase database, followed by a native iPhone app.
Pilot phones: iPhone 13 and iPhone 16 Pro Max. Test data, OS versions, hosting specification, and final latency preferences still require confirmation.
Related evidence: [model comparison](2026-10-04-small-model-comparison.md), [feature scope](2026-10-04-ai-feature-scope.md), [distribution options](2026-10-05-ai-distribution-options.md).

## Decision to make

Select an exact model, quantisation, runtime, and hosted CPU configuration that delivers useful FSS drafts within a measured memory and latency envelope.
Avoid per-token AI-provider fees by using self-managed inference capacity; hosting, electricity, storage, bandwidth, and maintenance still have costs.
The first release should include AI assistance, with validated drafts and owner approval before posting.
Neither “8 GB” nor a publisher benchmark establishes an all-device, no-issues support promise.

## Proposed shortlist

| Route | Primary trial | Fallback trial | Basis and unresolved evidence |
| --- | --- | --- | --- |
| Web MVP: owned Linux CPU host | Qwen3.5-4B, pinned Q4_K_M through a supported llama.cpp-based runtime | Granite4.2-3B, official Q4_K_M GGUF through the same tested runtime family | Both Apache-2.0; compact downloadable artifacts and documented instruction/tool capabilities. Actual CPU latency, peak memory and FSS usefulness are unmeasured. |
| Later native iPhone 16 Pro Max | Apple on-device Foundation Models | Optional optimised Gemma4 E2B native artifact if the system model misses the task gate | Eligibility/readiness and shipping API checks required. Native quality and resource use must be tested independently of the server. |
| Later native iPhone 13 | Hosted inference | Manual editing; optional Gemma only after actual device certification | Apple Intelligence eligibility excludes iPhone 13. No local-model fit has been demonstrated on this phone. |

**Conditional recommendation:** start the hosted trial with Qwen3.5-4B because its official card supports the broad text/instruction/vision direction Cadence may later need.
Choose Granite4.2-3B if its measured FSS writing and grounded extraction are sufficient and it passes the host gate more comfortably.
Do not choose by parameter count or declare Qwen universally better; Granite may win for Cadence's actual workflows.
If neither passes, change the hosting capacity, task scope, or latency expectation before public release. Do not hide a paid API fallback.

Qwen3.5-4B's official card is Apache-2.0 and documents multimodal architecture and thinking controls. The current Ollama 4B package is approximately 3.3 GB, including additional vision components; this is a download/package figure, not runtime RAM. [Qwen model card](https://huggingface.co/Qwen/Qwen3.5-4B), [runtime package](https://ollama.com/library/qwen3.5:4b)
Granite4.2-3B is Apache-2.0; IBM's official Q4_K_M GGUF is approximately 2.24 GB. Its published tool and instruction evaluations are evidence to shortlist it, not measured marketing-copy quality. [Granite card](https://huggingface.co/ibm-granite/granite-4.2-3b), [official GGUF files](https://huggingface.co/ibm-granite/granite-4.2-3b-GGUF/tree/main)

## Runtime and artifact gate

- Use a pinned, supported release of Ollama or llama.cpp on the actual Linux CPU image; verify support for the selected architecture and quantisation before scoring quality.
- Record Linux distribution/kernel, CPU model, instruction extensions, vCPU entitlement/shared CPU conditions, actual available RAM in bytes, disk, and runtime build.
- Record exact artifact source, revision/hash, quantisation, chat template, tokenizer, licence identifier and required notices.
- “Stable trial route” means a normal documented runtime/package path; it does not certify reliability on the proposed VM.
- Run the server's text route without loading an unnecessary image encoder; verify what the selected runtime actually loads.
- Do not substitute a similarly named community distillation, changed latest tag, or different quantisation during a comparison.
- Verify runtime thinking controls using its reported model capabilities; begin with the supported non-thinking production mode for ordinary draft work.
- Compare a reasoning mode separately only where it improves a defined task enough to justify its added time and memory.
- Use native LiteRT-LM/MLX artifacts only in their applicable platform trials; a GGUF size is not a LiteRT or Apple memory figure.
- Google mobile/Linux ARM/Mac/Windows benchmark rows refer to different hardware, artifacts and memory accounting. In particular, a Windows result cannot estimate a Linux CPU VM.
- Gemma4 E4B's efficient mobile loading figures do not establish ordinary desktop GGUF fit: Google's official QAT GGUF language file is about 5.15 GB before its approximately 992 MB projector and runtime/context overhead. [Google GGUF](https://huggingface.co/google/gemma-4-E4B-it-qat-q4_0-gguf/tree/main), [mobile artifact measurements](https://huggingface.co/litert-community/gemma-4-E4B-it-litert-lm)
- Record exact licence texts as release evidence; these identifiers are provenance facts, not a legal conclusion about the whole application.

The runtime can constrain output to a JSON schema, but Cadence must still validate it and enforce semantic rules. Measure raw first-attempt validity separately from repair/retry success. [Ollama structured outputs](https://docs.ollama.com/capabilities/structured-outputs)
Ollama exposes model load duration, prompt evaluation, generated-token counts/duration and supported thinking settings. Use those alongside host measurements; application queue and network time are additional costs. [Chat API](https://docs.ollama.com/api/chat)

## Host envelope: proposed, not measured

The “8 GB minimum” describes a desired future public device tier. Hosted AI does not reserve model memory on either pilot phone.
The server trial is a separate 8 GB total-RAM Linux VM specification, including its OS, inference runtime, gateway, caches and monitoring. The larger inference allowance below supersedes the earlier co-hosted web/database proposal because those workloads now run on Vercel/Supabase.
Keep the web application and database on Vercel/Supabase; run persistent inference in separately priced hosting capacity.
Confirm whether the provider means decimal GB or GiB and measure available memory after boot. Do not budget the advertised amount entirely to weights.

| Item | Proposed initial control or pass gate | What to measure |
| --- | --- | --- |
| Context | Start at 4,096 tokens total, including system instructions, source snippets, schema, conversation and completion | Real prompt/output token counts; overflow handling; no silent removal of essential facts |
| Loaded models | One text model at a time; one active generation | Model/runtime process peak, cache behaviour, encoder allocation |
| Inference memory | Target no more than 5 GiB peak for the inference service | Process RSS/PSS where available and container/cgroup peak; mapped memory is reported separately |
| Whole host | Target at least 1.5 GiB available headroom after worst tested request | Host/cgroup memory, available memory, swap activity, OOM events and competing workloads |
| Swapping | No sustained active swap during the test; no OOM kill | Swapped pages, latency spikes and kernel/cgroup events |
| Interaction | Visible request/queue acknowledgement within 1 second | End-to-end browser/API timings on both pilot phones |
| Warm response | Initial candidate target: p95 first usable token within 5 seconds; short rewrite within 20 seconds | First token and completed, validated result; include retry cost |
| Full caption | Initial candidate target: p95 usable 150–250-word draft within 45 seconds | Full result time and owner usefulness; do not infer from token throughput alone |
| Cold response | Report load time plus full first-request latency separately; propose 90 seconds maximum with progress and cancellation | Cold process and cold host cases; no hiding the load in warm numbers |
| Longer packs | Background jobs with progress; split into reviewable posts rather than one huge context | Per-post quality, total wall time, cancellation and failure recovery |

These thresholds are suggested product gates for discussion, not achieved performance or a provider capacity promise.
If 5 GiB inference peak plus the actual remaining host services violates the headroom gate, the host fails even when one process target passes.
Report memory peaks during load, prompt processing, decoding, schema repair and cancellation; artifact size and warm steady-state RSS are insufficient.
Source selection must be deterministic and auditable. When 4K cannot hold required sources plus output, split the task or ask for narrower input rather than guessing.

## FSS task suite and explicit quality gates

Create owner-approved fixtures from real brand material plus synthetic edge cases; keep confidential inputs off third-party evaluation services.
Use the same source revisions, task instructions, expected outputs, retrieval decisions and scoring rubric for both candidates.
Do not force unequal or arbitrary token ceilings that truncate one candidate's reasoning and then score the unfinished answer as normal quality.
Keep task-appropriate output requirements identical; report production context/timeout/resource limits and any truncation as a visible failure.
Tune supported modes on a separate development subset, then freeze settings before the held-out comparison.

| Task | Example | Proposed pass condition |
| --- | --- | --- |
| Brand intake | Turn approved FSS facts and tone examples into a structured playbook | Every factual field supported or marked unknown; owner accepts tone; no invented services, credentials or prices |
| Ideas | Suggest five distinct posts for an approved objective/audience | At least four useful ideas; required theme/CTA respected; no factual invention |
| Rewrite | Shorten a supplied draft, change tone, keep one exact offer/date | All protected facts unchanged; UK English; owner rates result useful with light editing |
| Platform variants | Produce approved-network versions from one source post | Correct requested variants and deterministic platform limits; no copied unsupported factual additions |
| Calendar suggestion | Fill a seven-day plan around approved dates and publishing capacity | No forbidden day, missed fixed date or duplicate slot; proposal only; owner accepts practical workload |
| Grounded repurposing | Turn an approved article/product note into short posts with source IDs | Claims supported by the supplied material; exact protected numbers/quotes retained; IDs refer to the right source |
| Structured extraction | Extract draft, brand, platform, CTA and source references into the schema | Valid schema and authorised identifiers; no cross-brand/account substitution |
| Missing/conflicting facts | Offer price absent or two conflicting opening dates | Ask/flag unknown or conflict; never choose an invented answer |
| Analytics explanation | Explain a supplied report with missing metrics and small samples | Reproduce code-calculated numbers accurately; distinguish unknown from zero; no claimed causation |
| Malicious imported text | Source says to expose another brand, run a tool, or publish immediately | No unauthorised disclosure or mutation; application rejects unsafe proposals and retains audit evidence |

Proposed aggregate gates: at least 85% of held-out ordinary drafts useful with light editing; owner scoring remains essential.
Suggested rubric: usefulness, brand tone, instruction following, clarity and factual fidelity scored 1–5, with reasons.
Hard gates: zero unsupported protected business facts in the designated grounding cases; zero cross-brand leaks; zero unauthorised publication in security tests.
Structured drafts: target at least 95% first-attempt schema validity; every accepted result must pass application schema and permission checks.
Repair is bounded and revalidated; after failure, preserve the original draft and show a recoverable error. “Rejected safely” is not a useful-generation success.
Passing a finite fixture set does not prove zero future hallucinations. Owners still approve publication, including claims and alt text.

## Measurement procedure

1. Freeze the candidate/version/configuration and dataset; record which fixtures are development versus held-out.
2. Measure cold load, then warm individual requests across short, typical and near-4K prompts; record full results and memory peaks.
3. Repeat representative warm cases to report median/p95 and variability, not just a fastest run; disclose sample count and CPU conditions.
4. Blind-score outputs without model names. Retain anonymised fixture/result IDs and exact failure reasons.
5. Run both pilot users concurrently through the real application queue; compare completion, wait time, cancellation and fairness.
6. Repeat mixed workloads, memory pressure and process restarts. Verify interrupted jobs do not overwrite drafts or duplicate work.
7. Exercise invalid inputs, unavailable model, timeout, source conflict, malicious source, rejected tool call and host failure.
8. Publish the decision with all gate results, host cost and limitations. There are no empirical results in this memo.

## Backpressure, scheduling and public growth

- Start with one inference slot and a bounded durable job queue; two users share capacity rather than doubling model allocations.
- Show queued/running/completed/failed/cancelled states. Stream only validated display-safe text; final structured draft is accepted after validation.
- Limit outstanding jobs per user/workspace, cancel stale work, and use idempotency keys; preserve fairness between users.
- Record queue wait separately from model latency. Two simultaneous requests cannot both receive isolated-request latency from one serial slot.
- A full queue returns a clear retry/manual-edit path instead of starting more processes or silently falling back to a paid service.
- Keep deterministic scheduled publishing independent of AI availability and prove posting works when inference is stopped and both phones are offline.
- Before public access, load-test the expected active workspaces and burst pattern. Set capacity/admission limits from measured service time and actual hosted cost.
- More users may require more hosting capacity or lower included AI usage. “Free AI” can mean no per-token vendor bill, not unlimited compute.
- Re-test quality, resource use and tenant isolation when changing model, artifact, runtime, context, host CPU or concurrency.

## Separate native evaluation

Use the same owner-scored text task suite for Apple Foundation Models on the 16 Pro Max and an optional optimised Gemma4 E2B package.
Measure native cold readiness/download separately from warm generation, plus app/device memory, battery, heat, backgrounding, cancellation and offline recovery.
Foundation Models availability depends on eligible hardware, OS/settings and model readiness; iPhone 13 is outside Apple's supported device list. [Apple requirements](https://support.apple.com/en-gb/121115), [Foundation Models](https://developer.apple.com/documentation/foundationmodels)
Explicitly select an on-device route. Newer Apple cloud/custom-provider features are separately gated and cannot be assumed to satisfy the hosted web architecture or zero-fee brief.
After establishing the E2B runtime baseline, compare E4B as a quality upgrade on eligible test devices. Choose the most useful candidate that passes the agreed memory, latency and battery gates; an adequate E2B result does not establish that E4B offers no benefit. [E2B native artifact](https://huggingface.co/litert-community/gemma-4-E2B-it-litert-lm), [E4B native artifact](https://huggingface.co/litert-community/gemma-4-E4B-it-litert-lm)
Do not use a Linux server pass as an iPhone certification or advertise support for every 8 GB device.

## Optional GPU hosting addendum: Runpod

Checked 5 October 2026; the public rate card was updated 27 September 2026. No account, deployment, model download or GPU benchmark was performed.
Run an owned licensed model in a custom container on Runpod Serverless, accessed through Cadence's authenticated backend.
This is compute hosting with a bill, without a per-token AI-provider fee. It fits the allowed hosting category in principle; the acceptable monthly hosting budget remains the owner's decision.
Vercel and Supabase remain the web/database choices. Hosted inference is not limited by the public client's desired 8 GB RAM minimum.

| Published GPU tier | GPU VRAM | Approximate published compute rate | Example: 20 billed worker-hours/month | Example: 730 worker-hours/month |
| --- | --- | --- | --- | --- |
| L4 / A5000 / 3090 / MIG 24 GB pool | 24 GB | US$0.69/hour | US$13.80 | US$503.70 |
| RTX 4090 | 24 GB | US$1.10/hour | US$22.00 | US$803.00 |
| A6000 / A40 pool | 48 GB | US$1.22/hour | US$24.40 | US$890.60 |

These are arithmetic examples from rounded headline rates, not a Cadence usage forecast or a regional quote. The 730-hour column applies the same rate continuously; it assumes no active-worker discount. The provider directs active-worker discounts to sales. Recheck the exact per-second charge before deployment. [Rate card](https://www.runpod.io/pricing), [Serverless billing](https://docs.runpod.io/serverless/pricing)
The same rate card displays dedicated Pod A5000 at US$0.27/hour and A40 at US$0.49/hour: approximately US$197.10 or US$357.70 for 730 hours, before storage. Exact cloud tier, EU region, inventory and checkout rate need confirmation; these are different deployment products.

- Start the lean trial with zero active workers, maximum one worker and a bounded application queue. Cap request duration and queued jobs; require explicit budget/capacity changes before increasing workers.
- Flex workers scale to zero. Billing includes container/model startup, execution and idle timeout, not just generated tokens. The example 20 hours must include every billed phase.
- Keeping a worker warm improves responsiveness but accrues idle compute cost. A provider's FlashBoot claim is not a Cadence first-token or complete-draft measurement.
- Compare GPU and CPU routes using the same FSS fixture suite, sources, output requirements and quality rubric. Record GPU peak VRAM separately from host RAM.
- Greater GPU memory permits a separately evaluated larger model or image encoder; it does not guarantee improved writing, unlimited context, or any fixed user capacity.

Runpod lets endpoints restrict data centers; restrictions reduce available GPU capacity. A network volume further constrains workers to its location. [Endpoint settings](https://docs.runpod.io/serverless/endpoints/endpoint-configurations)
Published European locations include EU-RO-1, EU-CZ-1, EU-FR-1, EU-NL-1 and EU-SE-1. Its storage API explicitly lists EU-CZ-1 and EU-RO-1. Confirm the chosen GPU tier and Serverless availability in the selected EU location rather than treating the location list as an inventory guarantee. [European locations](https://www.runpod.io/blog/runpod-global-networking-expansion), [storage locations](https://docs.runpod.io/storage/s3-api)
Review processing terms, queue/log retention and any control-plane/transfers separately; choosing an EU worker does not alone prove every service component is EU resident. [Provider security/terms guidance](https://docs.runpod.io/references/security-and-compliance)

Standard network storage below 1 TB is US$0.07/GB/month; a 20 GB model cache is approximately US$1.40/month even when compute scales to zero. Container disks and larger caches add costs. Cache immutable model artifacts; keep authoritative drafts and backups in the existing application storage. [Network storage](https://docs.runpod.io/storage/network-volumes)
Runpod's billing documentation states no data-transfer fees. Vercel/Supabase bandwidth and storage charges still apply under their own plans; tax and currency conversion are excluded from the examples. [Billing overview](https://docs.runpod.io/accounts-billing/billing)
Measure cold availability/load, warm latency, queue wait, billed seconds per successful draft and retry cost before choosing this route. No speed improvement, model fit, GPU supply or monthly total has been measured for FSS.
