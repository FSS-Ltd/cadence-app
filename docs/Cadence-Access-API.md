# Membership and entitlement API

Step 1.2 supplies server/database boundaries. Use synthetic records until the
step 1.8 readiness gate passes. No invitation emails, billing, OAuth connection
or public onboarding are enabled by this API.

## Runtime setup

Provision distinct development, preview and production logins through trusted
database administration. The application login must be `NOINHERIT NOSUPERUSER
NOCREATEDB NOCREATEROLE NOBYPASSRLS`, granted only `cadence_command`, with no
ownership of application objects, direct table privileges or other memberships.
Store its connection string as `CADENCE_COMMAND_DATABASE_URL` in the environment
secret store. Never use `postgres`, the webhook service role, or an operator
credential here. The driver rejects privileged role membership before commands,
uses verified TLS remotely and disables prepared statements for transaction
pooling. Configure the exact environment origin in `CADENCE_APP_ORIGIN`.

Clerk environment keys, third-party issuer integration, protected authentication
policy, internal identity mapping and initial workspace/plan assignment must be
provisioned separately. Missing configuration fails closed. The server verifies
the token, checks the live Clerk session and verified primary email, and passes
only the subject, session ID and factor ages to a transaction. Postgres resolves
the internal actor, enforces the pilot/MFA policy and rechecks membership after
the workspace lock. Roles and entitlements never come from browser metadata.

Every command uses a transaction-local role and actor/claims configuration, with
5-second statement and 3-second lock timeouts. Commit and rollback clear that
context. Authentication evidence older than 30 seconds is rejected before and
after connection acquisition; first-factor authentication must be within ten
minutes. Required MFA is determined by protected database policy.

## Interface

`GET /api/v1/workspaces/{workspaceId}/access` returns a bounded read model.
`resource` accepts `summary` (default), `members`, `invitations` or `destinations`.
List requests accept a UUID `after` cursor and integer `limit` from 1–100
(default 50). Continue with the returned `nextCursor` until null. Membership
and invitation listings require owner/admin access; destination listings include
only accounts visible to the current member. Invitations expose no secret hash.

`POST` to the same route requires the configured same-origin `Origin` header,
JSON content type and a body of at most 16 KiB. Shared strict Zod contracts in
`packages/contracts/src/access.ts` are the authoritative field definitions.
Unknown fields, actor overrides, plan grants and unsupported networks are rejected.

| Action | Additional fields besides `action` and UUID `requestId` |
| --- | --- |
| `member.role` | `userId`, `expectedVersion`, `role` |
| `member.remove` | `userId`, `expectedVersion` |
| `invitation.issue` | `recipientId`, `role`, `validHours` (1–168) |
| `invitation.revoke` | `invitationId`, `expectedVersion` |
| `invitation.accept` | `invitationId`, `secret` |
| `destination.activate` | `provider`, `externalIdentity`, `expectedVersion` (0 for new) |
| `destination.disable` | `destinationId`, `expectedVersion` |
| `destination.grant` | `destinationId`, `userId`, `expectedVersion`, `allowed` |

An invitation targets an existing verified internal identity. Its first successful
response includes a cryptographically random one-use acceptance secret; Postgres
stores only the SHA-256 hash. An idempotent issue retry returns
`kind: invitation_replayed` and `recovery: revoke_and_reissue`, never a replacement
secret for the old hash. If the first response is lost, revoke the returned
invitation and issue a new invitation with a new request ID. Pass secrets only in
request bodies and memory; never use URL parameters, logs or browser persistence.

Other successful commands return `kind: committed`, object `id`, `version` and
`replayed`. Reusing a request ID with different command parameters conflicts.
Refresh the relevant read model after `VERSION_CONFLICT`; do not silently overwrite
another administrator's changes. Member removal revokes destination grants and
subsequent authorised work while retaining private-source ownership and history.

Responses, including errors, use `private, no-store` and vary by authentication.
Errors contain only an allow-listed `code`: authentication/access errors use
401/403, invalid input 400, oversized bodies 413, domain conflicts 409 and
unavailable infrastructure 503. Raw SQL, SDK errors and submitted values are never
returned or logged. This unit introduces no content or contact-data telemetry.

## Plan administration and retention

Plan catalog/assignment writes are inaccessible to the web command login.
Separately authorised operations use the `cadence_operator` role and the private
preview/assignment functions with an expected version, reason code and explicit
retained destination selection. Do not give this role to the application login
or expose those functions through a user API. Downgrades reject unsafe capacity
reductions, disable excluded destinations and retain content/history. Solo-plan
collaboration allowances remain unset; absence denies new invitations.

Minimal audit and idempotency records carry a 180-day expiry. Invitations release
reserved capacity when expired or revoked. Scheduled physical cleanup and erasure
are part of step 1.8 and must pass before real content is admitted. No production
retention execution is claimed by this step.

## Verification and rollback

Run repository format, lint, type, unit and build commands. CI additionally resets
the disposable Supabase database, runs SQL permission/tenant/quota tests and real
concurrent admissions, probes direct REST/Storage denial, and exercises the actual
restricted Node driver. CI-generated schema types must exactly match the checked-in
file. Local SQL tests require a running Docker daemon.

The migrations are additive and grant explicit function entry points. Deploy
migrations before enabling the API configuration; test on disposable data first.
If a rollout fails, remove the command connection configuration to fail closed
and roll back the app. Preserve database/audit history and use a reviewed forward
fix rather than dropping tables containing records.
