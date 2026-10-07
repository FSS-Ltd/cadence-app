import type { FormEvent } from "react";
import type { AccessReadResult } from "@cadence/contracts/access";
import type { SourceDetail, SourcePurpose } from "@cadence/contracts/sources";

export type SourceActionMode = "share" | "excerpt" | "revoke" | "erase";
export type SourceActionMember = Extract<
  AccessReadResult,
  { resource: "members" }
>["items"][number];

export function SourceActionForm({
  source,
  mode,
  members,
  membersError,
  recipientIds,
  purpose,
  excerptBody,
  confirmed,
  pending,
  error,
  onSubmit,
  onToggleRecipient,
  onPurposeChange,
  onExcerptBodyChange,
  onConfirmChange,
}: Readonly<{
  source: SourceDetail;
  mode: SourceActionMode;
  members: SourceActionMember[];
  membersError: boolean;
  recipientIds: string[];
  purpose: SourcePurpose;
  excerptBody: string;
  confirmed: boolean;
  pending: boolean;
  error: string | null;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onToggleRecipient: (id: string) => void;
  onPurposeChange: (purpose: SourcePurpose) => void;
  onExcerptBodyChange: (body: string) => void;
  onConfirmChange: (confirmed: boolean) => void;
}>) {
  const sharing = mode === "share" || mode === "excerpt";
  return (
    <form className="source-action-form" onSubmit={onSubmit} autoComplete="off">
      {sharing && (
        <>
          {membersError && (
            <p role="alert">
              Members could not be loaded. Sharing is unavailable.
            </p>
          )}
          {!membersError && members.length === 0 && (
            <p>No other active members are available.</p>
          )}
          {members.length > 0 && (
            <fieldset>
              <legend>Recipients</legend>
              {members.map((member) => (
                <label className="capture-check-row" key={member.userId}>
                  <input
                    type="checkbox"
                    checked={recipientIds.includes(member.userId)}
                    onChange={() => onToggleRecipient(member.userId)}
                    disabled={pending}
                  />
                  <span>
                    {member.role} member · ID ending {member.userId.slice(-8)}
                  </span>
                </label>
              ))}
            </fieldset>
          )}
          <label htmlFor="source-action-purpose">Purpose</label>
          <select
            id="source-action-purpose"
            value={purpose}
            onChange={(event) => {
              const selected = source.permittedPurposes.find(
                (item) => item === event.target.value,
              );
              if (selected) onPurposeChange(selected);
            }}
            disabled={pending}
          >
            {source.permittedPurposes.map((item) => (
              <option key={item} value={item}>
                {item.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </>
      )}
      {mode === "excerpt" && (
        <>
          <label htmlFor="reviewed-excerpt-body">Exact text to release</label>
          <textarea
            id="reviewed-excerpt-body"
            value={excerptBody}
            onChange={(event) => onExcerptBodyChange(event.target.value)}
            maxLength={10_000}
            rows={5}
            spellCheck={false}
            disabled={pending}
            required
          />
          <p className="capture-field-note">
            Review this selected text carefully. Recipients see only this
            snapshot, not the original title or recording.
          </p>
        </>
      )}
      {mode === "share" && (
        <p className="capture-field-note">
          This replaces earlier original grants and invalidates previous excerpt
          releases.
        </p>
      )}
      {mode === "revoke" && (
        <p className="capture-field-note">
          This immediately blocks unsent reuse of the original and its reviewed
          excerpts.
        </p>
      )}
      {mode === "erase" && (
        <p className="capture-field-note">
          This removes active source and excerpt text. Already published copies
          outside Cadence cannot be withdrawn here.
        </p>
      )}
      <label className="capture-check-row">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(event) => onConfirmChange(event.target.checked)}
          disabled={pending}
          required
        />
        <span>
          I have reviewed the exact revision, recipients, purpose and effect of
          this action.
        </span>
      </label>
      <button
        className="button-primary"
        type="submit"
        disabled={
          pending ||
          !confirmed ||
          (sharing && (membersError || recipientIds.length === 0))
        }
      >
        {pending
          ? "Saving…"
          : mode === "erase"
            ? "Erase source"
            : mode === "revoke"
              ? "Revoke access"
              : mode === "excerpt"
                ? "Release excerpt"
                : "Share original"}
      </button>
      {error && (
        <p className="capture-message is-error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
