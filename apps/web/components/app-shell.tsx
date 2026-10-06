import type { ReactNode } from "react";
import {
  MobileNavigation,
  WorkspaceHeader,
} from "@/components/workspace-navigation";

export function AppShell({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="app-frame">
      <WorkspaceHeader />
      <main id="main-content" className="main-content" tabIndex={-1}>
        {children}
      </main>
      <MobileNavigation />
    </div>
  );
}
