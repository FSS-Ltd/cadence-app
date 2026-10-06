import { notFound } from "next/navigation";
import { SectionPlaceholder } from "@/components/section-placeholder";

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

  return <SectionPlaceholder title={title} />;
}
