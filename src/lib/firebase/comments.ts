import { Comment } from "@/types";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { getDb } from "./client";

const COLLECTION = "comments";

type NewCommentInput = {
  postSlug: string;
  parentId: string | null;
  content: string;
  authorUid: string;
  authorName: string;
  authorPhoto: string | null;
  authorProvider: "google" | "github";
};

const tsToMs = (t: unknown): number => {
  if (t instanceof Timestamp) return t.toMillis();
  return Date.now();
};

export const addComment = async (input: NewCommentInput): Promise<string> => {
  const ref = await addDoc(collection(getDb(), COLLECTION), {
    ...input,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    edited: false,
    deleted: false,
  });
  return ref.id;
};

export const updateComment = async (id: string, content: string) => {
  await updateDoc(doc(getDb(), COLLECTION, id), {
    content,
    updatedAt: serverTimestamp(),
    edited: true,
  });
};

export const softDeleteComment = async (id: string) => {
  await updateDoc(doc(getDb(), COLLECTION, id), {
    deleted: true,
    content: "",
    updatedAt: serverTimestamp(),
  });
};

export const hardDeleteComment = async (id: string) => {
  await deleteDoc(doc(getDb(), COLLECTION, id));
};

export const subscribeToPostComments = (
  postSlug: string,
  cb: (comments: Comment[]) => void,
  onError?: (err: Error) => void,
): (() => void) => {
  const q = query(
    collection(getDb(), COLLECTION),
    where("postSlug", "==", postSlug),
    orderBy("createdAt", "asc"),
  );
  return onSnapshot(
    q,
    (snap) => {
      const list: Comment[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          postSlug: data.postSlug,
          parentId: data.parentId ?? null,
          content: data.content ?? "",
          authorUid: data.authorUid,
          authorName: data.authorName ?? "Anonymous",
          authorPhoto: data.authorPhoto ?? null,
          authorProvider: data.authorProvider === "github" ? "github" : "google",
          createdAt: tsToMs(data.createdAt),
          updatedAt: tsToMs(data.updatedAt),
          edited: Boolean(data.edited),
          deleted: Boolean(data.deleted),
        };
      });
      cb(list);
    },
    (err) => onError?.(err),
  );
};
