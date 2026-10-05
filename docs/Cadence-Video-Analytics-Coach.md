# Cadence — video analytics coach

Product and engineering specification, 5 October 2026. Planning only: no application, provider access, model or performance evaluation has been implemented.
Read with the [engineering contracts](Cadence-Engineering-Contracts.md), [AI roadmap](Cadence-AI-Capability-Roadmap.md) and [main plan](plans/2026-10-05-cadence.md).

## Product decision and scope

Explain what a video's available results mean, show where attention changes, connect that window to the correct video/transcript where possible, and suggest a specific next experiment.
Free now covers three selected networks with one account per network (three total) and permits limited AI alt-text generation and analytics when those features are funded and released.
Creator and above retain the broader AI catalogue. Funding deferral remains in force: prepare this feature's contracts and deterministic reporting now, activate model interpretation only after evaluation and budget gates pass.
Free analytics includes explanations, evidence-linked hypotheses and proposed experiments. Generating replacement captions, hooks or scripts is a separate Creator-and-above content task; labelling a drafting task “analytics” must not bypass its entitlement.
The proposed Free allow-list is `alt_text`, `analytics_summary`, `period_comparison`, `topic_format_learning` and the new `video_retention_diagnosis`; each still needs its own allowance, release and source-use checks. Do not unlock all insights-family tasks merely because they share an output envelope.
The coach is conditional on the actual data supplied. Neither launch-network availability nor an account connection proves access to retention curves, skip rates or transcripts.

Current documented route assessment, subject to real grants and response validation:

| Network | Initial evidence route and limitation |
| --- | --- |
| TikTok | Approved Accounts API documents retention by second; Display API only supplies basic counts. Timed diagnosis requires the approved route and an actual usable response. |
| Instagram | Native retention exists; inspected SDK supplies watch/skip candidates without a retention-curve field. Automatic timestamp analysis remains unverified. |
| Facebook | Native retention exists; current organic Reel API bins and usable caption-track access remain unverified. |
| LinkedIn | Inspected member/organization APIs give different aggregate watch metrics, without timeline bins; API-derived AI use needs a separate policy check. |
| X | Playback quartiles give broad intervals; paid API reads remain outside the current budget. |
| YouTube, later | Owner-authorised analytics provides 100 retention intervals; caption text requires separate permission and a usable aligned track. |

See [Meta access evidence](research/2026-10-05-video-diagnostics-meta.md) and [other-network access evidence](research/2026-10-05-video-diagnostics-network-access.md). Permitted owner-supplied evidence can support richer analysis where actually available; importing data does not erase its origin or restrictions. Do not promise every native dashboard has a downloadable retention export.

## User experience

Each diagnosis presents four separate parts in plain language:

1. **What happened:** a computed observation, named metric definition, sample/window and selectable graph interval.
2. **What it could mean:** plausible interpretations and credible alternatives, with the strength and limits of evidence.
3. **What to try next:** one editable experiment, the change to test and the measurement that would help assess it.
4. **Evidence and limits:** data source, fetch time, paid/organic status, timing resolution, transcript alignment and missing inputs.

Selecting an interval seeks the authorised video preview to that range and highlights overlapping transcript lines. Show an interval such as **00:12–00:15** when the source only resolves three-second bins; never invent an exact exit at 00:13.4.
When no aligned transcript exists, retain the numeric diagnosis and let the owner inspect the video manually. Never fabricate speech from a retention graph.
The graph has an equivalent data table, keyboard navigation, accessible labels and explanations that do not depend on colour. Empty, delayed, stale, denied and unsupported states explain what is available and the next useful action.
Accepting an experiment saves a scoped proposal. Editing the video, creating a revision, approving and publishing remain explicit user actions through existing services.

## Evidence that must travel with the result

| Record | Minimum information |
| --- | --- |
| Metric snapshot | Workspace/account/publication, source/reference, metric definition/version, measured window, fetch time, post age, format, video duration and paid/organic/mixed status. |
| Retention series | Ordered time intervals, values/units, denominator or explicit unknown status, source resolution and whether values are absolute retention, relative retention or another definition. |
| Skip/viewed metric | Native metric name, numerator/denominator definitions where known, eligibility/start rule, cohort/window and value/units; unknown definitions remain visible. |
| Comparison cohort | Same compatible metric definition, format/duration band, audience context, post-age/window and paid/organic class; inclusion policy/version and sample counts. |
| Video identity | Immutable publication revision and asset checksum/duration; provider post identity; evidence that the analysed version matches the published timeline. |
| Transcript | Source and permission, exact asset/version, language, timed segments, ASR/manual provenance, confidence where supplied and owner corrections. |
| Timeline mapping | Verified mapping from transcript/source-video time to published-video time, including trims, cuts and any offsets; version and verification status. |
| Diagnosis | Snapshot IDs, fact IDs, comparison/policy versions, alignment status, hypotheses, alternatives, proposed experiment and model/task version when applicable. |

Different platforms' similarly named rates are not automatically comparable. Do not merge starts, impressions, views, skips and viewers into one denominator or infer a skip rate from a curve without the matching definition.
Even within one platform, combine skip and retention evidence only when their windows and cohorts are compatible. If this cannot be established, explain each separately.
Track imported exports and owner-entered observations distinctly from verified API observations; importing a file does not remove source-use restrictions.
Provider-specific sources, scopes, permitted AI uses and availability require the accompanying research and implementation verification. Unsupported data is absent, not zero.

## Deterministic facts before interpretation

Application code validates evidence, computes rates/deltas, locates candidate attention-change intervals and selects comparison cohorts under a versioned policy. The model does not calculate figures, choose thresholds, infer missing points or promote a hypothesis to an observed fact.
Define minimum sample, freshness, comparable-cohort and change-detection policies from the measured pilot before release; no universal “good retention” or “high skip” threshold is promised here.
Retain raw observations. If an explicit smoothing rule is used, disclose it and keep the original series available; do not increase the apparent source resolution.
Quartile milestones identify broad intervals; average watch time alone identifies no drop-off timestamp. Do not reconstruct a detailed retention curve from either. A genuine measured zero with an adequate sample is different from a missing value or zero viewers.
Zero/unknown denominators produce an unavailable rate. Replays can affect some metric definitions: validate against the source definition rather than forcibly treating every value above 100% or local increase as an error.
Candidate intervals are evidence for investigation. Aggregate viewer behaviour cannot establish that one line caused viewers to leave, identify an individual viewer's reason or exclude audience/distribution effects.

| Evidence pattern | Explainable interpretation and next test |
| --- | --- |
| Early drop plus compatible high skip/viewed-away measure | “The opening is a candidate to test.” Alternatives include audience mismatch, slow first visual, misleading title, silent opening or distribution changes. Test a clearer first frame/opening against a comparable baseline. |
| Local mid-video drop | Identify the measured interval and overlapping speech/visual changes. A long setup, topic shift or difficult explanation may coincide. Test a tighter version or clearer transition; do not assert that the quoted line caused exits. |
| Decline after an owner-confirmed payoff, followed by a long outro | Viewers may have received what they needed. Offer a shorter ending or earlier CTA experiment and evaluate completion alongside the video's actual goal; completion alone does not measure usefulness. |
| Retention increase or repeat-viewing signal | A useful, confusing or visually dense moment may invite repeat viewing, or the metric may use a replay-sensitive denominator. Confirm the definition and inspect the segment; a spike is not proof of enjoyment. |
| Weak, stale, incompatible or missing data | Show what can be observed and why a diagnosis cannot yet be supported. Request a permitted newer snapshot, aligned asset or comparable window rather than manufacture an explanation. |

“High”, “unusual” and “better” require a declared reference or policy. Prefer “larger opening decline than your comparable posts” when that cohort genuinely exists; otherwise describe the measured change without a quality label.

## Transcript and visual alignment

Use the exact retained upload/revision when it matches the published edit. Provider transcoding may change bytes; identity verification must consider the post/revision, duration and verified timeline instead of expecting a provider transcode to share the original checksum.
If the published version was trimmed, cut, reordered or otherwise edited outside Cadence, require a verified timeline mapping or a transcript of that final version before attaching source lines.
Captions, an earlier draft script and an ASR transcript are distinct sources. Record offsets, corrections and uncertain timing; do not assume on-screen caption timestamps identify the words actually spoken.
Start with owner-supplied permitted timed transcripts. Free analytics does not unlock the generic `transcript_capture` task; a later analytics-specific ASR dependency needs its own funding, modality, source-policy and usage gates and does not confer unrestricted transcription or repurposing access.
Attach every overlapping segment to the measured interval, with enough neighbouring context to avoid blaming an isolated phrase. Show the alignment range and confidence supplied by the source; do not invent a statistical confidence percentage.
Speech may be absent or incidental. Manual annotations can record an owner-observed visual change, cut, overlay, scene or payoff. Video/frame inference is a later modality gate and is not implied by text transcript access.
Unverified alignment permits general numeric interpretation but suppresses timestamp-linked quotation. A new video edit invalidates its prior mapping, transcript association and diagnosis cache.

## Proposed module boundaries

| Proposed module | Responsibility |
| --- | --- |
| `packages/analytics/metric-definitions.ts` | Source-native definitions, compatible units/cohorts and versioned normalisation rules. |
| `packages/analytics/video-evidence.schema.ts` | Runtime schemas and exported `VideoDiagnosisInput`/fact/report types for snapshots, transcript bindings and timeline mappings; proposed workspace export `@cadence/analytics/video-evidence`. |
| `packages/analytics/retention-facts.ts` | Pure deterministic calculation, quality gates, comparison selection and bounded fact IDs. |
| `packages/analytics/transcript-alignment.ts` | Validate mappings and resolve overlapping transcript segments; no invented timing. |
| `packages/ai/tasks/video-retention-diagnosis.ts` | Proposed stable task key `video_retention_diagnosis`, analytics/insights family, input builder and structured output validator. |
| `apps/web/features/analytics/video-coach/` | Chart/table, evidence card, linked player/transcript and experiment review using shared UI primitives. |
| `apps/web/server/analytics/` | Thin authorised read/ingestion services, snapshot persistence and permission checks. |

These are proposed responsibilities for the initial repository structure, not existing files. Extend the shared task registry/output family deliberately; do not copy the old catalogue count into a new contract or create a second generation system.
Suggested storage: immutable metric snapshots/series, asset-bound transcript revisions, versioned timeline mappings, evidence-linked diagnoses and owner-accepted experiment records. All carry tenant scope; indexes follow account/publication/window and diagnosis input fingerprint.
Keep bulky video in private Storage. Apply source-use and retention policy to snapshots, transcripts and derived diagnoses; source deletion/revocation restricts cached results and future inference as required.
Every inference uses live membership, permitted account/source access, per-feature Free-or-higher entitlement, release/modality availability and allowance. No premium-suite boolean alone may admit this task.
Hosted and eventual offline interpretation consume the same validated facts. Offline processing still requires a valid entitlement grant and permitted cached evidence; it cannot silently fetch private provider data or switch to hosted processing.

## Data and API sketches

The new task's versioned insights schema needs more structure than a generic string list:

```ts
type TimeRange = { startMs: number; endMs: number };
type RetentionFact = {
  id: string; snapshotId: string; definitionId: string;
  observation: string; range?: TimeRange;
  values: readonly {
    label: string; value: number;
    unit: "percentage_points" | "percent" | "count" | "milliseconds" | "ratio";
  }[];
};
type VideoDiagnosisInput = {
  publicationId: string; assetId: string; revisionId: string; durationMs: number;
  facts: readonly RetentionFact[];
  definitions: readonly { id: string; nativeName: string; meaning: string;
    unit: string; denominatorMeaning: string | null }[];
  snapshots: readonly { id: string; sourceReference: string; fetchedAt: string;
    measuredFrom: string; measuredTo: string; sampleSize: number | null;
    population: "organic" | "paid" | "mixed" | "unknown"; limitations: readonly string[] }[];
  transcript: { status: "aligned"; assetId: string; revisionId: string;
    mappingVersion: string; language: string; segments: readonly {
      id: string; startMs: number; endMs: number; text: string;
    }[] } | { status: "missing" | "unaligned"; reason: string };
  policyVersion: string; comparisonCohortId: string | null; limitations: readonly string[];
};
type VideoDiagnosis = {
  kind: "video_retention_diagnosis"; facts: readonly RetentionFact[];
  interpretations: readonly {
    factIds: readonly string[]; hypothesis: string; alternatives: readonly string[];
    limitations: readonly string[]; transcriptSegmentIds: readonly string[];
  }[];
  experiments: readonly {
    factIds: readonly string[]; changeToTest: string; measureDefinitionId: string;
    comparisonPlan: string; limitations: readonly string[];
  }[];
};
```

The server constructs `VideoDiagnosisInput` from permitted snapshots and computed facts; it supplies actual structured values and segment IDs rather than reconstructable excerpt strings. A comparison-cohort ID refers only to a validated, accessible cohort; a missing cohort remains null. Snapshot/sample definitions remain source-qualified; unknown samples/denominators stay unknown. The publication/asset/transcript identity and mapping are checked before `status:"aligned"` is admitted.
The server owns `facts`; the interpretation provider returns only the bounded interpretation/experiment fields in the dedicated shared `AiProposal` branch. Merge verified facts after validation. Every cited fact/segment/metric definition must exist in the authorised input; no generated replacement facts are accepted.
Runtime schemas validate finite values, recognised definition-compatible units, `0 <= startMs < endMs <= durationMs`, bounded items/text and source-qualified identities. Numeric fields and units are produced by the deterministic service, never interpreted from generated prose.
`GET /api/v1/publications/{id}/video-analytics` proposes a scoped response containing data availability, verified snapshots, deterministic facts, alignment state and current permitted diagnoses. Return explicit reasons such as `RETENTION_NOT_AVAILABLE`, `INSUFFICIENT_DATA` or `TRANSCRIPT_ALIGNMENT_UNVERIFIED` without hiding usable partial data.
Reuse `POST /api/v1/ai/generations` with `feature:"video_retention_diagnosis"`, permitted evidence IDs and the shared idempotency mechanism. While deferred, return `422 FEATURE_NOT_RELEASED` and create no queued work or quota reservation.
On release, admission returns the normal generation run; reuse scoped status/cancel APIs. Accepting an experiment goes through a versioned proposal-acceptance service and does not automatically edit a media asset, schedule or publish.
Cache results only by the authorised evidence fingerprint plus definition/policy/task/model/alignment versions; permission revocation still overrides a matching cache key.

## Invented demonstration — not FSS data or a platform benchmark

For a hypothetical 30-second video, a compatible snapshot shows retention decreasing from 78% to 50% over **00:12–00:15**. Its skip measure has a known definition and compatible cohort; no measured audience benchmark is supplied.
The aligned transcript in that interval reads: “Before I show the result, here are three more things you need to know.” The video preview is available for owner inspection.
**Observed:** “Retention decreases by 28 percentage points across the 12–15 second interval. This sentence overlaps that interval.”
**Possible meaning:** “The extra setup may be delaying the result viewers expected. A visual change, a different audience or another part of the segment could also explain the decline; this graph cannot isolate the cause.”
**Next test:** “Try moving the result earlier or shortening this setup in a new draft. Compare the same retention definition and compatible post-age window, and check the video's intended outcome alongside completion.”
No claim of proven weak hook, causal line attribution, measured improvement or statistical significance follows from this invented example. A numerical skip example would need its own stated definition and evidence.

## Delivery tasks and release gates

1. **Prepare definitions and availability:** implement source contracts, metric snapshots and empty/unsupported states; fixtures reject unknown denominators, malformed bins, cross-tenant references and incompatible paid/organic windows.
2. **Build deterministic reporting:** pure functions and chart/table explain actual values; tests pin percentage-point versus percentage changes, interval resolution, stale/zero data, replay-sensitive series and reproducible comparison policies.
3. **Add verified timeline inspection:** asset-bound transcripts and mappings; tests reject wrong asset/revision, offset/cut mismatch, overlapping/invalid segments and unverified timestamp-linked quotes. Numeric reporting remains usable without speech data.
4. **Prepare the shared AI task:** register its proposed key, schema, per-feature entitlement, provenance and quota boundaries; fixture tests reject invented facts, unrecognised citations, premium drafting leakage and autonomous edit/post instructions. Production execution remains deferred.
5. **Evaluate funded explanations:** use real permitted videos with human-reviewed observations, aligned transcripts and intentionally incomplete examples; review explanation fidelity, uncertainty, actionable experiment quality and language clarity. Set measured latency/cost and evidence-quality thresholds before activation.
6. **Validate usefulness in the pilot:** record whether users understand the observation and accept/modify the experiment, then compare outcomes on compatible later posts. Treat observational changes as evidence for the next decision, not proof that Cadence caused growth.

Required negative tests include source consent revoked between admission/execution, plan/role change, stale cached diagnosis, cross-account evidence, misleading ASR, malicious transcript instructions, missing model modality, invalid output and exhausted allowance.
Actual per-network access, AI-permitted use, account grants, media matching and a real model must pass their own checks before public claims. This specification supplies none of those verifications.

Verification for this planning document: manual contract review, local-link checks, line-count and whitespace checks. No application checks, hardware/model trials, provider calls or real-data coaching evaluation were run.
