# Cadence build delivery evidence

Use with the mandatory step gate in [AGENTS.md](../AGENTS.md) and [BUILD.md](../BUILD.md). A step is complete only after its current-revision checks pass, the host reports it merged, and its merge commit is recorded. Recheck live host state before resuming. Do not begin a row after the current one until that evidence exists.

| Step | State | PR / base | Checked revision and CI | Review and merge evidence | Blocker / next permitted action |
| --- | --- | --- | --- | --- | --- |
| 0.1 | Locally verified; publishing first PR | Private `FSS-Ltd/cadence-app`; base `main` initialized at `ef891c3afa5654a55a440523037ad7c6702b5ae9`; PR not yet opened | `node scripts/verify-build-plan.mjs` passed; `git diff --cached --check` passed; sensitive-key-pattern filename scan found no matches. Gitleaks/history scan awaits GitHub CI because the local scanner is unavailable. | Host CI, base protection, review and merge are unverified. | Push the full 0.1 foundation, open its PR against `main`, require successful current-revision checks and independent review, verify base protection, then record host evidence. Only then may 0.2 start. |
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
