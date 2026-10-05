# Cadence: local AI deployment research

Research date: 4 October 2026. Scope: an internal FSS application for two users, with a possible later public release.

Status: source-backed deployment options; final hardware selection, supported devices, and acceptable draft latency remain pending user clarification.

No models, runtimes, dependencies, or application code were installed or downloaded. No performance measurements were taken on the users' devices.

## 1. Decision to resolve

An 8 GB device can be a useful local drafting target, but installed RAM does not equal memory available to the AI application.
Choose the best model that passes the target device's memory, speed, and content-quality tests; do not choose solely from general benchmark rankings.
The implementation should preserve a small AI-provider boundary so the model and runtime can change without rewriting publishing workflows.

Required clarification:

- Does 8 GB mean total device RAM, dedicated GPU memory, or an AI-process allowance?
- Which exact computers and phones need support: model, operating system, processor, GPU, and available disk space?
- Does AI run on each device, or can an always-on FSS computer serve both users?
- Does "free" mean no model licence fee, no per-token vendor bill, or no extra infrastructure spending?
- Must the AI work offline, and which text, image, audio, or video tasks are essential initially?
- What wait is acceptable for a normal post draft?

## 2. Separate four memory measurements

| Measurement | Meaning | Planning implication |
|---|---|---|
| Artifact size | Downloaded model file(s) on disk | Determines storage and initial download cost. |
| Static loading footprint | Memory needed to load weights in a particular format/runtime | Does not establish complete application memory. |
| Runtime/process peak | Weights, cache, temporary buffers and other allocations observed during a workload | Depends on context, output, concurrency, backend and measurement method. |
| Whole-device peak | OS, browser/apps, Cadence, inference, CPU/GPU allocations and memory pressure | Determines whether an 8 GB device remains usable. |

Google explicitly separates model-loading estimates from software and context overhead. [Gemma overview](https://ai.google.dev/gemma/docs/core)

Planning equation:

`device memory = OS + browser/other apps + Cadence + resident weights + work buffers + KV/context cache + optional encoders + optional drafter`

Memory-mapped weights are not a guarantee of zero memory use; inspect device pressure and swapping as well as process counters.
When GPU inference is used, a reported CPU-memory figure must not be treated as combined CPU-plus-GPU peak usage.

## 3. Gemma 4: deployment-specific evidence

Google's approximate static Q4_0 loading estimates are 2.9 GB for E2B, 4.5 GB for E4B, and 6.7 GB for 12B.
Its mobile text-only estimates are 0.84 GB and 2.2 GB for E2B and E4B respectively; they use LiteRT-LM.
These are different deployment formats, not interchangeable whole-device requirements. [Google memory table](https://ai.google.dev/gemma/docs/core)

"Effective" parameters exclude the full storage implications of per-layer embeddings.
A MoE model's active parameter count likewise does not mean only those weights need loading. [Architecture notes](https://ai.google.dev/gemma/docs/core)

The E4B LiteRT artifact is approximately 3.66 GB on disk, including 2.24 GB decoder weights and 0.67 GB embeddings.
Embeddings are memory-mapped; image/audio components load when needed. [E4B artifact card](https://huggingface.co/litert-community/gemma-4-E4B-it-litert-lm)

Vendor E4B/E2B measurements use warm caches, 2,048-token context, 1,024-token prefill and 256-token decode.
Load time is excluded from reported first-token latency; CPU-memory counters differ across operating systems.
The converted packages document context up to 32K, so identify the exact artifact rather than using a family headline.
These results do not certify all 8 GB devices. [E4B measurements](https://huggingface.co/litert-community/gemma-4-E4B-it-litert-lm), [E2B measurements](https://huggingface.co/litert-community/gemma-4-E2B-it-litert-lm)

Google's showcased speed results use flagship phones and substantially larger-memory MacBook Pros.
Do not copy those speeds into an estimate for an unspecified 8 GB laptop. [Runtime announcement](https://developers.googleblog.com/blazing-fast-on-device-genai-with-litert-lm/)

## 4. Proposed constraints, not measured results

- Begin with text drafting and repurposing; add multimodal execution after separate memory testing.
- Start with 2K–4K context, bounded output, one loaded model and one active generation.
- Trial an AI working-memory allowance around 3–4 GiB while leaving room for the user's normal applications.
- Treat that allowance as an initial engineering target, not an estimate of every operating system's memory needs.
- Unload idle models and queue requests instead of running multiple generations concurrently.
- Evaluate E2B and other small-model candidates as the broad 8 GB baseline; trial E4B for better quality where headroom permits.
- Do not make a 7B/8B model or the 12B Gemma variant the universal 8 GB baseline without device evidence.
- Final latency target and exact supported hardware: **pending user clarification**.

## 5. Hardware support tiers

| Target | Initial deployment proposal | Evidence needed |
|---|---|---|
| 8 GB Windows/Linux, CPU only | Small quantized text model; native runtime | Actual CPU throughput, app coexistence, cold start and swapping. |
| 8 GB Apple Silicon Mac | Small model through Metal/LiteRT; compare E4B optimized format | Shared memory headroom and drafting latency. |
| 8 GB phone | Certify named devices using native LiteRT or an explicitly supported browser | App allocation limits, model download, heat, battery and interrupted sessions. |
| 16 GB+ device | Optional larger quality tier after baseline succeeds | Comparative quality gains justify added latency and memory. |

Apple Silicon CPU/GPU share one unified memory pool; 8 GB is not a separate allowance for each processor. [MLX memory documentation](https://ml-explore.github.io/mlx/build/html/usage/unified_memory.html)

## 6. Runtime options

| Runtime | Fit for Cadence | Material constraint |
|---|---|---|
| llama.cpp | Controlled native, cross-platform GGUF deployment | Pin exact model/runtime and test CPU/Metal/GPU backend. |
| Ollama | Convenient internal model trial and local API | Configure model count, concurrency, context, origins and cloud mode. |
| LiteRT-LM | Gemma mobile formats and local server | Desktop and browser paths differ; web API is early preview. |
| MLX | Optimized Apple deployment | Another platform/artifact to maintain if Windows is required. |
| ONNX Runtime | Useful when export and hardware targets justify it | Generate API is preview; browser large-model limits require care. |

llama.cpp documents x86 acceleration, Metal, Vulkan and hybrid execution. [Supported backends](https://github.com/ggml-org/llama.cpp)
Ollama's parallel contexts multiply memory; it supports idle unloading and a local-only setting. [Ollama FAQ](https://docs.ollama.com/faq)
LiteRT-LM provides an OpenAI-compatible server. [CLI documentation](https://developers.google.com/edge/litert-lm/cli)
The LiteRT JS preview currently supports text input/output and specific E2B/E4B web artifacts. [Web API](https://developers.google.com/edge/litert-lm/js)
ONNX documents its preview generation API and a 4 GB WASM-addressing limit. [Generate API](https://onnxruntime.ai/docs/genai/), [Large browser models](https://onnxruntime.ai/docs/tutorials/web/large-models.html)

## 7. Connection and security boundaries

- Put Cadence authentication, job limits and validation in front of the inference service.
- Bind native inference to loopback where possible; keep the raw runtime off the public internet.
- Explicitly start LiteRT-LM with `--host 127.0.0.1`: its documented server default is `0.0.0.0`.
- The LiteRT server documentation does not establish a built-in authentication guarantee. [Server configuration](https://developers.google.com/edge/litert-lm/cli/openai_server)
- For llama-server, require an API key and exact allowed origins where applicable; disable agent/tools for drafting. [Server options](https://github.com/ggml-org/llama.cpp/blob/master/tools/server/README.md)
- Ollama defaults to loopback; additional browser origins require configuration. [Ollama networking](https://docs.ollama.com/faq)
- `localhost` on a phone means that phone, not the user's laptop or a cloud server.
- Public-site requests to loopback/private networks can require Chrome's Local Network Access permission; test denial as a normal error state. [Chrome restrictions](https://developer.chrome.com/release-notes/142?hl=en)
- Keep social OAuth credentials outside prompts and local drafting engines; publishing credentials belong to the authenticated backend.

## 8. Choose one initial AI topology

**Per-device drafting:** the user runs AI while present; accepted drafts synchronize to Cadence.
Advantages: private inference, offline drafting after provisioning, no central inference-machine dependency.
Costs: device setup/certification; mobile and desktop capabilities can differ; no promise of background generation while devices sleep.

**Shared FSS host:** an authenticated backend routes bounded drafting requests to one private, always-on inference service.
Advantages: both users access one model from phones or computers; fewer installs and consistent capability.
Costs: host electricity/maintenance and availability; sleep, network outages or a failed host stop generation.

Implement one topology first. Avoid simultaneous native companion, browser AI and native-phone development for a two-user MVP.
The browser-only LiteRT path merits a bounded pilot, with unsupported hardware and early-preview failures explicitly handled.

## 9. Publishing must operate independently

Persist reviewed text and media before scheduling. Run publishing on an always-on backend, independently of local AI availability.
Use durable jobs, provider-aware retries, duplicate protection, cancellation and recovery for uncertain publish outcomes.
Do not rely on a browser timer, laptop wake state or service worker for dependable scheduled posts.
AWS EventBridge Scheduler offers 60-second invocation precision; disable flexible windows where appropriate. [AWS schedule types](https://docs.aws.amazon.com/scheduler/latest/UserGuide/schedule-types.html)

## 10. Free AI, privacy and API restrictions

Local weights can eliminate a per-token provider bill; electricity, hardware, storage, bandwidth and application hosting still have costs.
Local inference is distinct from cloud synchronization: prompts may stay local while accepted drafts and attachments leave the device.
Ollama documents that local prompts are not sent to it, and exposes a local-only configuration. [Local-only mode](https://docs.ollama.com/faq)

Do not make free Gemini API quota a required fallback for the UK application.
Current terms require Paid Services for API Clients made available to UK/EEA/Swiss users and define paid API access through an active billing-associated project.
UK data handling also follows paid-service provisions for unpaid quota; avoid a blanket claim that free UK prompts train the vendor. [Gemini integration terms](https://ai.google.dev/gemini-api/terms)
API quotas and capacity are not guaranteed. [Gemini rate limits](https://ai.google.dev/gemini-api/docs/rate-limits)

## 11. Phase 0 evaluation and release gate

1. Record device specification, available RAM/disk, exact artifact hash, runtime version, backend and settings.
2. Compare shortlisted models on 50–60 real tasks spanning FSS, personal and NexSteps copy, source-grounded summaries, rewriting and structured output.
3. Have both users blind-score brand fit, usefulness, factual restraint, UK English and editing effort.
4. Record cold load, warm first-token and total draft latency; process peak plus whole-device memory pressure, swapping and GPU allocation.
5. Repeat with ordinary apps open, 2K/4K context, 20 consecutive generations and two users queued.
6. Test cancellation, timeouts, offline use, engine crashes, host sleep, permission denial and exhausted resources.
7. For phones, additionally measure heat, battery use, background interruption and model-cache recovery.
8. Require bounded resource use, no model-induced OS instability and a usable non-AI drafting path.
9. Provisional quality target: at least 85% of drafts need only light editing; zero invented facts on the designated source-grounding suite; at least 95% schema-valid structured responses.
10. Confirm latency and memory targets with the user, then select the highest-quality candidate that passes those gates.

The proposed quality thresholds are product acceptance criteria, not vendor benchmark findings or a promise of model accuracy.
The model selection can be documented confidently only after hardware clarification; performance certification requires the actual trial.
