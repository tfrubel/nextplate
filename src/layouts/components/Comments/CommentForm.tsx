"use client";

import { sanitizeMarkdown } from "@/lib/utils/sanitizeMarkdown";
import { FormEvent, useState } from "react";

type Mode = "new" | "reply" | "edit";

type Props = {
  mode: Mode;
  maxLength: number;
  initialValue?: string;
  submitLabel?: string;
  onSubmit: (content: string) => Promise<void> | void;
  onCancel?: () => void;
  autoFocus?: boolean;
};

const CommentForm = ({
  mode,
  maxLength,
  initialValue = "",
  submitLabel,
  onSubmit,
  onCancel,
  autoFocus,
}: Props) => {
  const [value, setValue] = useState<string>(initialValue);
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const placeholder =
    mode === "reply" ? "Write a reply…" : "Share your thoughts…";
  const label =
    submitLabel ??
    (mode === "edit" ? "Save changes" : mode === "reply" ? "Reply" : "Comment");

  const tooLong = value.length > maxLength;
  const canSubmit = value.trim().length > 0 && !tooLong && !submitting;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(value.trim());
      if (mode !== "edit") setValue("");
      setTab("write");
    } catch (err) {
      setError((err as Error).message ?? "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <div className="mb-2 flex gap-2 text-sm">
        <button
          type="button"
          className={`rounded px-3 py-1 ${
            tab === "write"
              ? "bg-primary text-white dark:bg-darkmode-primary dark:text-text-dark"
              : "text-text dark:text-darkmode-text"
          }`}
          onClick={() => setTab("write")}
        >
          Write
        </button>
        <button
          type="button"
          className={`rounded px-3 py-1 ${
            tab === "preview"
              ? "bg-primary text-white dark:bg-darkmode-primary dark:text-text-dark"
              : "text-text dark:text-darkmode-text"
          }`}
          onClick={() => setTab("preview")}
        >
          Preview
        </button>
      </div>

      {tab === "write" ? (
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          rows={mode === "reply" ? 3 : 5}
          className="w-full rounded border border-border bg-body p-3 text-text-dark outline-none focus:border-primary dark:border-darkmode-border dark:bg-darkmode-body dark:text-darkmode-text-light dark:focus:border-darkmode-primary"
        />
      ) : (
        <div className="min-h-[6rem] rounded border border-border bg-body p-4 dark:border-darkmode-border dark:bg-darkmode-body">
          {value.trim() ? (
            <div
              className="content"
              dangerouslySetInnerHTML={{ __html: sanitizeMarkdown(value) }}
            />
          ) : (
            <p className="m-0 text-sm italic text-text dark:text-darkmode-text">
              Nothing to preview yet.
            </p>
          )}
        </div>
      )}

      <div className="mt-2 flex items-center justify-between text-xs text-text dark:text-darkmode-text">
        <span className={tooLong ? "text-[#DB2C23]" : ""}>
          {value.length}/{maxLength}
        </span>
        <span>Markdown supported</span>
      </div>

      {error && (
        <p className="mt-2 text-sm text-[#DB2C23]">{error}</p>
      )}

      <div className="mt-3 flex gap-2">
        <button
          type="submit"
          disabled={!canSubmit}
          className="btn btn-sm btn-primary disabled:opacity-50"
        >
          {submitting ? "Posting…" : label}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-sm btn-outline-primary"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};

export default CommentForm;
