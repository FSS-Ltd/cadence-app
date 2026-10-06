export function CadencePanel() {
  return (
    <section
      className="surface-panel cadence-panel"
      aria-labelledby="cadence-title"
    >
      <div className="panel-heading">
        <div>
          <p className="eyebrow">YOUR RHYTHM</p>
          <h2 id="cadence-title">Weekly cadence</h2>
        </div>
        <span className="panel-icon" aria-hidden="true">
          ↗
        </span>
      </div>
      <div className="cadence-illustration" aria-hidden="true">
        <svg viewBox="0 0 600 72" preserveAspectRatio="none" focusable="false">
          <path
            className="cadence-area"
            d="M0 56 C70 54 90 42 150 45 S230 70 300 48 S385 14 450 35 S530 49 600 10 V72 H0 Z"
          />
          <path
            className="cadence-line"
            d="M0 56 C70 54 90 42 150 45 S230 70 300 48 S385 14 450 35 S530 49 600 10"
          />
        </svg>
      </div>
      <p className="empty-caption">
        Illustrative curve only. Publishing insights will require a connected
        account; this preview collects no activity data.
      </p>
    </section>
  );
}
