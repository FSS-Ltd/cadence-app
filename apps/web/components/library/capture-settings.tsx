import type { Brand } from "@cadence/contracts/brands";
import type { SourcePurpose } from "@cadence/contracts/sources";

type Category = "personal_draft" | "client_confidential";
const purposeOptions: ReadonlyArray<{
  value: SourcePurpose;
  label: string;
}> = [
  { value: "editorial_reuse", label: "Editorial drafts" },
  { value: "excerpt_release", label: "Reviewed excerpts" },
  { value: "analytics", label: "Private analytics" },
  { value: "ai_proposal", label: "Future AI proposals" },
];

export function CaptureSettings({
  brands,
  brandsError,
  brandId,
  category,
  purposes,
  authorityConfirmed,
  pending,
  onBrandChange,
  onCategoryChange,
  onPurposeToggle,
  onAuthorityChange,
}: Readonly<{
  brands: Brand[];
  brandsError: boolean;
  brandId: string | null;
  category: Category;
  purposes: SourcePurpose[];
  authorityConfirmed: boolean;
  pending: boolean;
  onBrandChange: (value: string | null) => void;
  onCategoryChange: (value: Category) => void;
  onPurposeToggle: (value: SourcePurpose) => void;
  onAuthorityChange: (value: boolean) => void;
}>) {
  return (
    <aside
      className="capture-settings surface-panel"
      aria-label="Capture settings"
    >
      <div className="capture-section-heading">
        <span className="eyebrow">02 · CONTEXT</span>
        <h2>Where does this belong?</h2>
      </div>
      <label htmlFor="capture-brand">Brand</label>
      <select
        id="capture-brand"
        value={brandId ?? ""}
        onChange={(event) => onBrandChange(event.target.value || null)}
        disabled={pending}
      >
        <option value="">No brand selected</option>
        {brands.map((brand) => (
          <option key={brand.id} value={brand.id}>
            {brand.name}
          </option>
        ))}
      </select>
      {brandsError && (
        <p className="capture-field-note" role="status">
          Brands could not be loaded. You can still save without one.
        </p>
      )}
      <label htmlFor="capture-category">Information category</label>
      <select
        id="capture-category"
        value={category}
        onChange={(event) =>
          onCategoryChange(
            event.target.value === "client_confidential"
              ? "client_confidential"
              : "personal_draft",
          )
        }
        disabled={pending}
      >
        <option value="personal_draft">Personal draft</option>
        <option value="client_confidential">
          Authorised client-confidential note
        </option>
      </select>
      {category === "client_confidential" && (
        <label className="capture-check-row">
          <input
            type="checkbox"
            checked={authorityConfirmed}
            onChange={(event) => onAuthorityChange(event.target.checked)}
            disabled={pending}
            required
          />
          <span>
            I have authority to store and use this client information.
          </span>
        </label>
      )}
      <div className="capture-divider" />
      <div className="capture-section-heading">
        <span className="eyebrow">03 · VISIBILITY</span>
        <h2>Private to you</h2>
      </div>
      <p className="capture-field-note">
        Other workspace owners cannot read this original. Sharing later requires
        a separate, explicit action.
      </p>
      <fieldset className="capture-purposes">
        <legend>Permitted purposes</legend>
        {purposeOptions.map((option) => (
          <label className="capture-check-row" key={option.value}>
            <input
              type="checkbox"
              checked={purposes.includes(option.value)}
              onChange={() => onPurposeToggle(option.value)}
              disabled={pending}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </fieldset>
      <p className="capture-field-note">
        Permitting a purpose does not share the note or run AI. You choose
        recipients separately.
      </p>
    </aside>
  );
}
