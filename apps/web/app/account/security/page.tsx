import { UserProfile } from "@clerk/nextjs";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BrandMark } from "@/components/brand-mark";
import { getWorkspaceAccess } from "@/lib/auth/access";

export const dynamic = "force-dynamic";

export default async function SecuritySettingsPage() {
  const access = await getWorkspaceAccess();
  if (access.kind === "signed_out") redirect("/sign-in");
  if (access.kind !== "allowed" && access.kind !== "mfa_required") {
    redirect("/access-denied");
  }

  return (
    <main className="auth-page" id="main-content">
      <div className="security-layout">
        <Link className="auth-brand-lockup" href="/">
          <BrandMark className="auth-brand-mark" />
          <span>Cadence</span>
        </Link>
        <section className="security-intro" aria-labelledby="security-title">
          <p className="auth-eyebrow">Account security</p>
          <h1 id="security-title">Protect your workspace.</h1>
          <p>
            Keep your sign-in methods current. Cadence never stores your
            authentication credentials.
          </p>
        </section>
        <UserProfile
          routing="hash"
          appearance={{
            elements: {
              rootBox: "clerk-security-root",
              card: "clerk-security-card",
              navbar: "clerk-security-navbar",
            },
          }}
        />
      </div>
    </main>
  );
}
