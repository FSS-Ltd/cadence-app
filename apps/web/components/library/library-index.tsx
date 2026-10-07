"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { LibraryPage } from "@cadence/contracts/library";
import type { SourcePurpose } from "@cadence/contracts/sources";
import { useWorkspace } from "@/components/workspace-context";
import { requestLibrary } from "@/lib/library/client";
import { LibraryDetail } from "./library-detail";
import type { LibrarySelection } from "./library-detail";
import { LibraryResults } from "./library-results";
import { BrandEditor } from "./brand-editor";
import { LibraryControls } from "./library-controls";

type Resource = LibraryPage["resource"];

function isLibraryPage(value: unknown): value is LibraryPage {
  return typeof value === "object" && value !== null && "resource" in value;
}

function appendLibraryPage(
  current: LibraryPage,
  next: LibraryPage,
): LibraryPage {
  if (current.resource === "sources" && next.resource === "sources")
    return { ...next, items: [...current.items, ...next.items] };
  if (current.resource === "excerpts" && next.resource === "excerpts")
    return { ...next, items: [...current.items, ...next.items] };
  if (current.resource === "brands" && next.resource === "brands")
    return { ...next, items: [...current.items, ...next.items] };
  throw new Error("Invalid library page");
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
  const [notice, setNotice] = useState<string | null>(null);
  const [loadingMoreKey, setLoadingMoreKey] = useState<string | null>(null);
  const [loadMoreErrorKey, setLoadMoreErrorKey] = useState<string | null>(null);
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
  const loadingMore = loadingMoreKey === searchKey;
  const loadMoreError = loadMoreErrorKey === searchKey;

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
    setNotice("Brand saved. The library has been refreshed.");
    setRefresh((current) => current + 1);
  }

  function sourceChanged(): void {
    setNotice("Source access was updated. The library has been refreshed.");
    setRefresh((current) => current + 1);
  }

  async function openSelection(
    item: { id: string },
    selectionResource: Resource,
  ): Promise<void> {
    setSelectedFor(searchKey);
    setNotice(null);
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

  async function loadMore(): Promise<void> {
    if (!page?.nextCursor || loadingMore) return;
    setLoadingMoreKey(searchKey);
    setLoadMoreErrorKey(null);
    try {
      const next = await requestLibrary(workspace.id, {
        action: "library.search",
        resource,
        query,
        after: page.nextCursor,
        limit: 50,
        purpose,
      });
      if (!isLibraryPage(next)) throw new Error("Invalid library page");
      setPageState((current) =>
        current?.key === searchKey && current.page
          ? {
              key: searchKey,
              page: appendLibraryPage(current.page, next),
              error: false,
            }
          : current,
      );
    } catch {
      setLoadMoreErrorKey(searchKey);
    } finally {
      setLoadingMoreKey((current) => (current === searchKey ? null : current));
    }
  }

  return (
    <div className="library-page">
      <LibraryControls
        resource={resource}
        purpose={purpose}
        searchText={searchText}
        onResourceChange={setResource}
        onPurposeChange={setPurpose}
        onSearchTextChange={setSearchText}
        onSubmit={submitSearch}
      />
      {notice && (
        <p className="capture-message is-success" role="status">
          {notice}
        </p>
      )}
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
          onLoadMore={loadMore}
          loadingMore={loadingMore}
          loadMoreError={loadMoreError}
        />
        <LibraryDetail
          selected={currentSelection}
          loading={currentDetailLoading}
          error={currentDetailError}
          onBrandSaved={brandSaved}
          onSourceChanged={sourceChanged}
        />
      </div>
    </div>
  );
}
