import { notFound } from "next/navigation";
import { SectionPlaceholder } from "@/components/section-placeholder";
import { CaptureForm } from "@/components/library/capture-form";
import { LibraryIndex } from "@/components/library/library-index";
import { SourceRecovery } from "@/components/library/source-recovery";
import Link from "next/link";

const sections: Record<string, string> = {
  library: "Library",
  create: "Create",
  review: "Review",
  calendar: "Calendar",
  learn: "Learn",
  settings: "Settings",
};

type SectionPageProps = Readonly<{ params: Promise<{ section: string }> }>;

export default async function SectionPage({ params }: SectionPageProps) {
  const { section } = await params;
  const title = sections[section];
  if (!title) notFound();

  if (section === "create") return <CaptureForm />;
  if (section === "library") return <LibraryIndex />;
  if (section === "settings")
    return (
      <div className="page-stack">
        <section className="surface-panel">
          <p className="eyebrow">WORKSPACE SETTINGS</p>
          <h1>Settings</h1>
          <p>Manage your account security and access to private material.</p>
          <Link className="button-secondary" href="/account/security">
            Account security
          </Link>
        </section>
        <SourceRecovery />
      </div>
    );

  return <SectionPlaceholder title={title} />;
}
