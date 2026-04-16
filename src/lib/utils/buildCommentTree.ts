import { Comment, CommentNode } from "@/types";

/**
 * Build a nested tree from a flat comment list, sorted by createdAt asc within each level.
 * Visual depth is clamped at maxDepth — deeper replies are reparented to the
 * deepest allowed ancestor so the UI never indents past maxDepth.
 */
export const buildCommentTree = (
  comments: Comment[],
  maxDepth: number = 3,
): CommentNode[] => {
  const byId = new Map<string, CommentNode>();
  comments.forEach((c) => {
    byId.set(c.id, { ...c, depth: 0, children: [] });
  });

  const roots: CommentNode[] = [];

  const resolveAnchor = (startParentId: string | null): CommentNode | null => {
    if (!startParentId) return null;
    let current = byId.get(startParentId) ?? null;
    const chain: CommentNode[] = [];
    while (current) {
      chain.unshift(current);
      current = current.parentId ? (byId.get(current.parentId) ?? null) : null;
    }
    // Anchor at the min(chain.length, maxDepth) index — caps visual depth.
    const anchorIndex = Math.min(chain.length, maxDepth) - 1;
    return chain[anchorIndex] ?? null;
  };

  comments.forEach((c) => {
    const node = byId.get(c.id)!;
    if (!c.parentId) {
      node.depth = 0;
      roots.push(node);
      return;
    }
    const anchor = resolveAnchor(c.parentId);
    if (!anchor) {
      node.depth = 0;
      roots.push(node);
      return;
    }
    node.depth = Math.min(anchor.depth + 1, maxDepth);
    anchor.children.push(node);
  });

  const sortByCreated = (a: CommentNode, b: CommentNode) =>
    a.createdAt - b.createdAt;
  const sortRec = (nodes: CommentNode[]) => {
    nodes.sort(sortByCreated);
    nodes.forEach((n) => sortRec(n.children));
  };
  sortRec(roots);

  return roots;
};
