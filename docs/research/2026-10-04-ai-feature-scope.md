# Cadence: AI feature scope within the zero-paid-API constraint

Research date: **4 October 2026**.
Planning constraint: no paid AI APIs or service subscriptions beyond the agreed database and website hosting.
Status: proposed scope; exact devices, latency targets and final platform/workflow decisions remain pending.
This memo contains design recommendations, not measured FSS capability claims.

## Product direction

Put AI into the first usable release as a working content assistant.
Use it across brand setup, capture, drafting, rewriting, repurposing and review.
Keep schedule execution, identity, permissions, calculations and publishing controlled by application code.
Increase useful automation through small, bounded jobs rather than one unrestricted marketing agent.
The AI should prepare a weekly batch for review and reduce repeated typing.
The two owners remain responsible for accepting factual claims, brand decisions and publication.

## Day-one and later meaning

**Day one** means the first usable internal release, after model/runtime evaluation.
**Early follow-up** means the next release once the core drafting and source workflow works.
**Later** means a feature that requires accumulated data, media support or additional evaluation.
A failed multimodal evaluation must not delay the working text assistant.
No feature assumes a paid AI, search, transcription, image or social-management service.

## Feature map

| Feature | First release | Early follow-up / later | Application controls and limits |
|---|---|---|---|
| Brand intake | Turn owner answers and supplied examples into a proposed playbook: audience, offer, tone, pillars, banned phrases, CTA styles | Compare accepted/rejected examples; propose playbook updates | Owners accept the playbook; keep versions and brand boundaries; AI must not invent business facts |
| Idea capture | Summarise pasted notes, extract topics, suggest titles and tags | Voice capture and larger source imports | Preserve the original; typed source IDs; editable extraction; no automatic deletion |
| Idea generation | Propose angles, hooks and post ideas from approved pillars and source notes | Suggest gaps from accepted calendar and content history | Label creative suggestions; no invented news, trends, statistics or testimonials |
| Rewriting | Shorten, clarify, change tone, improve structure and grammar | Learn preferences through approved examples | Show versions/diff; keep existing facts, offers and attributed quotations |
| Brand adaptation | Produce separate variants for personal/FSS/NexSteps playbooks | Batch adaptation with brand-specific examples | Explicit target brand; no accidental migration of claims, client details or account identity |
| Platform variants | Generate text drafts for configured channels and approved content formats | Carousel copy, video scripts and title/description sets | Versioned platform rules enforced by code; no promise of engagement or virality |
| Hooks and CTAs | Offer a small selectable set of hooks/CTAs | Compare outcome-labelled patterns | User selects; do not fabricate results, scarcity or product capabilities |
| Content calendar | Propose a one-week plan: topic, pillar, draft, audience and preferred slot | Rolling plan, campaign sequencing and rescheduling suggestions | Resolve dates/timezone in code; detect conflicts; never invent a statistically “best time” |
| Review checklist | Flag unclear offers, missing sources, repetitive language, tone mismatch and likely overclaiming | Cross-post consistency and campaign review | Advisory checks; deterministic hard rules remain authoritative |
| Source fidelity | Return draft text with cited internal source IDs and a claim checklist | Claim-to-source span review and freshness reminders | Source records/rendering controlled by code; valid IDs are not proof of semantic truth |
| Structured extraction | Produce schema-based metadata, topic lists and suggested calendar items | More complex actions after evaluation | JSON schema, enum/length/date validation; bounded retry; reject invalid state |
| Text repurposing | Turn an approved article/notes into short posts, a thread outline or script | Long transcripts split into linked topic segments | Source-backed batches; explicit status per output; review before use |
| Image captions / alt text | Manual image description is available; AI uses that text | Actual image understanding after runtime/encoder and memory tests | Visual claims require image inference; human reviews alt text; no guessed identity or sensitive attributes |
| Voice-note transcription | Store/upload a note and permit a supplied transcript | Local ASR as the first media capability; optionally include in release one if tested early | Preserve audio; validate transcript with playback; separate ASR from summarisation |
| Media-library tagging | Text tags and descriptions based on supplied metadata | Vision-assisted tags/OCR for uploaded images | No facial recognition; uncertain OCR text flagged; tags remain editable |
| Branded visuals | AI writes headlines, carousel slide copy and a template brief | Export approved content through owned templates | Template rendering is application code; the language model is not an image generator |
| Numerical analytics | Import/enter platform measurements; AI explains a small verified result table when available | Scheduled imports where permitted; richer comparisons | Calculate totals, rates, changes and denominators in code; never ask the model to invent metrics |
| Experiments | Propose one hypothesis, one variable, metric and comparison window | Track outcomes and propose follow-ups once sufficient data exists | Owner accepts; no causal claim from small observational samples; keep confounders visible |
| Weekly assistant | Generate a bounded draft pack from selected sources and approved playbooks | Opt-in recurring generation jobs | Jobs create proposals; queue/backpressure/cancellation; no unbounded autonomous browsing/posting |
| Replies/inbox | Draft a response to manually supplied comments only if requested | Connected inbox support after platform and security checks | No independent public replies, DMs or promises; sending needs approved content/recipient |

## Evidence behind text versus media scope

Small instruction models are plausible for rewriting, extraction, summaries and controlled drafting.
Their model-card benchmarks do not establish FSS brand quality or factual reliability.
Gemma 4 E2B/E4B accept text/image/audio and generate text. [Google model card](https://ai.google.dev/gemma/docs/core/model_card_4)
Qwen3.5-4B accepts image/text; image handling uses its vision encoder. [Qwen card](https://huggingface.co/Qwen/Qwen3.5-4B)
LFM2.5-2.6B is text-only; Granite 4.2-3B is also a text model. [Liquid card](https://huggingface.co/LiquidAI/LFM2.5-2.6B), [IBM card](https://huggingface.co/ibm-granite/granite-4.2-3b)
A runtime being OpenAI-compatible does not establish identical modality support.
Require an actual successful image/audio request through the pinned runtime, parser and artifact.
Check both quality and peak memory with the extra encoder/projector loaded.
The optimized Gemma E4B browser artifact is text-only; its native artifact loads vision/audio as needed. [Deployment card](https://huggingface.co/litert-community/gemma-4-E4B-it-litert-lm)
Do not show an enabled “understand this image/audio” action when only text inference is available.

## Voice notes: credible local route

Gemma's audio documentation specifies a 30-second clip limit, 25 tokens/second and 16 kHz mono input.
Long notes need segment handling; transcription is not the same task as summarisation. [Google audio guide](https://ai.google.dev/gemma/docs/capabilities/audio)
An alternative is a small local Whisper worker followed by the chosen text model.
Whisper code and weights use MIT; no paid transcription API is required. [Official Whisper repository](https://github.com/openai/whisper)
whisper.cpp supports CPU-only inference and quantized models.
Its documentation reports base at 142 MiB disk / approximately 388 MB memory and small at 466 MiB / approximately 852 MB.
Those are runtime estimates, not measured FSS performance. [Runtime memory and formats](https://github.com/ggml-org/whisper.cpp)
Evaluate base/small on the owners' accents, background noise, brand names and expected note length.
Choose English-only or multilingual weights according to the actual language requirement.
Run ASR and content drafting sequentially; release one model before loading the next when needed.
Preserve timestamps/segments and the original audio; expose playback beside the transcript.
Whisper's official card acknowledges possible invented transcript text and uneven accent/language performance. [Whisper limitations](https://github.com/openai/whisper/blob/main/model-card.md)
Do not silently turn uncertain or unreviewed transcription into public factual claims.
Full speaker diarisation, real-time meetings and emotion detection are outside this initial ASR scope.

## Images, video and assets

Image understanding can suggest captions, alt text, OCR and content topics after validation.
It cannot verify ownership, consent, truthfulness or licensing of a media asset.
A text-only model can write video scripts, shot lists and caption text from a supplied transcript.
Understanding video frames is different from generating new footage.
None of the chosen text-output models is an image/video generator. [Google output modalities](https://ai.google.dev/gemma/docs/core/model_card_4), [Qwen overview](https://huggingface.co/Qwen/Qwen3.5-4B)
This research did not establish dependable production-quality image/video generation alongside Cadence within 8 GB.
Do not promise it under the initial budget; separate models/hardware, throughput and storage evaluation would be required.
Use owner-supplied images/video plus deterministic crop/resize/template exports.
Later subtitle files and clip recommendations may use reviewed local transcripts; actual editing needs a separate media pipeline.
Do not relabel template rendering or shot-list writing as generative-image/video capability.

## Source grounding and structured responses

Retrieve only the selected brand's permitted source chunks and approved playbook.
Begin with explicit selected sources and database full-text search; no paid vector/search service.
Store each source's owner/brand, revision, upload/fetch date, origin and extracted text.
Send stable source IDs; require claim records containing claim text and supporting source IDs.
Application code checks source ownership, ID membership and revision, and renders the citation links.
Quote verification can compare quoted strings; numbers can be checked against supplied structured facts.
These checks cannot prove all paraphrased claims are supported; show the source alongside the draft for review.
A second model pass can flag unsupported claims, but it cannot certify its own answer.
Prompt/model “confidence” is not a calibrated probability of factual correctness.
Keep supplied facts separate from creative framing and make missing evidence visible.
Ollama supports JSON-schema output and documents Zod/application validation. [Structured-output documentation](https://docs.ollama.com/capabilities/structured-outputs)
Schema compliance establishes shape; semantic validation still checks permissions, dates, facts and allowed actions.
Preserve the original draft if regeneration fails; never replace it with partial invalid output.

## Numerical analytics and experiments

Application code owns formulas and records the measurement window, timezone, platform and denominator.
Distinguish missing metrics from zero; avoid comparisons between incompatible platform definitions.
Do not average percentages without their appropriate weights; reject undefined zero-denominator rates.
Pass a small computed facts table to the model, not a request to calculate arbitrary raw analytics.
AI may describe observed changes and suggest hypotheses; it cannot establish why a metric changed.
Early “best time to post” is a labelled test suggestion based on the owner's constraints.
Only later data-backed comparisons can use measured outcomes; state sample size and missing data.
Experiments compare approved variants and record a hypothesis, variable, success metric and window.
Human accepts the hypothesis/variants; ordinary code tracks assignments and measurements.
No guaranteed growth, causal attribution, forecasting accuracy or automated winning-strategy claim.

## Tool permissions and publishing boundary

Function calling returns proposed calls; the application decides whether and how to execute them. [Ollama tools documentation](https://docs.ollama.com/capabilities/tool-calling)
Day-one read tools: search permitted sources, load the chosen playbook and inspect permitted calendar slots.
Day-one writes: a bounded job may save new draft/proposal records in its authorised workspace.
Changing an existing draft uses explicit apply/version checking; no silent overwrite of accepted content.
Calendar changes are proposals until the owner accepts the plan or requested scheduling action.
A publishing approval binds the content/media revision, brand, connected account and schedule.
Subsequent material edits invalidate that approval; exact authorised scheduled jobs execute through normal publisher code.
The model cannot grant approval, obtain OAuth tokens, pick another tenant or change access controls.
Keep publish/delete/send/account-management tools out of its callable tool set.
Never execute model-generated SQL, shell commands or arbitrary HTTP requests.
Treat imported webpages, transcripts, OCR and source documents as untrusted data.
Separate data from instructions and enforce least privilege outside prompts; prompting alone is not the security boundary. [OWASP guidance](https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html)

## Operating within 8 GB and the budget

Pin a tested model/runtime artifact; load one inference model at a time.
Use short selected source context, bounded outputs, one generation slot and a cancellable job queue.
Measure the app, OS and background workloads as well as the inference process.
A co-hosted 8 GB web server also needs memory for its web processes and any colocated database.
Do not infer server throughput from Apple/phone benchmark rates.
Use database-backed jobs rather than adding paid queues or a paid agent platform for two users.
A serverless website tier is not assumed to run a persistent multi-gigabyte model; select hosting that permits the measured worker.
Device-local AI needs a reachable local runtime/companion; remote phones cannot assume a laptop is online.
AI downtime must preserve manual capture/editing/calendar/publishing functions.
Cache exact repeatable source transformations; record model, prompt version, source revisions, latency and outcomes.
No default cloud fallback, paid search, paid embeddings or hidden API calls.
A public SaaS release needs a new capacity/cost decision; two-user CPU feasibility is not a free-at-scale promise.

## Evaluation before enabling automation

Evaluate the actual tasks/artifact, including brand fidelity, source omissions/additions and editing effort.
Measure schema-validity, cold start, complete-task time, memory and model switching.
Test conflicting brand examples, malicious source instructions, failed jobs and stale source revisions.
Test image/audio support through the real application route rather than a separate notebook.
Run representative long-note/noisy-note and encoder-memory checks before enabling voice/image actions.
Keep AI-authored draft saving reversible and publication approvals explicit.
Final default model, media scope and waiting-time targets remain pending user decisions and measured trials.
