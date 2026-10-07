import Link from "next/link";
import type { FormEvent } from "react";
import type { LibraryPage } from "@cadence/contracts/library";
import type { SourcePurpose } from "@cadence/contracts/sources";
import { sourcePurposeSchema } from "@cadence/contracts/sources";

type Resource = LibraryPage["resource"];
const resources: ReadonlyArray<{ value: Resource; label: string }> = [
  { value: "sources", label: "Captures" },
  { value: "excerpts", label: "Reviewed excerpts" },
  { value: "brands", label: "Brands" },
];
const purposes: ReadonlyArray<{ value: SourcePurpose; label: string }> = [
  { value: "editorial_reuse", label: "Editorial drafts" },
  { value: "excerpt_release", label: "Excerpt review" },
  { value: "analytics", label: "Private analytics" },
  { value: "ai_proposal", label: "Future AI proposals" },
];

export function LibraryControls({
  resource,
  purpose,
  searchText,
  onResourceChange,
  onPurposeChange,
  onSearchTextChange,
  onSubmit,
}: Readonly<{
  resource: Resource;
  purpose: SourcePurpose;
  searchText: string;
  onResourceChange: (resource: Resource) => void;
  onPurposeChange: (purpose: SourcePurpose) => void;
  onSearchTextChange: (text: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}>) {
  return (
    <>
      <header className="library-heading">
        <div>
          <p className="eyebrow">PRIVATE LIBRARY</p>
          <h1>Library</h1>
          <p>Only material you can access appears here.</p>
        </div>
        <Link className="button-primary" href="/create">
          + New capture
        </Link>
      </header>
      <div className="library-tabs" role="group" aria-label="Library section">
        {resources.map((tab) => (
          <button
            key={tab.value}
            type="button"
            className={resource === tab.value ? "is-current" : undefined}
            aria-pressed={resource === tab.value}
            onClick={() => onResourceChange(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <form className="library-toolbar" onSubmit={onSubmit} autoComplete="off">
        <label htmlFor="library-query">Search {resource}</label>
        <div className="library-search-controls">
          <input
            id="library-query"
            type="search"
            maxLength={200}
            value={searchText}
            onChange={(event) => onSearchTextChange(event.target.value)}
            placeholder="Search only material you may see"
            autoComplete="off"
            spellCheck={false}
          />
          <button className="button-secondary" type="submit">
            Search
          </button>
        </div>
        {resource !== "brands" && (
          <label className="library-purpose">
            View for
            <select
              value={purpose}
              onChange={(event) => {
                const selected = sourcePurposeSchema.safeParse(
                  event.target.value,
                );
                if (selected.success) onPurposeChange(selected.data);
              }}
            >
              {purposes.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        )}
      </form>
    </>
  );
}
