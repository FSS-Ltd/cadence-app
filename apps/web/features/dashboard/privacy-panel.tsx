import Link from "next/link";
import { PrivacyBadge } from "@/components/privacy-badge";

export function PrivacyPanel() {
  return (
    <section
      className="surface-panel privacy-panel"
      aria-labelledby="privacy-title"
    >
      <div className="panel-heading">
        <div>
          <p className="eyebrow">PLANNED PRIVACY MODEL</p>
          <h2 id="privacy-title">Private by default</h2>
        </div>
        <span className="privacy-mark" aria-hidden="true">
          ◉
        </span>
      </div>
      <p className="panel-description">
        This shell has no authentication yet. When source protections ship,
        workspace ownership will not grant access to private captures.
      </p>
      <div className="privacy-example">
        <div>
          <span className="visibility-label">Original capture</span>
          <PrivacyBadge variant="private">Private</PrivacyBadge>
        </div>
        <div>
          <span className="visibility-label">Reviewed excerpt</span>
          <PrivacyBadge variant="shared">Shared by choice</PrivacyBadge>
        </div>
        <p>Sharing an excerpt never shares its source recording or notes.</p>
      </div>
      <Link className="text-link" href="/access-denied">
        Preview denied state <span aria-hidden="true">→</span>
      </Link>
    </section>
  );
}
