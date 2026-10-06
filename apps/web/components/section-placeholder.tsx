type SectionPlaceholderProps = Readonly<{ title: string }>;

export function SectionPlaceholder({ title }: SectionPlaceholderProps) {
  return (
    <section className="placeholder-panel" aria-labelledby="section-title">
      <span className="eyebrow">PLANNED WORKSPACE</span>
      <h1 id="section-title">{title}</h1>
      <p>
        This area is not enabled in this build. No account content has been
        loaded.
      </p>
      <p className="privacy-note">
        <span aria-hidden="true">●</span> The preview uses synthetic examples
        only.
      </p>
    </section>
  );
}
