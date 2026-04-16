"use client";

import config from "@/config/config.json";
import { useAuthUser } from "@/hooks/useAuthUser";
import { useComments } from "@/hooks/useComments";
import { addComment } from "@/lib/firebase/comments";
import { isFirebaseConfigured } from "@/lib/firebase/client";
import AuthButtons from "./AuthButtons";
import CommentForm from "./CommentForm";
import CommentList from "./CommentList";

type Props = {
  postSlug: string;
  className?: string;
};

const Comments = ({ postSlug, className }: Props) => {
  const { comments } = config;
  const { user, loading: authLoading } = useAuthUser();
  const { tree, loading: commentsLoading, error } = useComments(
    postSlug,
    comments.max_depth,
  );

  if (!comments.enable) return null;

  if (!isFirebaseConfigured) {
    return (
      <section className={className}>
        <h3 className="h4 mb-4">Comments</h3>
        <div className="rounded bg-light p-6 text-center dark:bg-darkmode-light">
          <p className="m-0 text-text dark:text-darkmode-text">
            Comments are not configured. Set the{" "}
            <code className="rounded bg-body px-1 dark:bg-darkmode-body">
              NEXT_PUBLIC_FIREBASE_*
            </code>{" "}
            environment variables to enable them.
          </p>
        </div>
      </section>
    );
  }

  const handleTopLevelSubmit = async (content: string) => {
    if (!user) return;
    await addComment({
      postSlug,
      parentId: null,
      content,
      authorUid: user.uid,
      authorName: user.displayName ?? "Anonymous",
      authorPhoto: user.photoURL ?? null,
      authorProvider:
        user.providerData[0]?.providerId === "github.com" ? "github" : "google",
    });
  };

  return (
    <section className={className}>
      <h3 className="h4 mb-6">
        Comments{tree.length > 0 && ` (${tree.length})`}
      </h3>

      <div className="mb-8">
        <AuthButtons
          user={user}
          providers={comments.providers as string[]}
        />
        {user && !authLoading && (
          <CommentForm
            mode="new"
            maxLength={comments.max_length}
            onSubmit={handleTopLevelSubmit}
          />
        )}
      </div>

      {error && (
        <p className="mb-4 text-sm text-[#DB2C23]">
          Failed to load comments: {error.message}
        </p>
      )}

      {commentsLoading ? (
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded bg-light dark:bg-darkmode-light"
            />
          ))}
        </div>
      ) : (
        <CommentList
          nodes={tree}
          currentUser={user}
          postSlug={postSlug}
          maxLength={comments.max_length}
        />
      )}
    </section>
  );
};

export default Comments;
