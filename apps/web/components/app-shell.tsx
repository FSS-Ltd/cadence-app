import type { ReactNode } from "react";
import type { CurrentWorkspace } from "@/server/workspaces/current-workspace";
import { WorkspaceProvider } from "@/components/workspace-context";
import {
  MobileNavigation,
  WorkspaceHeader,
} from "@/components/workspace-navigation";

export function AppShell({
  children,
  workspace,
}: Readonly<{ children: ReactNode; workspace: CurrentWorkspace }>) {
  return (
    <WorkspaceProvider workspace={workspace}>
      <div className="app-frame">
        <WorkspaceHeader />
        <main id="main-content" className="main-content" tabIndex={-1}>
          {children}
        </main>
        <MobileNavigation />
      </div>
    </WorkspaceProvider>
  );
}
