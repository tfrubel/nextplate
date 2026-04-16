import DOMPurify from "dompurify";
import { marked } from "marked";

marked.setOptions({ gfm: true, breaks: true });

/**
 * Render user-supplied markdown to sanitized HTML safe for dangerouslySetInnerHTML.
 * SSR-safe: skips DOMPurify on the server (callers should only render on the client).
 */
export const sanitizeMarkdown = (raw: string): string => {
  if (!raw) return "";
  const html = marked.parse(raw, { async: false }) as string;
  if (typeof window === "undefined") return html;
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ["target", "rel"],
  });
};
