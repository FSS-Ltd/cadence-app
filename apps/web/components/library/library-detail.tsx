import type { Brand } from "@cadence/contracts/brands";
import type { ReviewedExcerpt, SourceDetail } from "@cadence/contracts/sources";
import { BrandEditor } from "./brand-editor";
import { SourceActions } from "./source-actions";
import { SourceRevisionEditor } from "./source-revision-editor";

export type LibrarySelection = SourceDetail | ReviewedExcerpt | Brand;

export function LibraryDetail({
  selected,
  loading,
  error,
  onBrandSaved,
  onSourceChanged,
}: Readonly<{
  selected: LibrarySelection | null;
  loading: boolean;
  error: boolean;
  onBrandSaved: () => void;
  onSourceChanged: () => void;
}>) {
  return (
    <aside className="surface-panel library-detail" aria-label="Selected item">
      {loading && (
        <p className="library-state" role="status">
          Opening selected item…
        </p>
      )}
      {error && (
        <p className="library-state" role="alert">
          Access changed or the item is unavailable. Search again.
        </p>
      )}
      {!loading && !error && !selected && (
        <p className="library-state">
          Select an item to review its details and visibility.
        </p>
      )}
      {selected && "kind" in selected && selected.kind === "source" && (
        <div className="library-detail-content">
          <span className="eyebrow">
            {selected.visibility === "private"
              ? "PRIVATE ORIGINAL"
              : "SHARED ORIGINAL"}
          </span>
          <h2>{selected.title}</h2>
          <p className="library-revision">
            Revision {selected.revisionVersion} · Access version{" "}
            {selected.accessVersion}
          </p>
          <p className="library-body">{selected.body}</p>
          <p className="library-revision">
            {selected.isCustodian
              ? "You control this source."
              : "Shared with you for this purpose."}
          </p>
          {selected.isCustodian && (
            <>
              <SourceRevisionEditor
                key={`revision:${selected.id}:${selected.contentVersion}:${selected.accessVersion}`}
                source={selected}
                onChanged={onSourceChanged}
              />
              <SourceActions
                key={`access:${selected.id}:${selected.contentVersion}:${selected.accessVersion}`}
                source={selected}
                onChanged={onSourceChanged}
              />
            </>
          )}
        </div>
      )}
      {selected && "kind" in selected && selected.kind === "excerpt" && (
        <div className="library-detail-content">
          <span className="eyebrow">REVIEWED EXCERPT</span>
          <h2>Selected copy</h2>
          <p className="library-body">{selected.body}</p>
          <p className="library-revision">
            Reviewed from revision {selected.reviewedVersion}. Original details
            stay private.
          </p>
        </div>
      )}
      {selected && !("kind" in selected) && (
        <div className="library-detail-content">
          <span className="eyebrow">BRAND PLAYBOOK</span>
          <h2>{selected.name}</h2>
          <h3>Audience</h3>
          <p>{selected.audience || "Not set"}</p>
          <h3>Voice</h3>
          <p>{selected.voice || "Not set"}</p>
          <h3>Guidance</h3>
          <p>{selected.guidance || "Not set"}</p>
          <BrandEditor
            key={`${selected.id}:${selected.version}`}
            brand={selected}
            onSaved={onBrandSaved}
          />
        </div>
      )}
    </aside>
  );
}
