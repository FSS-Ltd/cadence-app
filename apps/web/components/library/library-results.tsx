import type { LibraryPage } from "@cadence/contracts/library";

type Resource = LibraryPage["resource"];

export function LibraryResults({
  resource,
  page,
  loading,
  error,
  onSelect,
  onLoadMore,
  loadingMore,
  loadMoreError,
}: Readonly<{
  resource: Resource;
  page: LibraryPage | null;
  loading: boolean;
  error: boolean;
  onSelect: (item: { id: string }, resource: Resource) => void;
  onLoadMore: () => void;
  loadingMore: boolean;
  loadMoreError: boolean;
}>) {
  return (
    <section className="surface-panel" aria-label={`${resource} results`}>
      {loading && (
        <p className="library-state" role="status">
          Loading your library…
        </p>
      )}
      {error && (
        <p className="library-state" role="alert">
          The library could not be loaded. Try the search again.
        </p>
      )}
      {!loading && !error && page?.items.length === 0 && (
        <p className="library-state">
          No {resource} are available for this search and purpose.
        </p>
      )}
      {!loading && !error && page && page.items.length > 0 && (
        <ul className="library-list">
          {page.resource === "sources" &&
            page.items.map((item) => (
              <li key={item.id}>
                <button type="button" onClick={() => onSelect(item, "sources")}>
                  <strong>{item.title}</strong>
                  <span>{item.preview}</span>
                  <small>
                    {item.visibility === "private"
                      ? "Private original"
                      : "Explicitly shared"}{" "}
                    · Revision {item.contentVersion}
                  </small>
                </button>
              </li>
            ))}
          {page.resource === "excerpts" &&
            page.items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onSelect(item, "excerpts")}
                >
                  <strong>Reviewed excerpt</strong>
                  <span>{item.preview}</span>
                  <small>Reviewed from revision {item.reviewedVersion}</small>
                </button>
              </li>
            ))}
          {page.resource === "brands" &&
            page.items.map((item) => (
              <li key={item.id}>
                <button type="button" onClick={() => onSelect(item, "brands")}>
                  <strong>{item.name}</strong>
                  <span>{item.audience || "No audience guidance yet"}</span>
                  <small>Playbook revision {item.version}</small>
                </button>
              </li>
            ))}
        </ul>
      )}
      {page?.nextCursor && (
        <button
          className="button-secondary library-load-more"
          type="button"
          onClick={onLoadMore}
          disabled={loadingMore}
        >
          {loadingMore ? "Loading…" : "Load more"}
        </button>
      )}
      {loadMoreError && (
        <p className="library-state" role="alert">
          More results could not be loaded. Try again.
        </p>
      )}
    </section>
  );
}
