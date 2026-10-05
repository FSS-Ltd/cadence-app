# Cadence build delivery evidence

Use with the mandatory step gate in [AGENTS.md](../AGENTS.md) and [BUILD.md](../BUILD.md). A step is complete only after its current-revision checks pass, the host reports it merged, and its merge commit is recorded. Recheck live host state before resuming. Do not begin a row after the current one until that evidence exists.

| Step | State | PR / base | Checked revision and CI | Review and merge evidence | Blocker / next permitted action |
| --- | --- | --- | --- | --- | --- |
| 0.1 | PR #1 merged; CI passed; delivery gate incomplete because `main` is unprotected and no independent review was recorded | [#1](https://github.com/FSS-Ltd/cadence-app/pull/1) merged into `main` at `5c691f19957a4f5229669bd37f4481e24d1cb57f`; private repository | PR head `a073b9a26940418570d5abe899510323893de3a7` passed [run #2](https://github.com/FSS-Ltd/cadence-app/actions/runs/37324697859). The merge commit passed [run #3](https://github.com/FSS-Ltd/cadence-app/actions/runs/37359687604): Documentation and plan gates and Secret scan. Run #1 exposed the Gitleaks organization-license requirement; the follow-up uses the official CLI at a fixed version and SHA-256. | GitHub reports no reviews on PR #1. On 2026-10-05, repository Settings showed no active rulesets and no classic branch protections. An active ruleset targeting the default branch is prepared with one approval, stale-approval dismissal, approval of the latest push, resolved conversations, up-to-date required checks, no bypass, and blocked force-push/deletion; GitHub's account step-up prompt remains open and the ruleset is unsaved. | Complete GitHub account verification in the open settings tab, verify the active ruleset, and obtain independent review. Do not start 0.2 before the full step 0.1 gate is satisfied. |
| 0.2–5.2 | Planned | — | — | — | Not started. Progress one row at a time only after predecessor merge evidence. |

## Step 0.1 scope and acceptance

Create a Git baseline, privacy-first architecture/retention/recovery records, protected-base and environment-separation setup, and a low-permission CI secret/document check. Preserve the supplied research bundle. The eventual default repository visibility should be private. Development, preview and production credentials must be separate; preview publishing stays disabled. This setup does not provision infrastructure or accept real user information.

| Check | Local evidence |
| --- | --- |
| Preserve imported documentation | Original `docs/FILE-MANIFEST.json` hashes verified before edits in the preceding review; edited requirements, contracts and plan are intentional changes. |
| Secret scan | GitHub Actions full-history Gitleaks scan passed on PR head `a073b9a` and merge commit `5c691f1`. A narrow Google-key-format search also returned no file matches; that search is supplementary only. |
| Formatting and integrity | `git diff --check` passed; `node scripts/verify-build-plan.mjs` passed (21 ordered steps all have privacy acceptance). |
| CI on merged revision | GitHub Actions run #3 on merge commit `5c691f1` passed both Documentation and plan gates and Secret scan. |
| Base protection | Not configured. Both ruleset and classic branch-protection settings were empty when checked. Saving the prepared active ruleset is blocked by GitHub account step-up authentication. |
| Review | PR #1 has no recorded reviews; the required independent approval remains outstanding. |
| Merge | GitHub reports PR #1 merged into `main` at `5c691f19957a4f5229669bd37f4481e24d1cb57f`. This merge does not satisfy the remaining review and base-protection gates. |
