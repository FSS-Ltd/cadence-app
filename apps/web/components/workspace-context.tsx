"use client";

import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import type { CurrentWorkspace } from "@/server/workspaces/current-workspace";

const WorkspaceContext = createContext<CurrentWorkspace | null>(null);

export function WorkspaceProvider({
  workspace,
  children,
}: Readonly<{ workspace: CurrentWorkspace; children: ReactNode }>) {
  return (
    <WorkspaceContext.Provider value={workspace}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace(): CurrentWorkspace {
  const workspace = useContext(WorkspaceContext);
  if (!workspace) throw new Error("Workspace context is unavailable");
  return workspace;
}
