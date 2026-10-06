# Cadence database and access foundation

This record defines the first database implementation unit, step 0.2. The
project is still synthetic-only: migrations contain fixture identities, while
the two real Clerk subjects, pilot workspace and any database connection
secrets must be provisioned through a protected operator path.

## Boundary

The Supabase Data API exposes only `public` and `graphql_public`; new public
objects are not automatically granted to API roles. Cadence records live in the
unexposed `private` schema. Clerk JWT verification and the Supabase third-party
Clerk issuer configuration are wired in step 1.1. Native Supabase account
registration is disabled. Policies read Clerk's signed `sub` claim and never
trust user-editable metadata.

The first migration creates internal user mappings, workspaces, memberships,
the closed-pilot/MFA policy, source records, versioned-purpose sharing grants
and an erasure ledger. Tenant-sensitive relationships use composite foreign
keys. Source categories admit personal drafts and client-confidential material;
there is no category for highly sensitive records. A workspace role does not
grant access to private source content. Only the creator or an explicitly
granted recipient can read an active source, and a grant must match one of that
source's permitted purposes.

`access_policy` is deliberately unseeded. Missing policy, missing membership,
missing Clerk mapping or an unknown identity denies access. In `closed_pilot`,
the policy names one pilot workspace and a deferred constraint trigger requires
exactly two allow-listed Clerk subjects at transaction commit. In
`require_mfa`, reads require Clerk's signed second-factor age claim to be
present and no more than 600 seconds old. Sensitive mutations still need fresh
session checks in the application command layer; that implementation belongs
to step 1.1.

## Database roles and pooled connections

`cadence_command` and `cadence_publisher` are `NOLOGIN`, `NOBYPASSRLS`,
non-superuser roles. The command role can read workspaces and update creator
sources or the requesting actor's erasure record, but cannot change workspace
identity, memberships, users, pilot policy, source grants or identity
allow-lists. The publisher role has no table or schema access until approved
publication snapshots exist. Neither role has a credential in this repository.
When deployed, a trusted server-only connection may assume the command role
only after it verifies a Clerk session; never grant either role to `anon`,
`authenticated` or Supabase `service_role`.
The built-in `postgres` administrative role can assume `cadence_command` for
database tests and operations; it is not a runtime application credential.

Commands set the verified Clerk JWT claims, `app.actor_id` and, for source
reads, `app.access_purpose` with transaction-local `set_config(..., true)` in
the same transaction that performs the operation. RLS maps the signed Clerk
`sub` to an internal user and requires that identity to match the actor context,
active membership and current pilot or MFA policy. A recipient can read a
shared source only for a purpose named in both the grant and the source's
permitted purposes. The database purpose values are `editorial_reuse`,
`excerpt_release`, `analytics` and `ai_proposal`; unknown transaction context
values deny shared reads. For source writes, RLS also requires the actor to
remain the creator. Share and revoke writes are withheld from the command role
until step 1.3 adds their audited domain command. The test script reuses one
PostgreSQL connection across two transactions to prove the actor context is
cleared at commit. No transaction should remain open during a provider call.

The `cadence-private` Storage bucket is private at creation. This step grants no
client object policy, so direct Storage reads and writes stay denied until
step 1.4 adds metadata-bound authorization and quarantine rules. This is a
deliberate safe baseline, not an upload-ready configuration.

## Verification and rollout

Synthetic pgTAP coverage exercises creator-private access, workspace-owner
denial, explicit sharing and revocation, two-identity pilot restriction,
MFA-required mode, missing-policy denial, tenant-consistent foreign keys,
direct-write denial and private Storage reads. CI boots an isolated Supabase
stack, resets from migrations, runs pgTAP, database lint and security advisors,
checks that private table/RPC schemas are rejected by the Data API, verifies
anonymous Storage listing is denied, then checks transaction-local actor and
purpose-context reset.

This migration creates local schema objects and a local bucket definition; it
does not link to or provision a hosted project. Production identity issuer,
real pilot subjects, protected server-role connection grants, regional project
settings, Clerk MFA settings and key custody remain unconfigured. No real user
or client content is permitted until step 1.8 passes.

Supabase no longer automatically exposes newly created public tables in new
projects by default; this repository also sets `api.auto_expose_new_tables =
false` explicitly. See the [Supabase changelog](https://supabase.com/changelog)
and [Clerk third-party integration guide](https://supabase.com/docs/guides/auth/third-party/clerk).
