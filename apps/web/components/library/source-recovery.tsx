"use client";

import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import type { SourceCommand } from "@cadence/contracts/sources";
import { workspaceIdSchema } from "@cadence/contracts/access";
import { useWorkspace } from "@/components/workspace-context";
import { LibraryRequestError, requestLibrary } from "@/lib/library/client";
import { readWorkspaceMembers } from "@/lib/library/members";

type Recovery = Extract<SourceCommand, { action: "source.recover" }>;
type MemberSet = Awaited<ReturnType<typeof readWorkspaceMembers>>;
const reasons: ReadonlyArray<{ value: Recovery["reason"]; label: string }> = [
  { value: "creator_departed", label: "Creator left the workspace" },
  { value: "creator_disabled", label: "Creator account was disabled" },
  { value: "custodian_departed", label: "Current custodian left" },
  { value: "custodian_disabled", label: "Current custodian was disabled" },
];

function recoveryError(error: unknown): string {
  if (error instanceof LibraryRequestError) {
    if (error.code === "VERSION_CONFLICT")
      return "The source changed. Verify its recovery reference before trying again.";
    if (error.code === "SOURCE_ACCESS_DENIED" || error.code === "ACCESS_DENIED")
      return "Recovery is unavailable for this source or your role.";
    if (error.code === "AUTHENTICATION_TOO_OLD")
      return "Refresh your sign-in before recovering a source.";
  }
  return "Recovery could not be completed. Check the reference and try again.";
}

export function SourceRecovery() {
  const workspace = useWorkspace();
  const { isLoaded, userId, sessionId } = useAuth();
  if (!isLoaded || !userId || !sessionId)
    return <p role="status">Checking your session…</p>;
  return <RecoveryForm key={`${workspace.id}:${userId}:${sessionId}`} />;
}

function RecoveryForm() {
  const workspace = useWorkspace();
  const [memberSet, setMemberSet] = useState<MemberSet | null>(null);
  const [membersError, setMembersError] = useState(false);
  const [sourceId, setSourceId] = useState("");
  const [contentVersion, setContentVersion] = useState("");
  const [accessVersion, setAccessVersion] = useState("");
  const [custodianId, setCustodianId] = useState("");
  const [reason, setReason] = useState<Recovery["reason"]>("creator_departed");
  const [confirmed, setConfirmed] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const retry = useRef<{ fingerprint: string; requestId: string } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    readWorkspaceMembers(workspace.id, controller.signal)
      .then(setMemberSet)
      .catch(() => {
        if (!controller.signal.aborted) setMembersError(true);
      });
    return () => controller.abort();
  }, [workspace.id]);

  async function recover(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const content = Number(contentVersion);
    const access = Number(accessVersion);
    if (
      pending ||
      !confirmed ||
      memberSet?.actor.role !== "owner" ||
      !workspaceIdSchema.safeParse(sourceId).success ||
      !workspaceIdSchema.safeParse(custodianId).success ||
      !Number.isSafeInteger(content) ||
      content < 1 ||
      !Number.isSafeInteger(access) ||
      access < 1
    )
      return;
    const payload = {
      action: "source.recover" as const,
      sourceId,
      expectedContentVersion: content,
      expectedAccessVersion: access,
      custodianId,
      reason,
    };
    const fingerprint = JSON.stringify(payload);
    if (retry.current?.fingerprint !== fingerprint)
      retry.current = { fingerprint, requestId: crypto.randomUUID() };
    setPending(true);
    setError(null);
    setSaved(false);
    try {
      const result = await requestLibrary(workspace.id, {
        ...payload,
        requestId: retry.current.requestId,
      });
      if (!("kind" in result) || result.kind !== "committed")
        throw new LibraryRequestError("SERVICE_UNAVAILABLE");
      retry.current = null;
      setSourceId("");
      setContentVersion("");
      setAccessVersion("");
      setCustodianId("");
      setConfirmed(false);
      setSaved(true);
    } catch (cause) {
      setError(recoveryError(cause));
    } finally {
      setPending(false);
    }
  }

  return (
    <section
      className="surface-panel recovery-panel"
      aria-labelledby="recovery-heading"
    >
      <span className="eyebrow">AUDITED RECOVERY</span>
      <h2 id="recovery-heading">Recover an orphaned source</h2>
      <p>
        Workspace ownership does not grant access to private captures. Recovery
        requires an exact source reference, a qualifying reason and an active
        custodian. No source text is previewed here.
      </p>
      {!memberSet && !membersError && (
        <p role="status">Checking recovery permission…</p>
      )}
      {membersError && (
        <p role="alert">
          Recovery permission could not be checked. Try again later.
        </p>
      )}
      {memberSet?.actor.role !== "owner" && memberSet && (
        <p>Only a workspace owner can perform audited recovery.</p>
      )}
      {memberSet?.actor.role === "owner" && (
        <form className="brand-editor" onSubmit={recover} autoComplete="off">
          <p className="capture-field-note">
            Enter the source ID and current versions from the authorised
            recovery record. The original remains private until this command
            succeeds.
          </p>
          <label htmlFor="recovery-source">Source ID</label>
          <input
            id="recovery-source"
            value={sourceId}
            onChange={(event) => {
              setSourceId(event.target.value);
              setConfirmed(false);
            }}
            required
            autoComplete="off"
            spellCheck={false}
            disabled={pending}
          />
          <label htmlFor="recovery-content-version">Content version</label>
          <input
            id="recovery-content-version"
            type="number"
            min={1}
            step={1}
            value={contentVersion}
            onChange={(event) => {
              setContentVersion(event.target.value);
              setConfirmed(false);
            }}
            required
            disabled={pending}
          />
          <label htmlFor="recovery-access-version">Access version</label>
          <input
            id="recovery-access-version"
            type="number"
            min={1}
            step={1}
            value={accessVersion}
            onChange={(event) => {
              setAccessVersion(event.target.value);
              setConfirmed(false);
            }}
            required
            disabled={pending}
          />
          <label htmlFor="recovery-custodian">New custodian</label>
          <select
            id="recovery-custodian"
            value={custodianId}
            onChange={(event) => {
              setCustodianId(event.target.value);
              setConfirmed(false);
            }}
            required
            disabled={pending}
          >
            <option value="">Choose an active member</option>
            {memberSet.members.map((member) => (
              <option key={member.userId} value={member.userId}>
                {member.role} member · ID ending {member.userId.slice(-8)}
              </option>
            ))}
          </select>
          <label htmlFor="recovery-reason">Reason</label>
          <select
            id="recovery-reason"
            value={reason}
            onChange={(event) => {
              const selected = reasons.find(
                (item) => item.value === event.target.value,
              );
              if (selected) {
                setReason(selected.value);
                setConfirmed(false);
              }
            }}
            disabled={pending}
          >
            {reasons.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <label className="capture-check-row">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(event) => setConfirmed(event.target.checked)}
              required
              disabled={pending}
            />
            <span>
              I verified the orphaned status, reason, versions and new
              custodian.
            </span>
          </label>
          <button
            className="button-primary"
            type="submit"
            disabled={pending || !confirmed}
          >
            {pending ? "Recovering…" : "Recover source"}
          </button>
          {error && (
            <p className="capture-message is-error" role="alert">
              {error}
            </p>
          )}
          {saved && (
            <p className="capture-message is-success" role="status">
              Recovery was recorded.{" "}
              <Link href="/library">Open the library</Link> to verify permitted
              access.
            </p>
          )}
        </form>
      )}
    </section>
  );
}
