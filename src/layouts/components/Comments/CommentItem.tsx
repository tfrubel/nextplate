"use client";

import {
  addComment,
  softDeleteComment,
  updateComment,
} from "@/lib/firebase/comments";
import { sanitizeMarkdown } from "@/lib/utils/sanitizeMarkdown";
import { CommentNode } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { User } from "firebase/auth";
import { useState } from "react";
import { FaGithub, FaGoogle } from "react-icons/fa";
import CommentForm from "./CommentForm";

type Props = {
  node: CommentNode;
  currentUser: User | null;
  postSlug: string;
  maxLength: number;
};

const ProviderIcon = ({ provider }: { provider: "google" | "github" }) =>
  provider === "github" ? (
    <FaGithub className="text-text dark:text-darkmode-text" />
  ) : (
    <FaGoogle className="text-text dark:text-darkmode-text" />
  );

const CommentItem = ({ node, currentUser, postSlug, maxLength }: Props) => {
  const [replying, setReplying] = useState(false);
  const [editing, setEditing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const isOwn = currentUser?.uid === node.authorUid && !node.deleted;
  const relative =
    node.createdAt > 0
      ? formatDistanceToNow(node.createdAt, { addSuffix: true })
      : "just now";

  const handleReply = async (content: string) => {
    if (!currentUser) return;
    await addComment({
      postSlug,
      parentId: node.id,
      content,
      authorUid: currentUser.uid,
      authorName: currentUser.displayName ?? "Anonymous",
      authorPhoto: currentUser.photoURL ?? null,
      authorProvider:
        currentUser.providerData[0]?.providerId === "github.com"
          ? "github"
          : "google",
    });
    setReplying(false);
  };

  const handleEdit = async (content: string) => {
    await updateComment(node.id, content);
    setEditing(false);
  };

  const handleDelete = async () => {
    if (!confirm("Delete this comment? This cannot be undone.")) return;
    setActionError(null);
    try {
      await softDeleteComment(node.id);
    } catch (err) {
      setActionError((err as Error).message ?? "Failed to delete");
    }
  };

  return (
    <div className="comment-item">
      <article className="rounded bg-light p-5 dark:bg-darkmode-light">
        <header className="mb-3 flex items-center gap-3">
          {node.authorPhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={node.authorPhoto}
              alt={node.authorName}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary font-semibold text-white dark:bg-darkmode-primary dark:text-text-dark">
              {node.authorName.charAt(0).toUpperCase()}
            </span>
          )}
          <div className="flex-1">
            <p className="m-0 flex items-center gap-2 font-semibold text-text-dark dark:text-darkmode-text-light">
              {node.deleted ? "[deleted]" : node.authorName}
              {!node.deleted && <ProviderIcon provider={node.authorProvider} />}
            </p>
            <p className="m-0 text-xs text-text dark:text-darkmode-text">
              {relative}
              {node.edited && !node.deleted && " · edited"}
            </p>
          </div>
        </header>

        {node.deleted ? (
          <p className="m-0 italic text-text dark:text-darkmode-text">
            This comment was removed.
          </p>
        ) : editing ? (
          <CommentForm
            mode="edit"
            maxLength={maxLength}
            initialValue={node.content}
            onSubmit={handleEdit}
            onCancel={() => setEditing(false)}
            autoFocus
          />
        ) : (
          <div
            className="content"
            dangerouslySetInnerHTML={{
              __html: sanitizeMarkdown(node.content),
            }}
          />
        )}

        {!node.deleted && !editing && (
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            {currentUser && (
              <button
                type="button"
                onClick={() => setReplying((v) => !v)}
                className="text-text-dark hover:text-primary dark:text-darkmode-text-light dark:hover:text-darkmode-primary"
              >
                {replying ? "Cancel" : "Reply"}
              </button>
            )}
            {isOwn && (
              <>
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="text-text-dark hover:text-primary dark:text-darkmode-text-light dark:hover:text-darkmode-primary"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="text-text-dark hover:text-[#DB2C23] dark:text-darkmode-text-light"
                >
                  Delete
                </button>
              </>
            )}
          </div>
        )}

        {actionError && (
          <p className="mt-2 text-sm text-[#DB2C23]">{actionError}</p>
        )}

        {replying && currentUser && (
          <CommentForm
            mode="reply"
            maxLength={maxLength}
            onSubmit={handleReply}
            onCancel={() => setReplying(false)}
            autoFocus
          />
        )}
      </article>

      {node.children.length > 0 && (
        <div className="mt-4 space-y-4 border-l border-border pl-4 dark:border-darkmode-border md:pl-6">
          {node.children.map((child) => (
            <CommentItem
              key={child.id}
              node={child}
              currentUser={currentUser}
              postSlug={postSlug}
              maxLength={maxLength}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentItem;
