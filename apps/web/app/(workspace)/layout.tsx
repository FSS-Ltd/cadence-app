import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { getWorkspaceAccess } from "@/lib/auth/access";
import { getCurrentWorkspace } from "@/server/workspaces/current-workspace";

export const dynamic = "force-dynamic";

export default async function WorkspaceLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const access = await getWorkspaceAccess();

  if (access.kind === "signed_out") redirect("/sign-in");
  if (access.kind === "mfa_required") {
    redirect("/account/security?required=mfa");
  }
  if (access.kind !== "allowed") redirect("/access-denied");

  const workspace = await getCurrentWorkspace();
  if (!workspace) redirect("/access-denied");
  return <AppShell workspace={workspace}>{children}</AppShell>;
}
