# Cadence AI distribution options for the confirmed phones

Research date: 5 October 2026. Supplements the 4 October deployment and iPhone memos. No installations, model downloads, or live device benchmarks.

## Confirmed decisions and remaining checks

- Pilot phones: iPhone 13 and iPhone 16 Pro Max.
- Product order: hosted web application on Vercel with Supabase first; native iPhone app later. The owner plans to buy Apple Developer membership for that phase.
- The desired 8 GB minimum refers to future public users’ total device RAM. It is not a confirmed specification or memory allowance for either pilot phone.
- No paid AI API subscriptions/token bills. An owned model server incurs hosting, storage, bandwidth, and operational costs, which need to fit the hosting budget.
- Still check installed OS versions, free storage, Apple Intelligence readiness on the 16 Pro Max, task quality, and acceptable generation latency.

## Recommendation

Use hosted inference as the web MVP baseline for both phones. Host a licensed open-weight text model in a separate model service and call it through Cadence’s authenticated backend. This avoids requiring the iPhone 13 to load a multi-gigabyte model and gives both users the same online AI capability.

Treat the inference server as a separately sized and priced hosting component. The Vercel/Supabase choice does not establish free or included persistent model capacity. Select the model and CPU/GPU host together after a two-user latency/concurrency test; do not promise satisfactory latency from an unspecified 8 GB server.

For the later native app, test Apple Foundation Models on the iPhone 16 Pro Max first. Keep hosted inference for the iPhone 13 and as an explicitly selected online option. Add downloadable Gemma only if offline use, model consistency, or measured task quality justifies its storage and battery burden.

## Conditional options matrix

| Option | Pilot compatibility | Offline generation | Costs and trade-offs | Decision |
| --- | --- | --- | --- | --- |
| Owned hosted model service | Both phones through the website/native client; inference does not consume client model RAM | No | Hosting and operations; shared capacity needs limits and a queue; prompts leave the device | Web MVP baseline, subject to a priced host and task/latency gate |
| Native Apple Foundation Models | iPhone 16 Pro Max is Apple Intelligence eligible; iPhone 13 is outside Apple’s supported list | Yes, when the system model is ready and the route is on-device | No developer inference charge; native API, OS/settings/readiness gates, model quality must be tested | Preferred first local route for the later eligible-phone app |
| Optional post-install Gemma E2B package | Exact model/runtime/device combinations must pass tests; neither phone is certified here | Yes after download, for supported local text tasks | Multi-gigabyte storage/download, runtime maintenance, memory, heat and battery use | Local alternative to evaluate after the web pilot |
| Optional E4B package | Larger candidate to compare only on certified hardware; 8 GB total RAM is insufficient evidence | Conditional on passing the device gate | Larger footprint; actual task benefit must justify cost | Upgrade tier after E2B comparison, not universal default |
| Gemma bundled inside every app binary | Does not itself establish either phone’s memory compatibility | Model available without a separate Cadence download | Enlarges installation and app updates for every user; duplicates storage even when hosted/system AI suffices | Avoid as the default distribution approach |
| PWA/browser WebGPU model | Browser capability, exact web artifact, and actual device must all work together | Conditional after caching; eviction/lifecycle still matter | Early-preview runtime; significant download and unverified Safari model behaviour | Experimental opt-in; not the MVP AI baseline |

Apple’s supported-device list includes iPhone 16 models and excludes iPhone 13. No claim about iPhone 13 RAM is needed for that eligibility conclusion. Foundation Models’ established framework baseline is iOS 26 on Apple Intelligence-compatible hardware with Apple Intelligence enabled; runtime availability must still be checked. [Apple eligibility](https://support.apple.com/en-gb/121115), [Foundation Models release and requirements](https://www.apple.com/newsroom/2025/09/apples-foundation-models-framework-unlocks-new-intelligent-app-experiences/)

The system framework is a native Swift facility; the hosted website cannot assume access to it. Check available/not-eligible/not-enabled/not-ready states and keep manual editing usable. Do not silently reroute a request selected as local/private to a server. [Framework](https://developer.apple.com/documentation/foundationmodels), [unavailability reasons](https://developer.apple.com/documentation/foundationmodels/systemlanguagemodel/availability-swift.enum/unavailablereason)

Safari 26 supports WebGPU on iOS. LiteRT-LM’s browser API is nevertheless an early preview with text input/output and specifically supported web model artifacts; those facts do not certify the iPhone 13 or 16 Pro Max for a given package. [Safari release](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/), [LiteRT web API](https://developers.google.com/edge/litert-lm/js)

## Bundle the engine; make heavyweight model data optional

For a downloadable native Gemma tier, bundle the tested native inference runtime and integration with the app. Download the selected model as a versioned data resource after installation, with clear size, Wi-Fi choice, progress, cancellation, integrity verification, and enough space for atomic replacement.

The published mobile LiteRT artifacts are approximately 2.58 GB for E2B and 3.66 GB for E4B. These are artifact/disk figures, not peak RAM for Cadence or guarantees for the phones. Desktop GGUF, native LiteRT, MLX, and browser artifacts differ. [E2B artifact card](https://huggingface.co/litert-community/gemma-4-E2B-it-litert-lm), [E4B artifact card](https://huggingface.co/litert-community/gemma-4-E4B-it-litert-lm)

Start with text-only local features such as captions, rewrites, tone changes, and short summaries. Offline generation does not make OAuth, asset upload, draft sync, social publishing, or fact research offline. A native model’s image/audio features do not automatically establish browser multimodal support. [Native LiteRT API](https://developers.google.com/edge/litert-lm/swift), [browser capabilities](https://developers.google.com/edge/litert-lm/js)

Check redistribution rights and required notices for the exact model/conversion and runtime before shipping. Pin provenance and versions, separate the model cache from user drafts, and let users remove the package without losing drafts. Runtime licensing alone does not grant model rights.

Apple guideline 2.5.2 restricts downloading/executing code that introduces or changes app functionality. Model weights as data consumed by a bundled engine are a proposed architecture, not a blanket exception or guaranteed approval. Never download a replacement executable runtime under the label of a model update. Explain the resource mechanism in review notes. [App Review 2.5.2](https://developer.apple.com/app-store/review/guidelines/)

Native utility must exist on the iPhone 13 too: capture/share assets, accessible editing, offline drafts, reliable sync, and usable calendar/approval workflows. Apple’s minimum-functionality guidance expects value beyond a repackaged website; required initial resource downloads need size disclosure and consent. [App Review 4.2](https://developer.apple.com/app-store/review/guidelines/)

### Optional Apple-hosted model delivery

For the later native app, prefer a spike using **Apple-Hosted Background Assets** before pricing Supabase/Vercel delivery of multi-gigabyte model files. Apple explicitly lists machine-learning models among supported asset types and supports asset updates separately from the app build. Apple hosting is available to TestFlight/App Store apps using Managed Background Assets on iOS 26+. [Supported assets](https://developer.apple.com/documentation/backgroundassets/downloading-apple-hosted-asset-packs), [OS and distribution requirements](https://developer.apple.com/help/app-store-connect/manage-asset-packs/overview-of-apple-hosted-asset-packs)

Apple states that 200 GB of hosting capacity is included in Developer Program membership. The current limits are 200 GB total asset-pack size usage and 200 packs per app record, shared across its platforms; size accounting uses the maximum eligible version for each pack. This is a hosting/storage allowance, not 200 GB of monthly download traffic. The reviewed primary pages do not specify a per-GB egress charge or an unlimited bandwidth guarantee; confirm current programme terms before promising either. [Included hosting](https://developer.apple.com/videos/play/wwdc2025/325/), [Current pack limits and accounting](https://developer.apple.com/help/app-store-connect/reference/app-uploads/apple-hosted-asset-pack-size-limits/)

Apple currently lists a 4 GB maximum uncompressed iOS/iPadOS app size, with a separate 500 MB limit for executable `__TEXT` sections. Background Assets are managed separately from the build. An E4B artifact plus app/runtime/resources therefore needs measured packaging rather than an assumption that bundling will fit. Optional Apple-hosted delivery keeps the initial binary smaller and avoids sending those native model downloads through Cadence’s Vercel/Supabase infrastructure. It does not host Cadence’s inference service or provide a general CDN for the website/PWA. [Build limits](https://developer.apple.com/help/app-store-connect/reference/app-uploads/maximum-build-file-sizes/)

Use an **on-demand** model pack so users request the local tier while the core app remains useful. Apple also offers essential and prefetch policies; essential packs contribute to initial installation and can delay first launch. Pack versions require App Review for distribution. A newly live pack can reach older installed app builds, so maintain runtime/model compatibility across those builds or use a separate pack identifier for an incompatible model generation. [Download policies](https://developer.apple.com/documentation/backgroundassets/creating-managed-asset-packs), [Review and version delivery](https://developer.apple.com/videos/play/wwdc2025/325/)

Both pilot phones support iOS 26, but their installed versions remain unknown. Apple-hosted pack eligibility on an updated iPhone 13 does **not** make it Apple Intelligence eligible or establish that Gemma fits its memory. The native spike must check provisioning/App Group/downloader configuration, chosen-runtime access to managed model files, low storage, interrupted downloads, pack updates, removal/re-download, and App Review acceptance. No runtime/model access or inference benchmark was performed here. [iOS 26 compatibility](https://support.apple.com/en-ie/123705), [Managed download integration](https://developer.apple.com/documentation/backgroundassets/downloading-apple-hosted-asset-packs)

## Graceful fallback and shared product contract

1. Web MVP: label inference as hosted, retain the original prompt/draft on failure, bound and queue requests, and allow manual drafting immediately.
2. Later native app: expose available AI routes. On the iPhone 13, offer hosted AI; local AI remains absent unless a separately tested downloadable route becomes supported.
3. On the 16 Pro Max, check system-model availability. If disabled/not ready, show the specific state, then offer the separately labelled hosted option or manual editor.
4. Optional Gemma: distinguish not downloaded, downloading, ready, incompatible, insufficient storage, and generation error. Package failure must not block ordinary product use.
5. Offline: preserve/edit drafts locally. Show generation only for a ready, supported local route; queue sync and make publishing status explicit until the hosted service accepts it.
6. Publishing: use durable hosted jobs with approved content. Timed publishing must work while both phones are offline and all local models are unavailable.

Use one typed draft/result contract across hosted, system, and downloadable models. Validate structure and platform rules at the application boundary, retain human approval, and never let model tool output publish directly. Quality and latency will differ by route and must be measured rather than described as identical.

## A support promise that can actually be certified

Define two distinct support commitments: ordinary product use in supported browsers/native OS versions, and optional local AI on an explicitly tested device list. Hosted AI removes the need for a client to reserve several gigabytes for weights; consequently the web product need not enforce an arbitrary 8 GB RAM minimum.

For local AI, publish a tested combination: device/CPU/GPU, OS, runtime version, exact model artifact and quantisation, minimum free storage, context/output limits, and supported tasks. Eight GB total RAM is a screening target; OS/app overhead, GPU allocations, cache and intermediate tensors determine usable memory. iOS can terminate an app under memory pressure or process limits. [Jetsam diagnostics](https://developer.apple.com/documentation/xcode/identifying-high-memory-use-with-jetsam-event-reports)

Certification requires cold load, warm first token/full draft latency, peak app/device memory, repeated use, thermal/battery behaviour, cancellation, backgrounding, low storage, corrupt/cache-missing models, and offline recovery. Run the same FSS quality suite on each selected route. No throughput, memory-peak, or “all 8 GB devices without issues” claim has been measured here.

Keep the 4 October evaluation gate: real FSS prompts, grounded business facts, structured-result validation, and publication with both devices offline. Final acceptable latency and supported-device combinations remain open until the hardware tests and user preference are available.

## Build sequence implied by these choices

- Web pilot: hosted editor/calendar/publishing plus authenticated hosted AI; price and test inference capacity for two users.
- Native release: pay Apple membership as planned, support core workflows on both phones, and add the established on-device Foundation Models route on eligible hardware.
- Offline expansion: compare E2B against the system/hosted route; certify exact devices before an optional model download rollout. Test E4B only where its measured benefit warrants its footprint.
- Public launch: expand the certified matrix, set hosted concurrency/usage budgets, monitor failures, and state local-feature compatibility clearly. Newer Apple APIs/PCC remain separately gated by actual shipping runtime, entitlement and terms.
