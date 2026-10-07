"use client";

import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { LibraryPage } from "@cadence/contracts/library";
import type { SourcePurpose } from "@cadence/contracts/sources";
import { sourcePurposeSchema } from "@cadence/contracts/sources";
import { useWorkspace } from "@/components/workspace-context";
import { requestLibrary } from "@/lib/library/client";
import { LibraryDetail } from "./library-detail";
import type { LibrarySelection } from "./library-detail";
import { LibraryResults } from "./library-results";
import { BrandEditor } from "./brand-editor";

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

function isLibraryPage(value: unknown): value is LibraryPage {
  return typeof value === "object" && value !== null && "resource" in value;
}

export function LibraryIndex() {
  const workspace = useWorkspace();
  const { isLoaded, userId, sessionId } = useAuth();
  if (!isLoaded || !userId || !sessionId)
    return <p role="status">Checking your session…</p>;
  return <LibraryContents key={`${workspace.id}:${userId}:${sessionId}`} />;
}

function LibraryContents() {
  const workspace = useWorkspace();
  const [resource, setResource] = useState<Resource>("sources");
  const [purpose, setPurpose] = useState<SourcePurpose>("editorial_reuse");
  const [searchText, setSearchText] = useState("");
  const [query, setQuery] = useState("");
  const [pageState, setPageState] = useState<{
    key: string;
    page: LibraryPage | null;
    error: boolean;
  } | null>(null);
  const [selected, setSelected] = useState<LibrarySelection | null>(null);
  const [selectedFor, setSelectedFor] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [creatingBrand, setCreatingBrand] = useState(false);
  const searchKey = JSON.stringify([
    workspace.id,
    resource,
    purpose,
    query,
    refresh,
  ]);
  const page = pageState?.key === searchKey ? pageState.page : null;
  const loading = pageState?.key !== searchKey;
  const error = pageState?.key === searchKey && pageState.error;
  const currentSelection = selectedFor === searchKey ? selected : null;
  const currentDetailLoading = selectedFor === searchKey && detailLoading;
  const currentDetailError = selectedFor === searchKey && detailError;

  useEffect(() => {
    const controller = new AbortController();
    requestLibrary(
      workspace.id,
      {
        action: "library.search",
        resource,
        query,
        after: null,
        limit: 50,
        purpose,
      },
      controller.signal,
    )
      .then((result) => {
        if (!isLibraryPage(result)) throw new Error("Invalid library page");
        setPageState({ key: searchKey, page: result, error: false });
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setPageState({ key: searchKey, page: null, error: true });
      });
    return () => controller.abort();
  }, [workspace.id, resource, purpose, query, refresh, searchKey]);

  function brandSaved(): void {
    setCreatingBrand(false);
    setRefresh((current) => current + 1);
  }

  async function openSelection(
    item: { id: string },
    selectionResource: Resource,
  ): Promise<void> {
    setSelectedFor(searchKey);
    setDetailError(false);
    setDetailLoading(true);
    setSelected(null);
    try {
      if (selectionResource === "brands") {
        const brand =
          page?.resource === "brands"
            ? page.items.find((candidate) => candidate.id === item.id)
            : undefined;
        if (brand) setSelected(brand);
        return;
      }
      const result = await requestLibrary(
        workspace.id,
        selectionResource === "sources"
          ? {
              action: "source.read",
              sourceId: item.id,
              version: null,
              purpose,
            }
          : { action: "excerpt.read", excerptId: item.id, purpose },
      );
      if (
        "kind" in result &&
        (result.kind === "source" || result.kind === "excerpt")
      )
        setSelected(result);
      else setDetailError(true);
    } catch {
      setDetailError(true);
    } finally {
      setDetailLoading(false);
    }
  }

  function submitSearch(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    setQuery(searchText.trim());
  }

  return (
    <div className="library-page">
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
            onClick={() => setResource(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <form
        className="library-toolbar"
        onSubmit={submitSearch}
        autoComplete="off"
      >
        <label htmlFor="library-query">Search {resource}</label>
        <div className="library-search-controls">
          <input
            id="library-query"
            type="search"
            maxLength={200}
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
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
                if (selected.success) setPurpose(selected.data);
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
      {resource === "brands" && (
        <div className="library-brand-action">
          <button
            className="button-secondary"
            type="button"
            onClick={() => setCreatingBrand((current) => !current)}
            aria-expanded={creatingBrand}
          >
            {creatingBrand ? "Close new brand" : "New brand"}
          </button>
          {creatingBrand && <BrandEditor brand={null} onSaved={brandSaved} />}
        </div>
      )}
      <div className="library-grid">
        <LibraryResults
          resource={resource}
          page={page}
          loading={loading}
          error={error}
          onSelect={openSelection}
        />
        <LibraryDetail
          selected={currentSelection}
          loading={currentDetailLoading}
          error={currentDetailError}
          onBrandSaved={brandSaved}
        />
      </div>
    </div>
  );
}
