"use client";

import { useRef, useState } from "react";
import type { FormEvent } from "react";
import type { SourceDetail } from "@cadence/contracts/sources";
import { useWorkspace } from "@/components/workspace-context";
import { LibraryRequestError, requestLibrary } from "@/lib/library/client";

function revisionError(error: unknown): string {
  if (error instanceof LibraryRequestError) {
    if (error.code === "VERSION_CONFLICT")
      return "This capture changed. Search again before editing.";
    if (error.code === "SOURCE_ACCESS_DENIED")
      return "You no longer have access to edit this capture.";
  }
  return "The revision could not be saved. Your edits are still here.";
}

export function SourceRevisionEditor({
  source,
  onChanged,
}: Readonly<{ source: SourceDetail; onChanged: () => void }>) {
  const workspace = useWorkspace();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(source.title);
  const [body, setBody] = useState(source.body);
  const [authorityConfirmed, setAuthorityConfirmed] = useState(false);
  const [invalidationConfirmed, setInvalidationConfirmed] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const retry = useRef<{ fingerprint: string; requestId: string } | null>(null);

  async function save(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (
      pending ||
      !title.trim() ||
      !body.trim() ||
      !invalidationConfirmed ||
      (source.category === "client_confidential" && !authorityConfirmed)
    )
      return;
    const payload = {
      action: "source.revise" as const,
      sourceId: source.id,
      expectedContentVersion: source.contentVersion,
      expectedAccessVersion: source.accessVersion,
      brandId: source.brandId,
      title: title.trim(),
      body: body.trim(),
      category: source.category,
      purposes: source.permittedPurposes,
      clientAuthorityConfirmed: authorityConfirmed,
      allowedDataConfirmed: true as const,
      expiresAt: source.expiresAt,
    };
    const fingerprint = JSON.stringify(payload);
    if (retry.current?.fingerprint !== fingerprint)
      retry.current = { fingerprint, requestId: crypto.randomUUID() };
    setPending(true);
    setError(null);
    try {
      const result = await requestLibrary(workspace.id, {
        ...payload,
        requestId: retry.current.requestId,
      });
      if (!("kind" in result) || result.kind !== "committed")
        throw new LibraryRequestError("SERVICE_UNAVAILABLE");
      retry.current = null;
      onChanged();
    } catch (cause) {
      setError(revisionError(cause));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="source-revision-editor">
      <button
        type="button"
        className="button-secondary"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
      >
        {open ? "Close editor" : "Edit original"}
      </button>
      {open && (
        <form className="brand-editor" onSubmit={save} autoComplete="off">
          <h3>Edit revision {source.contentVersion}</h3>
          <label htmlFor="revision-title">Title</label>
          <input
            id="revision-title"
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              setInvalidationConfirmed(false);
            }}
            maxLength={240}
            autoComplete="off"
            spellCheck={false}
            required
            disabled={pending}
          />
          <label htmlFor="revision-body">Original text</label>
          <textarea
            id="revision-body"
            value={body}
            onChange={(event) => {
              setBody(event.target.value);
              setInvalidationConfirmed(false);
            }}
            maxLength={50_000}
            rows={9}
            spellCheck={false}
            required
            disabled={pending}
          />
          {source.category === "client_confidential" && (
            <label className="capture-check-row">
              <input
                type="checkbox"
                checked={authorityConfirmed}
                onChange={(event) =>
                  setAuthorityConfirmed(event.target.checked)
                }
                disabled={pending}
                required
              />
              <span>
                I still have authority to store this client information.
              </span>
            </label>
          )}
          <label className="capture-check-row">
            <input
              type="checkbox"
              checked={invalidationConfirmed}
              onChange={(event) =>
                setInvalidationConfirmed(event.target.checked)
              }
              disabled={pending}
              required
            />
            <span>
              I understand this new revision revokes existing original grants
              and reviewed excerpts. I confirm this remains permitted data.
            </span>
          </label>
          <button className="button-primary" type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save new revision"}
          </button>
          {error && (
            <p className="capture-message is-error" role="alert">
              {error}
            </p>
          )}
        </form>
      )}
    </div>
  );
}
