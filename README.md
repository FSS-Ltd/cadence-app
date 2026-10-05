# Cadence

Cadence is planned as a privacy-first social media planning and publishing application for FSS. This repository currently contains its requirements, design and engineering contracts; application code and infrastructure have not been created.

## Start here

- [Requirements and decisions](docs/Cadence-Requirements-and-Decisions.md)
- [Numbered implementation plan](docs/plans/2026-10-05-cadence.md)
- [Privacy architecture, data flow and retention](docs/Cadence-Privacy-Architecture.md)
- [Engineering contracts](docs/Cadence-Engineering-Contracts.md)
- [Delivery evidence and active gate](docs/Cadence-Delivery-Evidence.md)

## Privacy boundary

Use synthetic data in local, CI and preview environments. Do not put user, client-confidential or provider data into this repository. Never commit `.env` files, credential material, private source content, social account tokens or signed URLs. The `.gitignore` excludes common local-secret and generated paths; CI scans repository history for leaked secrets. A detected real credential must be revoked/rotated, not merely removed from the newest commit.

Cadence's identity provider is Clerk and its planned database/media services are Supabase Postgres/private Storage. No environment is configured yet. Authentication, storage, provider regions, backups and access policies must pass their numbered acceptance gates before any real data is admitted.

## Build and review

Each numbered step uses a dedicated branch and pull request. The PR template requires an explicit privacy/data impact and acceptance evidence. Do not start the next step until the current PR has passing applicable checks on its latest revision and is confirmed merged into the protected base. See [AGENTS.md](AGENTS.md) and [BUILD.md](BUILD.md).

The current documentation-only CI check is:

```sh
node scripts/verify-build-plan.mjs
git diff --check
```

Application-specific format, lint, type, unit, database, browser and production-build scripts will be defined with their relevant app/database build steps.
