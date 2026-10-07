"use client";

import { useRef, useState } from "react";
import type { FormEvent } from "react";
import type { Brand } from "@cadence/contracts/brands";
import { useWorkspace } from "@/components/workspace-context";
import { LibraryRequestError, requestLibrary } from "@/lib/library/client";

function brandError(error: unknown): string {
  if (error instanceof LibraryRequestError) {
    if (error.code === "VERSION_CONFLICT")
      return "This playbook changed. Reload the brand before editing it again.";
    if (error.code === "ACCESS_DENIED")
      return "You no longer have permission to edit this brand.";
  }
  return "The brand could not be saved. Your edits are still here.";
}

export function BrandEditor({
  brand,
  onSaved,
}: Readonly<{ brand: Brand | null; onSaved: () => void }>) {
  const workspace = useWorkspace();
  const [name, setName] = useState(brand?.name ?? "");
  const [audience, setAudience] = useState(brand?.audience ?? "");
  const [voice, setVoice] = useState(brand?.voice ?? "");
  const [guidance, setGuidance] = useState(brand?.guidance ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const retry = useRef<{ fingerprint: string; requestId: string } | null>(null);

  async function save(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (pending || !name.trim()) return;
    const payload = {
      action: "brand.write" as const,
      brandId: brand?.id ?? null,
      expectedVersion: brand?.version ?? 0,
      name: name.trim(),
      audience: audience.trim(),
      voice: voice.trim(),
      guidance: guidance.trim(),
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
      onSaved();
    } catch (cause) {
      setError(brandError(cause));
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="brand-editor" onSubmit={save} autoComplete="off">
      <h3>{brand ? "Edit playbook" : "New brand"}</h3>
      <label htmlFor="brand-name">Brand name</label>
      <input
        id="brand-name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        maxLength={120}
        autoComplete="off"
        spellCheck={false}
        required
        disabled={pending}
      />
      <label htmlFor="brand-audience">Audience</label>
      <textarea
        id="brand-audience"
        value={audience}
        onChange={(event) => setAudience(event.target.value)}
        maxLength={4000}
        rows={3}
        spellCheck={false}
        disabled={pending}
      />
      <label htmlFor="brand-voice">Voice</label>
      <textarea
        id="brand-voice"
        value={voice}
        onChange={(event) => setVoice(event.target.value)}
        maxLength={4000}
        rows={3}
        spellCheck={false}
        disabled={pending}
      />
      <label htmlFor="brand-guidance">Guidance</label>
      <textarea
        id="brand-guidance"
        value={guidance}
        onChange={(event) => setGuidance(event.target.value)}
        maxLength={8000}
        rows={4}
        spellCheck={false}
        disabled={pending}
      />
      <button className="button-primary" type="submit" disabled={pending}>
        {pending
          ? "Saving…"
          : brand
            ? "Save playbook revision"
            : "Create brand"}
      </button>
      {error && (
        <p className="capture-message is-error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
