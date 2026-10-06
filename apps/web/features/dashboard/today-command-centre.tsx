import { BacklogPanel } from "@/features/dashboard/backlog-panel";
import { CadencePanel } from "@/features/dashboard/cadence-panel";
import { FocusCard } from "@/features/dashboard/focus-card";
import { PrivacyPanel } from "@/features/dashboard/privacy-panel";
import {
  NextStepsPanel,
  PublishingRadar,
} from "@/features/dashboard/workflow-panels";

export function TodayCommandCentre() {
  return (
    <div className="page-stack">
      <section className="welcome-row" aria-labelledby="today-title">
        <div>
          <p className="eyebrow">EXAMPLE STUDIO · TODAY</p>
          <h1 id="today-title">Good morning, Sample owner</h1>
          <p className="page-intro">
            A clear view of your ideas, reviews and next steps.
          </p>
        </div>
      </section>

      <FocusCard />

      <div className="command-grid">
        <div className="command-main-column">
          <NextStepsPanel />
          <PublishingRadar />
          <CadencePanel />
        </div>
        <aside
          className="command-side-column"
          aria-label="Workspace information"
        >
          <PrivacyPanel />
          <BacklogPanel />
        </aside>
      </div>
    </div>
  );
}
