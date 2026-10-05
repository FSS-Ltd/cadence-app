# Cadence build delivery evidence

Use with the mandatory step gate in [AGENTS.md](../AGENTS.md) and [BUILD.md](../BUILD.md). A step is complete only after its current-revision checks pass, the host reports it merged, and its merge commit is recorded. Recheck live host state before resuming. Do not begin a row after the current one until that evidence exists.

| Step | State | PR / base | Checked revision and CI | Review and merge evidence | Blocker / next permitted action |
| --- | --- | --- | --- | --- | --- |
| 0.1 | PR open; CI green; main protection awaits GitHub step-up authentication | [#1](https://github.com/FSS-Ltd/cadence-app/pull/1) against `main`; private repository | Revision `be57f83fa20d708e686e964c06024df0cc8c2026`; [run #2](https://github.com/FSS-Ltd/cadence-app/actions/runs/37324697859): Documentation and plan gates and Secret scan both passed. Run #1 exposed the Gitleaks organization-license requirement; the follow-up uses the official CLI at a fixed version and SHA-256. | No independent review yet. A `main` ruleset is prepared with one approval, resolved conversations, current-revision CI, no bypass, and blocked force-push/deletion; GitHub requested account step-up before saving it. | Complete step-up authentication in the open GitHub settings page, verify the active ruleset, and obtain independent review. Only after a host-reported merge may 0.2 start. |
| 0.2–5.2 | Planned | — | — | — | Not started. Progress one row at a time only after predecessor merge evidence. |

## Step 0.1 scope and acceptance

Create a Git baseline, privacy-first architecture/retention/recovery records, protected-base and environment-separation setup, and a low-permission CI secret/document check. Preserve the supplied research bundle. The eventual default repository visibility should be private. Development, preview and production credentials must be separate; preview publishing stays disabled. This setup does not provision infrastructure or accept real user information.

| Check | Local evidence |
| --- | --- |
| Preserve imported documentation | Original `docs/FILE-MANIFEST.json` hashes verified before edits in the preceding review; edited requirements, contracts and plan are intentional changes. |
| Secret scan | A narrow Google-key-format search returned no file matches; this is not a replacement for Gitleaks. Gitleaks is configured to scan current and historical content on PR/push. |
| Formatting and integrity | `git diff --cached --check` passed; `node scripts/verify-build-plan.mjs` passed (21 ordered steps all have privacy acceptance). |
| CI on latest revision | Pending repository creation and PR. |
| Base protection | Pending remote setup. Require PR, named required CI success, reviews/conversation resolution and deny force-push/deletion; no bypass. |
| Merge | Pending host-reported merge SHA. |
