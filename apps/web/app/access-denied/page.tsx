import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";

export default function AccessDeniedPage() {
  return (
    <main className="auth-page" id="main-content">
      <section className="auth-card denied-page" aria-labelledby="denied-title">
        <div className="auth-brand-lockup">
          <BrandMark className="auth-brand-mark" />
          <span>Cadence</span>
        </div>
        <p className="auth-eyebrow">Workspace access</p>
        <h1 id="denied-title">This workspace isn’t available to you.</h1>
        <p className="denied-copy">
          No private records were loaded. Access is granted by an explicit
          workspace invitation, not by workspace ownership alone.
        </p>
        <div className="denied-actions">
          <Link href="/sign-in" className="button-primary">
            Return to sign in
          </Link>
        </div>
        <p className="denied-footnote">
          If you believe this is a mistake, ask a workspace owner to verify your
          invitation and account access.
        </p>
      </section>
    </main>
  );
}
