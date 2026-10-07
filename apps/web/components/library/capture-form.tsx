"use client";

import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import type { Brand } from "@cadence/contracts/brands";
import type { SourcePurpose } from "@cadence/contracts/sources";
import { useWorkspace } from "@/components/workspace-context";
import { requestLibrary, LibraryRequestError } from "@/lib/library/client";
import { CaptureSettings } from "./capture-settings";

function errorMessage(error: unknown): string {
  if (error instanceof LibraryRequestError) {
    if (error.code === "AUTHENTICATION_TOO_OLD")
      return "Your session needs refreshing. Sign in again before saving.";
    if (error.code === "ACCESS_DENIED" || error.code === "SOURCE_ACCESS_DENIED")
      return "You no longer have access to save this capture.";
  }
  return "The capture could not be saved. Your text is still here; try again.";
}

export function CaptureForm() {
  const workspace = useWorkspace();
  const { isLoaded, userId, sessionId } = useAuth();
  if (!isLoaded || !userId || !sessionId)
    return <p role="status">Checking your session…</p>;
  return <CaptureEditor key={`${workspace.id}:${userId}:${sessionId}`} />;
}

function CaptureEditor() {
  const workspace = useWorkspace();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [brandsError, setBrandsError] = useState(false);
  const [brandId, setBrandId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<
    "personal_draft" | "client_confidential"
  >("personal_draft");
  const [purposes, setPurposes] = useState<SourcePurpose[]>([
    "editorial_reuse",
  ]);
  const [authorityConfirmed, setAuthorityConfirmed] = useState(false);
  const [allowedDataConfirmed, setAllowedDataConfirmed] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const retry = useRef<{ fingerprint: string; requestId: string } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    requestLibrary(
      workspace.id,
      {
        action: "library.search",
        resource: "brands",
        query: "",
        after: null,
        limit: 100,
        purpose: "editorial_reuse",
      },
      controller.signal,
    )
      .then((result) => {
        if ("resource" in result && result.resource === "brands")
          setBrands(result.items);
      })
      .catch(() => {
        if (!controller.signal.aborted) setBrandsError(true);
      });
    return () => controller.abort();
  }, [workspace.id]);

  function togglePurpose(purpose: SourcePurpose): void {
    setPurposes((current) =>
      current.includes(purpose)
        ? current.filter((item) => item !== purpose)
        : [...current, purpose],
    );
  }

  async function saveCapture(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (
      pending ||
      !title.trim() ||
      !body.trim() ||
      purposes.length === 0 ||
      !allowedDataConfirmed ||
      (category === "client_confidential" && !authorityConfirmed)
    )
      return;
    setPending(true);
    setError(null);
    setSaved(false);
    const payload = {
      action: "source.capture" as const,
      brandId,
      title: title.trim(),
      body: body.trim(),
      category,
      purposes,
      clientAuthorityConfirmed: authorityConfirmed,
      allowedDataConfirmed: true as const,
      expiresAt: null,
    };
    const fingerprint = JSON.stringify(payload);
    if (retry.current?.fingerprint !== fingerprint)
      retry.current = { fingerprint, requestId: crypto.randomUUID() };
    try {
      const result = await requestLibrary(workspace.id, {
        ...payload,
        requestId: retry.current.requestId,
      });
      if (!("kind" in result) || result.kind !== "committed")
        throw new LibraryRequestError("SERVICE_UNAVAILABLE");
      setTitle("");
      setBody("");
      setAllowedDataConfirmed(false);
      setAuthorityConfirmed(false);
      retry.current = null;
      setSaved(true);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="capture-page" onSubmit={saveCapture} autoComplete="off">
      <div className="capture-heading">
        <div>
          <p className="eyebrow">PRIVATE CAPTURE</p>
          <h1>Capture a new idea</h1>
          <p>Keep the original private. Choose what it may be used for.</p>
        </div>
        <Link className="button-secondary" href="/library">
          Back to library
        </Link>
      </div>
      <div className="capture-grid">
        <section
          className="capture-editor surface-panel"
          aria-labelledby="capture-text-heading"
        >
          <div className="capture-section-heading">
            <span className="eyebrow">01 · THE IDEA</span>
            <h2 id="capture-text-heading">Write it down</h2>
          </div>
          <label htmlFor="capture-title">Title</label>
          <input
            id="capture-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={240}
            required
            placeholder="A short title for your private note"
            autoComplete="off"
            spellCheck={false}
            disabled={pending}
          />
          <label htmlFor="capture-body">Note</label>
          <textarea
            id="capture-body"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            maxLength={50_000}
            minLength={1}
            required
            rows={15}
            placeholder="Write the idea in your own words…"
            autoComplete="off"
            spellCheck={false}
            disabled={pending}
          />
          <p className="capture-hint">
            Text only in this build. This draft stays in memory until you save
            it.
          </p>
        </section>
        <CaptureSettings
          brands={brands}
          brandsError={brandsError}
          brandId={brandId}
          category={category}
          purposes={purposes}
          authorityConfirmed={authorityConfirmed}
          pending={pending}
          onBrandChange={setBrandId}
          onCategoryChange={(value) => {
            setCategory(value);
            setAuthorityConfirmed(false);
          }}
          onPurposeToggle={togglePurpose}
          onAuthorityChange={setAuthorityConfirmed}
        />
      </div>
      <div className="capture-savebar">
        <label className="capture-check-row capture-acknowledgement">
          <input
            type="checkbox"
            checked={allowedDataConfirmed}
            onChange={(event) => setAllowedDataConfirmed(event.target.checked)}
            disabled={pending}
            required
          />
          <span>
            This is an ordinary draft or authorised client note. It contains no
            highly sensitive records.
          </span>
        </label>
        <button
          className="button-primary"
          type="submit"
          disabled={pending || purposes.length === 0}
        >
          {pending ? "Saving…" : "Save private capture"}
        </button>
      </div>
      {error && (
        <p className="capture-message is-error" role="alert">
          {error}
        </p>
      )}
      {saved && (
        <p className="capture-message is-success" role="status">
          Saved privately. <Link href="/library">View your library</Link>
        </p>
      )}
    </form>
  );
}
