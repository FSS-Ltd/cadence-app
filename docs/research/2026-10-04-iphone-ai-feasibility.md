# Cadence: iPhone AI feasibility and distribution

Research date: 4 October 2026. Primary sources only. No model downloads, installations, or device benchmarks were performed.

## Decision status

- Confirmed brief: hosted website usable anywhere, downloadable iPhone app, two FSS users first, later public advertising, and no recurring payments beyond database and hosting.
- Pending: both exact iPhone models, installed iOS versions, available storage, Apple Intelligence settings, existing Apple Developer membership, and whether its annual fee is acceptable.
- Hardware selection and final latency target remain pending user clarification. “8 GB RAM” alone does not establish a supported iPhone or a usable memory allowance for Cadence.
- Recommendation: retain the hosted web application as the shared product; evaluate native Apple Foundation Models first on eligible phones, with a downloadable Gemma model as a conditional alternative.
- This is a feasibility recommendation, not a claim that Apple’s model beats Gemma for FSS copywriting. Choose with the same FSS task evaluation and actual-device measurements.

## Web application versus native application

| Choice | What it offers | Limitation to resolve |
| --- | --- | --- |
| Hosted web application plus Home Screen installation | Website available anywhere and an app-like pilot without an Apple distribution fee | Does not provide the native Foundation Models API; browser inference needs its own model, runtime, and device validation |
| Native iPhone application plus hosted API | Native capture, offline drafts, system-model access, and optional downloadable local model | App Store/TestFlight distribution normally requires paid Apple Developer membership |
| Native app with optional Apple cloud inference | A possible more capable native fallback without a developer token bill under specific eligibility | Entitlement, shipping/runtime availability, daily limits, network requirements, and programme terms must be verified |

Safari 26 shipped WebGPU on iOS, and Safari 26 permits websites to be added to the Home Screen as web apps. Consequently, “iPhones cannot run WebGPU” is outdated. This establishes a browser capability, not a measured result for any particular model. [WebKit Safari 26 release](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/)

The Home Screen route is a viable zero-distribution-fee pilot alternative; it does not fulfil an explicit App Store download requirement. Keep that product choice visible rather than silently substituting it for the requested native app.

## Apple distribution cost and App Review

Apple Developer Program membership costs USD 99 per membership year, with local currency where available. TestFlight and App Store distribution are programme benefits. Confirm whether FSS already has membership before adding a new expense. [Enrolment](https://developer.apple.com/programs/enroll/), [programme comparison](https://developer.apple.com/programs/)

A free Personal Team is useful for development on owned devices, but provisioning expires after seven days and limits apply to registered devices and apps. Weekly rebuilding is unsuitable as a normal pilot or public distribution plan. [Developer account comparison](https://developer.apple.com/help/account/basics/about-your-developer-account)

App Review requires meaningful app functionality beyond a repackaged website, efficient power use, and disclosure/consent for significant initial resource downloads. Proposed native value: capture/share assets, persistent offline drafts, local AI, and a usable native editing experience. Approval remains an Apple review outcome. [Guidelines 2.4.2 and 4.2](https://developer.apple.com/app-store/review/guidelines/)

Bundle the inference engine with the app and treat model downloads as versioned resources. Do not design remote delivery of new executable functionality: guideline 2.5.2 restricts downloaded code. This distinction is an implementation proposal, not a guarantee that any model update will pass review. [Guideline 2.5.2](https://developer.apple.com/app-store/review/guidelines/)

## Apple Foundation Models: strongest initial native candidate to test

Apple provides a Swift framework for its on-device system model, with generation, summarisation, streaming, guided structured generation, and app-defined tool calling. Apple describes inference as free and the model as built into the OS, so Cadence does not need to distribute its own multi-gigabyte model for this route. The established framework baseline is iOS 26. [WWDC 2025 framework introduction](https://developer.apple.com/videos/play/wwdc2025/286/), [Apple developer announcement](https://www.apple.com/newsroom/2025/09/apples-foundation-models-framework-unlocks-new-intelligent-app-experiences/)

Availability is conditional: eligible hardware, Apple Intelligence enabled, and model ready. Check availability at runtime and give understandable states for unsupported hardware, disabled Apple Intelligence, and model download/readiness. A compatible phone can temporarily lack a ready model. [Availability reasons](https://developer.apple.com/documentation/foundationmodels/systemlanguagemodel/availability-swift.enum/unavailablereason)

Apple’s September 2026 support page lists iPhone 15 Pro/Pro Max, iPhone 16 models or later, and iPhone Air among supported devices. This list establishes Apple Intelligence eligibility; it does not certify the user’s phone RAM or guarantee access to every newer framework feature. [Apple Intelligence requirements](https://support.apple.com/en-gb/121115)

Apple Intelligence requires device/Siri language compatibility, and language changes can trigger model downloads. UK English is supported. Use the framework’s supported-language/locale checks instead of assuming every user language works. [Device and language requirements](https://support.apple.com/en-gb/121115), [Foundation Models language support](https://developer.apple.com/documentation/foundationmodels/supporting-languages-and-locales-with-foundation-models)

Apple’s listed on-device AI storage requirements are disk capacity, not RAM allocated to Cadence. Its latest page distinguishes up to 8 GB from up to 14 GB storage on certain hardware; neither value is a per-process memory allowance. [Storage requirements](https://support.apple.com/en-gb/121115)

On-device generation can work without network access once the required system model is ready. Cadence still needs connectivity for sync, authentication refresh, social account connection, and publishing. No Cadence-specific model download does not mean Apple Intelligence has no initial system download. [Framework introduction](https://developer.apple.com/videos/play/wwdc2025/286/), [Apple setup requirements](https://support.apple.com/en-gb/121115)

For FSS, first evaluate caption drafts, platform rewrites, tone changes, short content calendars, and extraction into a typed draft structure. Supply compact approved business facts; do not expect a small local model to research current facts or infer offers accurately.

App-defined tools must be permission-scoped application functions. A generation request may propose drafts; it must not directly publish or alter account permissions. Guided generation controls structure, not factual correctness. [Guided generation and tools](https://developer.apple.com/videos/play/wwdc2025/286/)

Safety filters and refusals are normal outcomes. Handle guardrail violations and refusals with preserved input and a usable manual editor; do not blindly retry or disable safeguards. Untrusted imported captions, URLs, and documents remain untrusted data. [Model safety guidance](https://developer.apple.com/documentation/FoundationModels/improving-the-safety-of-generative-model-output)

### Newer Apple capabilities: conditional, not a committed baseline

Apple’s 2026 documentation and WWDC material describe newer on-device models, vision attachments, provider abstractions, and cloud options. One WWDC26 transcript refers to a “2027 release” while discussing iOS 27. Announcement and documentation presence are insufficient to certify shipping availability on the two actual phones. OS/API availability, Xcode SDK, runtime capabilities, and programme terms need a separate build spike. [Framework updates](https://developer.apple.com/documentation/updates/foundationmodels), [WWDC26 framework session](https://developer.apple.com/videos/play/wwdc2026/241/)

Do not hardcode an on-device context limit from a presentation: published examples differ across generations. Query the selected model’s context size where available, budget input plus output, and gate APIs by OS availability. Compress brand context and split long planning tasks. [Context-size API](https://developer.apple.com/documentation/foundationmodels/systemlanguagemodel/contextsize)

Apple describes third-generation Core as a roughly 3B dense model, and Core Advanced as a larger sparse model using a specialised storage/memory design on selected hardware. These research descriptions do not prove Core Advanced is available to Cadence on an unspecified 8 GB iPhone. Do not compare active parameter count with downloadable-model RAM as if runtimes were identical. [AFM3 research](https://machinelearning.apple.com/research/introducing-third-generation-of-apple-foundation-models)

Foundation Models is a native platform facility, not an exposed general browser or backend inference API. Cadence’s hosted website therefore needs a separate supported inference route; sharing typed draft formats does not make the system model universally accessible. [Swift framework](https://developer.apple.com/documentation/foundationmodels)

## Apple Private Cloud Compute: optional investigation

Apple describes developer access to PCC with no API cost for eligible apps, requiring Small Business Program enrolment, fewer than two million first-time downloads for any app, and an assigned entitlement. TestFlight/ad hoc test installs do not count toward that threshold. Crossing eligibility can require migration within six months after notification. These conditions must be checked for the actual developer account. [PCC developer programme](https://developer.apple.com/private-cloud-compute/)

Published WWDC material describes a 32K context cloud model with reasoning and per-user daily allowances; higher user access may depend on iCloud+. Treat this as a native, connected, quota-limited option. Do not promise unlimited free cloud AI or an endpoint the website can call. [PCC framework session](https://developer.apple.com/videos/play/wwdc2026/319/)

PCC entitlement approval, current shipping OS/runtime support, account eligibility, current terms, quota UX, and the selected model’s availability are unresolved. Keep PCC outside the mandatory MVP acceptance criteria until these are demonstrated. Local generation must remain a distinct route with a clear cloud action when data will leave the device.

## Downloadable model routes if Apple’s baseline is unavailable or insufficient

| Runtime | Format and useful property | MVP caveat |
| --- | --- | --- |
| LiteRT-LM Swift | `.litertlm`; native CPU/Metal backends; Swift API supports streamed generation, tools, and configured image/audio encoders | Swift SDK is labelled early preview; exact model, SDK release, and device require a spike |
| llama.cpp | GGUF with supported quantisation; SwiftUI example and Metal-capable C++ runtime | Native integration and model-support maintenance are Cadence responsibilities |
| MLX Swift / MLX Swift LM | Compatible MLX model configuration, tokenizer, and quantised safetensors; Apple GPU integration | Exact architecture/conversion support and Xcode/Metal build must be verified |

Sources: [LiteRT-LM repository maturity](https://github.com/google-ai-edge/LiteRT-LM), [Swift API](https://developers.google.com/edge/litert-lm/swift), [llama.cpp](https://github.com/ggml-org/llama.cpp), [SwiftUI example](https://github.com/ggml-org/llama.cpp/tree/master/examples/llama.swiftui), [MLX Swift](https://github.com/ml-explore/mlx-swift), [MLX Swift LM](https://github.com/ml-explore/mlx-swift-lm).

LiteRT’s package declares an iOS 15 deployment floor; MLX packages declare iOS 17. These compile/deployment floors are not promises that a particular LLM fits or performs well on every supported phone. Package features may have higher availability gates. [LiteRT package](https://github.com/google-ai-edge/LiteRT-LM/blob/main/Package.swift), [MLX package](https://github.com/ml-explore/mlx-swift/blob/main/Package.swift), [MLX LM package](https://github.com/ml-explore/mlx-swift-lm/blob/main/Package.swift)

Start the downloadable comparison with Gemma 4 E2B; promote E4B only after actual-device memory and quality tests. Keep one production runtime after the spike. GGUF, MLX, and `.litertlm` files are not interchangeable, and quantisation quality must be evaluated for the exact artifact. [Gemma overview](https://ai.google.dev/gemma/docs/core)

The official mobile LiteRT E2B artifact is approximately 2.58 GB on disk; E4B is approximately 3.66 GB. Cards separate decoder, memory-mapped embeddings, and demand-loaded encoders. Their component/loading figures are not a complete peak memory measurement for Cadence. [E2B mobile card](https://huggingface.co/litert-community/gemma-4-E2B-it-litert-lm), [E4B mobile card](https://huggingface.co/litert-community/gemma-4-E4B-it-litert-lm)

Vendor warm-cache, fixed-context benchmark results exclude important user costs such as initial download and cold model load. GPU benchmark CPU-memory figures alone are not total device memory. Do not copy throughput from a different iPhone/OS into a Cadence guarantee. [Mobile benchmark method](https://huggingface.co/litert-community/gemma-4-E4B-it-litert-lm)

Use bounded context/output and one generation at a time. For short social posts, begin with thinking disabled or capped; LiteRT Swift exposes a thinking budget and configured token/cache limits. Experimental acceleration must earn its place through measurement, particularly memory peaks. [Swift inference controls](https://developers.google.com/edge/litert-lm/swift)

## Safari/PWA local inference

LiteRT-LM JavaScript is early preview and currently documented as text input/text output. It requires the specific supported web artifacts and WebGPU. Native encoder support does not imply the browser package supports the same multimodal features. [JavaScript API and supported artifacts](https://developers.google.com/edge/litert-lm/js)

Detect browser GPU availability and adapter limits, then validate Safari and installed Home Screen mode separately on both real phones. Handle allocation failure, lost GPU device, cancellation, browser reload, and cache loss without losing saved drafts. WebGPU support alone does not certify LiteRT’s exact combination.

WebKit describes origin storage ceilings up to 60% of disk for browser and Home Screen apps, but these are upper limits rather than guaranteed usable capacity. Best-effort data can be evicted; persistence is granted using heuristics. Check estimated quota and available storage before downloading, and provide recoverable cache states. [WebKit storage policy](https://webkit.org/blog/14403/updates-to-storage-policy/)

A downloaded browser model consumes local storage and website bandwidth; model weights with no licence fee are not zero-cost distribution. Network, cache, and loading failures make browser AI an optional capability until the actual-device gate passes. The hosted editor and scheduler must still work when it is unavailable.

## Device memory, thermal limits, and lifecycle

- Artifact size: bytes stored/downloaded, including encoders and embeddings.
- Loading memory: runtime allocations and mapped/resident model parts during setup.
- Peak app memory: model plus cache, intermediate buffers, tokenizer, UI, attachments, and concurrent operations.
- Whole-device pressure: Cadence plus iOS, other apps, shared GPU allocations, and system-model activity.

Do not equate these numbers. iOS can terminate apps under pressure or after a process limit is exceeded. A phone with 8 GB installed RAM does not expose an 8 GB app budget; there is no universal safe limit established here. Keep an extension lightweight and transfer captured material to the main app rather than loading a model there. [Jetsam diagnostics](https://developer.apple.com/documentation/xcode/identifying-high-memory-use-with-jetsam-event-reports)

Proposed initial constraints, not measured vendor results: one active generation, short text-first prompts, a small bounded context, capped output, and prompt cancellation. Pause/reduce optional AI work under serious/critical thermal state and test low-power mode and repeated use. [Thermal state](https://developer.apple.com/documentation/foundation/processinfo/thermalstate-swift.enum)

For the first native release, keep generation foreground-led and save input/draft state before interruption. Ordinary background Metal work is restricted. Newer continued-processing APIs can finish user-initiated tasks, including GPU work on supported hardware with the appropriate entitlement, but they are conditional and cancellable. They are not an always-on inference server. [Metal background restrictions](https://developer.apple.com/documentation/metal/preparing-your-metal-app-to-run-in-the-background), [continued processing](https://developer.apple.com/documentation/BackgroundTasks/performing-long-running-tasks-on-ios-and-ipados), [GPU requirements](https://developer.apple.com/documentation/backgroundtasks/bgcontinuedprocessingtaskrequest/requiredresources)

Upload the approved scheduled post to the hosted service before scheduling succeeds. Cloud jobs perform timed publishing even when phones sleep, the app is suspended, or a model is unavailable. Local AI availability must not become a dependency of publishing.

## Model download, licensing, and privacy design

- Offer a visible optional download with size, progress, cancellation, Wi-Fi preference, and a disk-capacity check; preserve the manual editor during preparation.
- Use resumable file downloads, streaming to disk rather than materialising multi-gigabyte responses in memory. Native background URLSession downloads can continue while the app is suspended; discretionary transfers may wait for favourable conditions. [Background downloads](https://developer.apple.com/documentation/foundation/downloading-files-in-the-background)
- Pin a model version, verify integrity, install atomically, and leave room for replacement. Keep download/cache storage separate from user drafts and allow model removal without removing drafts.
- Check the exact model/quantisation redistribution licence and runtime notices before distribution; do not assume a converter’s or runtime’s licence grants rights to the model. Keep required licence/NOTICE files and version provenance. [Model artifacts](https://huggingface.co/litert-community/gemma-4-E2B-it-litert-lm), [LiteRT runtime](https://github.com/google-ai-edge/LiteRT-LM), [llama.cpp runtime](https://github.com/ggml-org/llama.cpp)
- Local prompt processing does not make synced drafts private from the hosted service. State which operations stay local and which sync; do not log prompt content by default. Native engines do not need a public localhost server.

## Actual-device release gate

1. Record both exact phones, iOS builds, language, Apple Intelligence status, free storage, and normal everyday app load.
2. Build the established Foundation Models route first on eligible phones; verify offline generation after model readiness and all unavailable/error states.
3. If needed, compare one pinned native Gemma E2B artifact; add E4B only if the smaller model misses the task-quality target. Browser comparison is separate.
4. Blind-score 50–60 real FSS tasks for usefulness, UK English, brand tone, instruction-following, and factual grounding; include refusals and hostile imported text.
5. Suggested product gate: at least 85% usable with light editing, zero invented grounding facts on the designated test set, and at least 95% valid structured drafts. These are proposed acceptance targets.
6. Measure cold download/load separately from warm first-token and complete-draft latency; capture peak app/device memory, jetsam events, battery use, thermal state, and 20 repeated generations.
7. Exercise cancellation, locked phone, backgrounding, network loss, low storage, corrupted download, cache eviction, language/model change, and draft sync conflicts.
8. Prove a scheduled post publishes with both phones offline and AI unavailable. Publishing correctness is a server test.

The final latency/battery thresholds and supported-device list require user preferences and measured results. Do not market unlimited offline AI, all-device 8 GB support, or multimodal parity before these gates pass.

## Conditional delivery recommendation

- If both phones are Apple Intelligence eligible and the membership cost is accepted/already paid: native Foundation Models is the lowest model-distribution burden to test first, alongside the hosted website.
- If native model quality is insufficient or eligibility fails: test downloadable LiteRT Gemma E2B before E4B; choose another runtime only for a demonstrated compatibility or performance benefit.
- If no extra distribution spending is absolute: launch the web/Home Screen pilot, keep App Store distribution unresolved, and prove optional browser AI on the actual devices before making it a core promise.
- Treat newer Apple model features and PCC as gated follow-ups. Their entitlement and shipping/runtime status remain unresolved; the core build plan must succeed without them.
