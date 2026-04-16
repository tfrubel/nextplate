"use client";

import { CommentNode } from "@/types";
import { User } from "firebase/auth";
import CommentItem from "./CommentItem";

type Props = {
  nodes: CommentNode[];
  currentUser: User | null;
  postSlug: string;
  maxLength: number;
};

const CommentList = ({ nodes, currentUser, postSlug, maxLength }: Props) => {
  if (nodes.length === 0) {
    return (
      <p className="py-8 text-center text-text dark:text-darkmode-text">
        Be the first to comment.
      </p>
    );
  }
  return (
    <div className="space-y-6">
      {nodes.map((node) => (
        <CommentItem
          key={node.id}
          node={node}
          currentUser={currentUser}
          postSlug={postSlug}
          maxLength={maxLength}
        />
      ))}
    </div>
  );
};

export default CommentList;
