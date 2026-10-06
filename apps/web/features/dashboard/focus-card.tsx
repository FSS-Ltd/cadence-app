import Link from "next/link";

export function FocusCard() {
  return (
    <section className="focus-card" aria-labelledby="focus-title">
      <div className="focus-copy">
        <p className="eyebrow">PLANNED WORKFLOW</p>
        <h2 id="focus-title">Your next idea starts with you.</h2>
        <p>
          The planned workflow keeps drafts private until you approve what to
          share and where it goes.
        </p>
        <Link className="button-primary" href="/create">
          Start a draft <span aria-hidden="true">→</span>
        </Link>
      </div>
      <div className="focus-art" aria-hidden="true">
        <span className="focus-orbit orbit-one" />
        <span className="focus-orbit orbit-two" />
        <span className="focus-orbit orbit-three" />
        <span className="focus-sparkle">✳</span>
      </div>
    </section>
  );
}
