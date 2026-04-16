"use client";

import { isFirebaseConfigured } from "@/lib/firebase/client";
import { subscribeToPostComments } from "@/lib/firebase/comments";
import { buildCommentTree } from "@/lib/utils/buildCommentTree";
import { Comment, CommentNode } from "@/types";
import { useEffect, useMemo, useState } from "react";

type UseCommentsResult = {
  flat: Comment[];
  tree: CommentNode[];
  loading: boolean;
  error: Error | null;
};

export const useComments = (
  postSlug: string,
  maxDepth: number = 3,
): UseCommentsResult => {
  const [flat, setFlat] = useState<Comment[]>([]);
  const [loading, setLoading] = useState<boolean>(isFirebaseConfigured);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured || !postSlug) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = subscribeToPostComments(
      postSlug,
      (list) => {
        setFlat(list);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      },
    );
    return unsub;
  }, [postSlug]);

  const tree = useMemo(() => buildCommentTree(flat, maxDepth), [flat, maxDepth]);

  return { flat, tree, loading, error };
};
