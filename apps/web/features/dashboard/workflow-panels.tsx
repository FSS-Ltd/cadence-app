import Link from "next/link";

export function NextStepsPanel() {
  return (
    <section className="surface-panel" aria-labelledby="next-steps-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">A GOOD PLACE TO BEGIN</p>
          <h2 id="next-steps-title">What to do next</h2>
        </div>
        <span className="panel-icon" aria-hidden="true">
          ◇
        </span>
      </div>
      <ul className="next-step-list">
        <li className="next-step-item">
          <span className="step-marker step-marker-accent" aria-hidden="true">
            1
          </span>
          <div>
            <strong>Shape an idea into a draft</strong>
            <p>
              Planned: start with a private draft. Sharing needs your approval.
            </p>
          </div>
          <Link className="small-action" href="/create">
            Start draft <span aria-hidden="true">→</span>
          </Link>
        </li>
        <li className="next-step-item">
          <span className="step-marker step-marker-muted" aria-hidden="true">
            2
          </span>
          <div>
            <strong>Review what you plan to share</strong>
            <p>
              Planned: approve each destination and exact revision before
              sharing.
            </p>
          </div>
          <Link className="small-action" href="/review">
            See review <span aria-hidden="true">→</span>
          </Link>
        </li>
      </ul>
    </section>
  );
}

export function PublishingRadar() {
  return (
    <section className="surface-panel" aria-labelledby="radar-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">SCHEDULE</p>
          <h2 id="radar-title">Today’s publishing radar</h2>
        </div>
        <Link className="text-link" href="/calendar">
          Calendar <span aria-hidden="true">→</span>
        </Link>
      </div>
      <div className="quiet-empty-state">
        <span className="empty-state-icon" aria-hidden="true">
          ◷
        </span>
        <div>
          <strong>Nothing is scheduled</strong>
          <p>
            Accepted handoffs will appear here with their destination and
            approval status. No post is sent from this preview.
          </p>
        </div>
      </div>
    </section>
  );
}
