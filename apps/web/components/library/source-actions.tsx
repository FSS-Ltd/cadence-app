"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import type {
  SourceCommand,
  SourceDetail,
  SourcePurpose,
} from "@cadence/contracts/sources";
import { useWorkspace } from "@/components/workspace-context";
import { LibraryRequestError, requestLibrary } from "@/lib/library/client";
import { readOtherMembers } from "@/lib/library/members";
import { SourceActionForm } from "./source-action-form";
import type {
  SourceActionMember,
  SourceActionMode,
} from "./source-action-form";

function actionError(error: unknown): string {
  if (error instanceof LibraryRequestError) {
    if (error.code === "VERSION_CONFLICT")
      return "This source changed. Search again before making another decision.";
    if (
      error.code === "SOURCE_ACCESS_DENIED" ||
      error.code === "SOURCE_GRANT_REVOKED"
    )
      return "Access to this source changed. Search again.";
    if (error.code === "AUTHENTICATION_TOO_OLD")
      return "Your session needs refreshing before this action.";
  }
  return "The change could not be saved. Review your choices and try again.";
}

export function SourceActions({
  source,
  onChanged,
}: Readonly<{ source: SourceDetail; onChanged: () => void }>) {
  const workspace = useWorkspace();
  const [mode, setMode] = useState<SourceActionMode | null>(null);
  const [members, setMembers] = useState<SourceActionMember[]>([]);
  const [membersError, setMembersError] = useState(false);
  const [recipientIds, setRecipientIds] = useState<string[]>([]);
  const [purpose, setPurpose] = useState<SourcePurpose>(
    source.permittedPurposes[0],
  );
  const [excerptBody, setExcerptBody] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const retry = useRef<{ fingerprint: string; requestId: string } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    readOtherMembers(workspace.id, controller.signal)
      .then(setMembers)
      .catch(() => {
        if (!controller.signal.aborted) setMembersError(true);
      });
    return () => controller.abort();
  }, [workspace.id]);

  function chooseMode(next: SourceActionMode): void {
    setMode(next);
    setRecipientIds([]);
    setExcerptBody("");
    setConfirmed(false);
    setError(null);
    retry.current = null;
  }

  function toggleRecipient(id: string): void {
    setConfirmed(false);
    setRecipientIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  function commandPayload(requestId: string): SourceCommand | null {
    const version = {
      requestId,
      sourceId: source.id,
      expectedContentVersion: source.contentVersion,
      expectedAccessVersion: source.accessVersion,
    };
    switch (mode) {
      case "share":
        return {
          action: "source.share",
          ...version,
          recipients: recipientIds,
          purposes: [purpose],
          shareConfirmed: true,
        };
      case "excerpt":
        return {
          action: "excerpt.release",
          ...version,
          body: excerptBody.trim(),
          recipients: recipientIds,
          purposes: [purpose],
          reviewConfirmed: true,
        };
      case "revoke":
        return { action: "source.revoke", ...version };
      case "erase":
        return { action: "source.erase", ...version };
      default:
        return null;
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (
      pending ||
      !confirmed ||
      !mode ||
      ((mode === "share" || mode === "excerpt") && recipientIds.length === 0) ||
      (mode === "excerpt" && !excerptBody.trim())
    )
      return;
    const fingerprint = JSON.stringify([
      mode,
      source.id,
      source.contentVersion,
      source.accessVersion,
      recipientIds,
      purpose,
      excerptBody.trim(),
    ]);
    if (retry.current?.fingerprint !== fingerprint)
      retry.current = { fingerprint, requestId: crypto.randomUUID() };
    const payload = commandPayload(retry.current.requestId);
    if (!payload) return;
    setPending(true);
    setError(null);
    try {
      const result = await requestLibrary(workspace.id, payload);
      if (!("kind" in result) || result.kind !== "committed")
        throw new LibraryRequestError("SERVICE_UNAVAILABLE");
      retry.current = null;
      onChanged();
    } catch (cause) {
      setError(actionError(cause));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="source-actions">
      <h3>Access decisions</h3>
      <p className="library-revision">
        These choices apply to revision {source.contentVersion} and access
        version {source.accessVersion}.
      </p>
      <div className="source-action-choices">
        <button
          type="button"
          className="button-secondary"
          onClick={() => chooseMode("share")}
        >
          Share original
        </button>
        <button
          type="button"
          className="button-secondary"
          onClick={() => chooseMode("excerpt")}
          disabled={!source.permittedPurposes.includes("excerpt_release")}
        >
          Release reviewed excerpt
        </button>
        {source.visibility === "shared" && (
          <button
            type="button"
            className="button-secondary"
            onClick={() => chooseMode("revoke")}
          >
            Revoke sharing
          </button>
        )}
        <button
          type="button"
          className="button-secondary"
          onClick={() => chooseMode("erase")}
        >
          Erase source
        </button>
      </div>
      {source.grants && source.grants.length > 0 && (
        <p className="library-revision">
          Current original grants: {source.grants.length}. Excerpt grants are
          separate.
        </p>
      )}
      {mode && (
        <SourceActionForm
          source={source}
          mode={mode}
          members={members}
          membersError={membersError}
          recipientIds={recipientIds}
          purpose={purpose}
          excerptBody={excerptBody}
          confirmed={confirmed}
          pending={pending}
          error={error}
          onSubmit={submit}
          onToggleRecipient={toggleRecipient}
          onPurposeChange={(next) => {
            setPurpose(next);
            setConfirmed(false);
          }}
          onExcerptBodyChange={(next) => {
            setExcerptBody(next);
            setConfirmed(false);
          }}
          onConfirmChange={setConfirmed}
        />
      )}
    </div>
  );
}
