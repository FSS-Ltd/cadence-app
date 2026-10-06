# Cadence design implementation record

Stitch is the source of truth for Cadence UI/UX. Implementations should follow
the Stitch screen composition, visual hierarchy, type, color and interaction
patterns, while applying the per-step privacy gates and accessible web
conventions. Older recovered boards and research remain historical context.

## Source screens

| Screen | Stitch resource | Planned use |
| --- | --- | --- |
| S02 — Today / Command Centre | `projects/16855835926505388078/screens/0ff4d632f1eb4210a411cd70111d1271` | Step 0.3 command-centre layout and responsive application navigation. |
| S03 — Capture / Founder Light Mode | `projects/16855835926505388078/screens/fbc1c5496c174f11a525416fc2cb51e0` | Capture flow reference for the later private-source build step; not an enabled capture function in step 0.3. |

## Step 0.3 mapping

The Today screen's horizontal workspace navigation, greeting, featured focus
area and two-column set of task, schedule, cadence, privacy and idea panels map
to the synthetic shell in `apps/web`. Narrow screens use the agreed five-item
bottom navigation. The preview notice remains visible because this shell has no
identity integration and cannot safely accept real content.

Privacy and truthfulness take precedence over sample text shown in mockups.
Names, workspace/client identifiers, recording transcripts, account details,
metrics and posting claims in design references must not be copied into live
fixtures. Step 0.3 uses only clearly identified fictional labels and empty states;
it does not record, persist, publish or collect analytics. Its private/shared
examples explain the future visibility model and do not represent stored data.

The Capture screen's microphone, live transcription, client selection, source
visibility and consent details belong to the later private-capture step. Do not
enable those controls before its authorization, no-store, lifecycle, retention,
sharing and deletion gates are implemented and tested. Keep its design as the
visual reference when that step begins.
