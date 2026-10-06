import Link from "next/link";

export default function AccessDeniedPage() {
  return (
    <section className="denied-page" aria-labelledby="denied-title">
      <div className="denied-icon" aria-hidden="true">
        ⌑
      </div>
      <p className="eyebrow">ACCESS CHECK</p>
      <h1 id="denied-title">This workspace isn’t available to you.</h1>
      <p className="denied-copy">
        No private records were loaded. Access is granted by an explicit
        workspace invitation, not by workspace ownership alone.
      </p>
      <div className="denied-actions">
        <Link href="/" className="button-primary">
          Return to Today
        </Link>
        <Link href="/settings" className="button-secondary">
          Review access guidance
        </Link>
      </div>
      <p className="denied-footnote">
        If you believe this is a mistake, ask a workspace owner to verify your
        membership.
      </p>
    </section>
  );
}
