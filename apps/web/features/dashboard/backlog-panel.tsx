import Link from "next/link";
import { PrivacyBadge } from "@/components/privacy-badge";
import { sampleDrafts } from "@/features/dashboard/sample-drafts";

export function BacklogPanel() {
  return (
    <section
      className="surface-panel backlog-panel"
      aria-labelledby="backlog-title"
    >
      <div className="panel-heading">
        <div>
          <p className="eyebrow">IDEAS</p>
          <h2 id="backlog-title">A few examples</h2>
        </div>
        <Link className="text-link" href="/library">
          Library <span aria-hidden="true">→</span>
        </Link>
      </div>
      <ul className="backlog-list">
        {sampleDrafts.map((draft) => (
          <li key={draft.title}>
            <span className="backlog-symbol" aria-hidden="true">
              {draft.network === "LinkedIn" ? "in" : "ig"}
            </span>
            <div className="backlog-copy">
              <span className="backlog-title">{draft.title}</span>
              <span className="backlog-source">Synthetic example</span>
            </div>
            <PrivacyBadge variant={draft.visibility}>
              {draft.visibility === "private" ? "Private" : "Shared excerpt"}
            </PrivacyBadge>
          </li>
        ))}
      </ul>
      <p className="empty-caption">
        These labels and ideas are fictional and are not saved as a user’s
        content.
      </p>
    </section>
  );
}
