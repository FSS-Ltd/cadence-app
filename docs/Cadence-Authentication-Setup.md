# Cadence authentication setup

Step 1.1 uses Clerk for credential, session and MFA flows; Postgres remains the
source of truth for account status, the exact closed-pilot allow-list and live
workspace membership. Configure separate Clerk and Supabase environments for
local, preview and production. Keep local values in the ignored
`apps/web/.env.local`; configure deployed values in the corresponding hosting
environment. The repository contains names only in `apps/web/.env.example`.

## Clerk configuration

- Disable open sign-up. Invite only the two approved pilot identities.
- Require verified email addresses. The app checks the current Clerk user and
  Postgres keeps only a verified/unverified boolean, not an email address.
- Configure Clerk's supported Supabase third-party integration so session
  tokens include `role: authenticated`; register the matching Clerk issuer in
  each isolated Supabase environment. The local CLI stack intentionally has no
  example issuer because Supabase fetches the issuer's discovery document at
  startup; add the real environment-specific issuer only when that Clerk tenant
  exists.
- Create a signed Clerk webhook for `user.created`, `user.updated` and
  `user.deleted`; set its signing secret in the server environment. The route
  verifies Svix signatures/timestamps, records delivery IDs idempotently and
  never logs or stores the event body or email address.
- Configure TOTP and backup-code recovery in Clerk. Exercise sign-in and
  security settings in both `closed_pilot` and `require_mfa` modes. Public
  onboarding remains blocked until the paid MFA policy is enabled and its
  exception is removed.

Clerk session tokens are forwarded server-to-server to the narrow
`auth_api.current_session_access` RPC with `Cache-Control: no-store`. Browser
access still passes Postgres RLS; the service role key is used only by the
signature-verified webhook route and is never sent to a browser. No credentials,
names, emails, content or client records belong in Clerk metadata.

## Supabase configuration and live provisioning

Expose only `auth_api` in addition to Supabase's default API schemas. Keep
`private` out of PostgREST's exposed schemas. Apply migrations and verify the
Clerk issuer integration before exercising a real Clerk JWT. Configure the
protected `private.access_policy` row and exactly two `private.pilot_identities`
through a separately reviewed operator procedure; migrations intentionally do
not contain real identity IDs or seed an access policy. A missing or invalid
policy denies access.

The webhook's identity table contains an internal UUID, immutable Clerk subject,
email-verification boolean and disabled timestamp. It stores no email, name,
phone, Clerk payload, cookie, token, password or invitation. A deletion marker
contains a one-way SHA-256 digest of the Clerk subject; a delayed create/update
cannot re-enable it. Operational webhook receipts expire after 180 days.

Before admitting any real source content, complete step 1.8's backup, erasure,
processor and recovery gates. A green application build alone does not mean
Clerk, MFA, regional hosting, webhook delivery or processor controls are live.
