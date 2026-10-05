# Cadence: small local AI model research
Research date: **4 October 2026**. Intended audience: FSS planning and development.
Status: **Research shortlist; device, deployment mode and final AI tasks await user answers.**
No FSS hardware benchmarks, model installations, model downloads or private-data generation were performed.

## Decision
There is no verified universal “best model for 8 GB RAM”.
RAM capacity alone does not establish runtime compatibility, speed or usable context.
Benchmark the actual quantized artifact on the intended device with Cadence and normal background apps open.
For initial evaluation, shortlist **Qwen3.5-4B, optimized Gemma 4 E4B, LFM2.5-2.6B and Granite 4.2-3B**.
Select one default and one lower-memory fallback after the evaluation.
This is an engineering shortlist, not a measured ranking for FSS writing quality.

## What “free” needs to mean
Separate no model/API licence charge from no infrastructure charge.
Local inference still uses storage, electricity, battery and existing hardware.
A hosted open-weight model incurs hosting costs even when its weights are free.
A free cloud API tier is a separate product with limits, availability and data-handling terms.
Exact licence identifiers below are factual tags, not legal advice or conclusions about a particular deployment.
Check the pinned artifact’s licence and required notices before distributing it.

## Memory terminology
**Download size** is the file or runtime package stored on disk.
**Weight-loading estimate** may exclude operating system, context, model activations and application processes.
**RSS, working set, private usage and GPU memory** are different measurements; do not combine them as equivalent.
Mapped embedding pages and accelerator allocations make cross-platform comparisons especially difficult.
**Total device RAM** must also support the OS, browser/Cadence, buffers, context cache and background applications.
An 8 GB GPU with additional system RAM is different from an 8 GB total-memory device.
A model’s architectural maximum context is not a safe default context on an 8 GB machine.

## Candidate comparison
All memory-fit statements are provisional until measured on the user’s hardware.

| Model / artifact | Licence tag | Size or measured memory | Main attraction | Main limitation |
|---|---|---|---|---|
| Gemma 4 E4B, optimized LiteRT-LM | Apache-2.0 | 3.66 GB native download; platform-specific measurements below | Text, image and audio input; system prompts and function calling | Format/platform differences; Windows results exceed comfortable 8 GB headroom |
| Gemma 4 E4B, official QAT GGUF | Apache-2.0 | 5.15 GB language file; 992 MB optional modality projector | Ordinary llama.cpp-compatible official quantization | Too tight for a dependable 8 GB total-device baseline |
| Qwen3.5-4B, runtime Q4 | Apache-2.0 | Current Ollama llama.cpp bundle 3.3 GB; MLX bundle 4.0 GB | General text/instruction and vision challenger | Package size is not peak RAM; published quality often uses thinking |
| Qwen3.5-2B | Apache-2.0 | Current Ollama llama.cpp package 2.7 GB Q8; MLX package 3.1 GB | Smaller-model fallback | Default tag uses Q8 here; do not assume Q4 size or equivalent quality |
| LFM2.5-2.6B, official Q4_K_M GGUF | LFM Open License v1.0 | 1.67 GB language file; publisher reports under 2.5 GB in its CPU tests | Compact instruction/structured-output challenger | Text-only; commercial licence contains organisation-revenue condition |
| Granite 4.2-3B, official GGUF | Apache-2.0 | Q4_K_M 2.24 GB; Q5_K_M 2.61 GB | Compact commercially portable text/tool challenger | No verified 8 GB-device peak-memory test found |
| Ministral 3 3B Instruct 2512 | Apache-2.0 | Q4_K_M 2.15 GB; optional vision projector 842 MB | Compact native JSON/tool and vision alternative | No demonstrated FSS writing advantage |
| Phi-4-mini-instruct | MIT | 3.8B parameters; quantized formats exist | Established text/function-calling baseline | Older generation; no verified target-device memory result |
| SmolLM3-3B | Apache-2.0 | 3B parameters; official card links quantized checkpoints | Open training details; compact text baseline | No verified target-device memory result |
| Llama 3.2 3B | Llama 3.2 Community License | Compact text and on-device quantized variants | Broad runtime ecosystem baseline | Custom licence; no evidence it leads this shortlist |

### Gemma 4: verified release and formats
Google released Gemma 4 on **2 April 2026** under Apache 2.0. [Google announcement](https://blog.google/innovation-and-ai/technology/developers-tools/gemma-4/)
E4B has **4.5B effective / 8B total parameters**, including embeddings; E2B has **2.3B effective / 5.1B total**.
Both accept text/image/audio input, generate text, support system prompts and function calling, and have 128K base context. [Official model card](https://ai.google.dev/gemma/docs/core/model_card_4)
Google gives approximate E4B loading estimates of 4.5 GB Q4, 2.5 GB mobile, and 2.2 GB text-only mobile.
For E2B, the corresponding estimates are 2.9 GB, 1.1 GB and 0.84 GB.
These figures exclude context/software costs and are not a promise about a specific artifact. [Official memory documentation](https://ai.google.dev/gemma/docs/core)
The actual official E4B QAT GGUF language file is **5.15 GB**, plus **992 MB** for its modality projector. [Official GGUF files](https://huggingface.co/google/gemma-4-E4B-it-qat-q4_0-gguf/tree/main)
Current Ollama E4B packages differ again: its page lists 6.6 GB llama.cpp and 9.5 GB MLX bundles with additional components.
Treat these mutable tags as discovery labels; pin the exact approved artifact/revision for the app. [Ollama E4B package](https://ollama.com/library/gemma4:e4b)

### Gemma 4 E4B LiteRT-LM measurements
The linked LiteRT artifact is **3.66 GB on disk**, including 2.24 GB decoder weights and 0.67 GB mapped embeddings.
It supports **up to 32K context**, which differs from the base model’s 128K.
Its published warm-cache test uses 1,024 prefill tokens, 256 generated tokens and 2,048 context tokens.
Time to first token excludes load time; first-run behaviour may differ.
Reported Android S26 Ultra CPU memory: **3,283 MB**; macOS M4 Max GPU memory: **3,217 MB**.
Reported Windows LunarLake CPU memory: **9,372 MB**; GPU memory: **7,147 MB**.
Optimized web artifact is text-only, with approximately **3,300 MB GPU memory** on an M4 Max.
These figures do not prove an 8 GB Windows device is suitable. [Artifact and benchmark details](https://huggingface.co/litert-community/gemma-4-E4B-it-litert-lm)
LiteRT-LM marks Python/C++/Kotlin stable, with Swift/JavaScript early preview.
A browser integration therefore has additional compatibility uncertainty. [Official runtime](https://github.com/google-ai-edge/LiteRT-LM)

### Qwen3.5
Qwen3.5-4B is post-trained, multimodal and hybrid-attention, with configurable thinking and 262K native context.
Publisher scores include IFEval 89.8, IFBench 59.2 and BFCL-v4 50.3.
These are model-card results, not measurements of quantized short-context FSS drafting. [Official 4B card](https://huggingface.co/Qwen/Qwen3.5-4B)
The 4B runtime package lists Q4_K_M; actual package size includes components beyond a parameter-count estimate. [Ollama 4B package](https://ollama.com/library/qwen3.5:4b)
Qwen3.5-2B publishes IFEval 61.2 in non-thinking mode versus 78.6 in thinking mode.
Do not assume disabling thinking preserves the publisher’s best scores. [Official 2B card](https://huggingface.co/Qwen/Qwen3.5-2B)
The current 2B runtime tag lists Q8 rather than Q4. [Ollama 2B package](https://ollama.com/library/qwen3.5:2b)
Official newer Qwen3.8 releases exist, but no official general-purpose 4B/2B version was verified.
Avoid confusing community distillations with official releases. [Official model inventory](https://huggingface.co/Qwen/models)

### LFM2.5-2.6B
This August 2026 text-only model has 2.69B parameters and a 128K architectural context. [Official card](https://huggingface.co/LiquidAI/LFM2.5-2.6B)
Its official Q4_K_M language file is 1.67 GB. [Official files](https://huggingface.co/LiquidAI/LFM2.5-2.6B-GGUF/tree/main)
Liquid reports IFStruct 85.49, Multi-IF 80.07 and BFCL-v4 56.88 in its own comparison.
Its CPU tests report under 2.5 GB memory on powerful M5 Max / Ryzen AI Max+ 395 hardware.
The publisher comparison makes this a promising compact candidate; it is not independent proof of superiority. [Benchmark setup](https://www.liquid.ai/blog/lfm2-5-2-6b)
The licence defines a US$10 million annual-revenue threshold for the relevant legal entity/control grouping.
Commercial use above its stated threshold is not covered by that agreement; the condition is not Cadence-only revenue. [Actual licence](https://huggingface.co/LiquidAI/LFM2.5-2.6B/blob/main/LICENSE)

### Granite and reserve baselines
Granite 4.2-3B was released 25 August 2026, with non-thinking/low-effort/full thinking and native 128K context.
Publisher scores include BFCL-v4 52.41 and IFBench prompt 74.33.
Different evaluation setups prevent direct ranking against Liquid/Qwen percentages. [IBM card](https://huggingface.co/ibm-granite/granite-4.2-3b)
Official Q4/Q5 artifacts establish download sizes, not peak memory. [IBM files](https://huggingface.co/ibm-granite/granite-4.2-3b-GGUF/tree/main)
Ministral offers native JSON/function calling, text/image input and 256K context. [Mistral card](https://huggingface.co/mistralai/Ministral-3-3B-Instruct-2512-GGUF)
Phi-4-mini has text/function calling and 128K context; Microsoft notes hallucinated function names/URLs. [Microsoft card](https://huggingface.co/microsoft/Phi-4-mini-instruct)
SmolLM3 offers open training details and configurable reasoning; older BFCL scores are not BFCL-v4. [SmolLM3 card](https://huggingface.co/HuggingFaceTB/SmolLM3-3B)
Llama 3.2 supplies an established compact baseline under its custom licence. [Meta card](https://huggingface.co/meta-llama/Llama-3.2-3B-Instruct)

## Advanced compressed models: separate research experiment
PrismML Bonsai-27B is Apache-licensed and derived from Qwen3.6-27B.
Publisher reports roughly 3.9 GB weights and 5.2 GB peak model memory at 4K context.
It needs a special llama.cpp fork and leaves limited room on an 8 GB total-memory machine.
Its publisher evaluations show instruction/tool degradation against the base model.
Treat it as an experiment, not the dependable MVP default. [Publisher card](https://huggingface.co/prism-ml/Bonsai-27B-gguf)
Newer Ternary Bonsai 2 27B has 5.95 GB compact language weights before runtime/context/OS.
It needs vendor-specific kernels and is outside the comfortable 8 GB baseline. [Publisher card](https://huggingface.co/prism-ml/Ternary-Bonsai-2-27B-gguf)

## Provisional evaluation order
1. **Qwen3.5-4B Q4:** general text, brand drafting and constrained rewriting challenger.
2. **Gemma 4 E4B LiteRT-LM:** equally important when the target platform fits; image/audio attraction.
3. **LFM2.5-2.6B Q4:** compact structured-output challenger, subject to licence fit.
4. **Granite 4.2-3B Q4/Q5:** compact Apache alternative.
5. **Gemma E2B / Qwen3.5-2B:** possible fallback after measured quality and memory checks.
This order is not a measured creative-writing ranking and may change with device/task answers.
Load one model at a time; avoid shipping four concurrent runtimes or models.

## Evaluation and acceptance gates
Use 60–100 representative FSS/personal/NexSteps examples with separate brand playbooks.
Include source-grounded summaries, brand rewrites, platform variants, and strict-schema metadata extraction.
Test missing information, conflicting instructions and malicious instructions embedded in source material.
Add image captions/alt text and voice-note transcription only if those are release-one tasks.
Measure blind user preference, editing effort, invented claims, omitted facts and constraint adherence.
Measure schema-validity rate and recovery; tool support is not a guarantee of valid/safe arguments.
Use constrained generation plus application validation for machine-readable results.
Measure cold load, first token, complete-task time, peak memory, sustained speed and battery impact.
Start with 2K/4K context experiments, bounded output, single concurrency and text-first requests; increase context only after memory and latency gates pass.
These are proposed application limits, not claims of equivalent quality to long-thinking benchmark runs.
Accept only artifacts that meet the agreed latency/memory/quality gates on the actual target devices.
Keep an AI-unavailable state: drafting/calendar/manual work must remain usable when inference fails.
Never let draft-generation output independently approve or publish a post.

## Pending user decisions
- Exact 8 GB devices, OS, processor, integrated/discrete GPU and whether RAM means total system memory.
- AI on each device, in the browser, or on one shared FSS computer/server.
- Acceptable waiting time for a draft and whether AI must work away from the shared computer/offline.
- First-release AI tasks: rewriting, ideation, repurposing, extraction, image analysis and/or voice notes.
- Meaning of free: no API charges, no model licence charge, or no extra hardware/hosting budget.
- Whether unrestricted future public distribution should eliminate revenue-conditioned licences now.

## Research limitation
Only publisher/runtime primary sources were used; many capability comparisons are publisher-reported.
Benchmark versions, prompts, thinking budgets, precisions and hardware differ.
No source establishes social engagement outcomes, factual reliability guarantees or FSS brand fidelity.
No claimed latency, memory or writing-quality result in this memo was measured on the user’s hardware.
