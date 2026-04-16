# Custom Comments System — Replace Disqus

## Context

The blog currently uses Disqus (`src/layouts/components/Disqus.tsx`, wired in `src/app/blog/[single]/page.tsx:132`). Disqus is third-party, ad-injecting, slow, and leaks reader data. Goal: self-hosted, privacy-respecting, fully-styled comments matching the project's Tailwind v4 design system, with threaded replies and markdown.

**Stack decisions (chosen by user):**

- **Storage**: Firebase Firestore (client SDK only — no API routes)
- **Auth**: Firebase Auth with Google + GitHub OAuth
- **Features**: Nested replies + Markdown formatting
- **Moderation**: Auto-approve all (delete via Firebase console if needed)

Outcome: blog posts get a native-feeling comments block, users sign in with Google/GitHub, post threaded markdown comments, see live updates from other readers, with full dark-mode parity and zero third-party trackers.

## Architecture at a glance

- Single flat `comments` Firestore collection; thread built client-side from `parentId`.
- One composite index: `(postSlug ASC, createdAt ASC)`.
- Real-time UI via `onSnapshot` (one listener per mounted post page).
- All UI components are `"use client"`; server `page.tsx` only renders the `<Comments>` entrypoint.
- Markdown: existing `marked@17` + new `dompurify` for XSS-safe rendering through `.content` prose styling.

## Firestore schema — `comments/{autoId}`

| Field            | Type                 | Notes                          |
| ---------------- | -------------------- | ------------------------------ |
| `postSlug`       | string               | matches `Post.slug`            |
| `parentId`       | string \| null       | null = top-level               |
| `content`        | string               | raw markdown, ≤ `max_length`   |
| `authorUid`      | string               | from Firebase Auth             |
| `authorName`     | string               | `displayName` \|\| "Anonymous" |
| `authorPhoto`    | string \| null       | Google/GitHub avatar URL       |
| `authorProvider` | "google" \| "github" | for provider icon              |
| `createdAt`      | Timestamp            | `serverTimestamp()`            |
| `updatedAt`      | Timestamp            | set on edit                    |
| `edited`         | boolean              | show "(edited)" badge          |
| `deleted`        | boolean              | soft delete — preserves thread |

**Index (set via Firebase console or `firestore.indexes.json`):** composite `postSlug` ASC + `createdAt` ASC.

## Firestore security rules (user pastes into Firebase console)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {
    match /comments/{id} {
      allow read: if true;
      allow create: if request.auth != null
        && request.resource.data.authorUid == request.auth.uid
        && request.resource.data.content is string
        && request.resource.data.content.size() > 0
        && request.resource.data.content.size() <= 5000
        && request.resource.data.postSlug is string;
      allow update: if request.auth.uid == resource.data.authorUid
        && request.resource.data.authorUid == resource.data.authorUid
        && request.resource.data.createdAt == resource.data.createdAt;
      allow delete: if request.auth.uid == resource.data.authorUid;
    }
  }
}
```

## Files to create

### Firebase glue

- **`src/lib/firebase/client.ts`** — singleton init (`getApps().length ? getApp() : initializeApp(cfg)`); exports `app`, `auth`, `db`. Reads `NEXT_PUBLIC_FIREBASE_*` env vars.
- **`src/lib/firebase/auth.ts`** — `signInWithGoogle()`, `signInWithGithub()`, `signOutUser()` via `signInWithPopup` with `signInWithRedirect` fallback on `auth/popup-blocked`.
- **`src/lib/firebase/comments.ts`** — `addComment()`, `updateComment()`, `softDeleteComment()`, `subscribeToPostComments(slug, cb)` returning unsubscribe fn.

### Utilities

- **`src/lib/utils/buildCommentTree.ts`** — pure: flat `Comment[]` → `CommentNode[]` tree; clamps visual depth at `max_depth`, flattens deeper replies under last indented ancestor with `@parentAuthor` prefix.
- **`src/lib/utils/sanitizeMarkdown.ts`** — `marked.parse(raw, { gfm: true, breaks: true })` → `DOMPurify.sanitize(html, { USE_PROFILES: { html: true } })`.

### Hooks

- **`src/hooks/useAuthUser.ts`** — `onAuthStateChanged` subscription, returns `{ user, loading }`.
- **`src/hooks/useComments.ts`** — wraps `subscribeToPostComments`; returns `{ tree, flat, loading, error }`.

### UI (all `"use client"`, co-located)

- **`src/layouts/components/Comments/Comments.tsx`** — container. Reads `config.comments.enable` (bails if false). Renders `<AuthButtons>` or `<CommentForm>` based on auth state, then `<CommentList>`. Accepts `postSlug`, `className` props.
- **`src/layouts/components/Comments/CommentList.tsx`** — maps top-level `CommentNode[]` to `CommentItem`.
- **`src/layouts/components/Comments/CommentItem.tsx`** — recursive. Shows avatar (rounded-full), author name + provider icon (FaGoogle/FaGithub from `react-icons`), relative time (`date-fns` already installed), rendered markdown body, Reply/Edit/Delete buttons for own comments. Branches on `deleted` to render `[deleted]` placeholder while keeping children.
- **`src/layouts/components/Comments/CommentForm.tsx`** — textarea + Write/Preview tabs + Submit. Reused for new / reply / edit via `mode` prop. Uses `.btn .btn-primary`.
- **`src/layouts/components/Comments/AuthButtons.tsx`** — Google + GitHub sign-in buttons gated on `config.comments.providers`, plus sign-out.

### Config & env

- **`.env.example`** — Firebase public keys template.

## Files to modify

| File                                 | Change                                                                                  |
| ------------------------------------ | --------------------------------------------------------------------------------------- |
| `src/app/blog/[single]/page.tsx:2`   | Import swap: `Disqus` → `Comments`                                                      |
| `src/app/blog/[single]/page.tsx:132` | `<Disqus className="mt-20" />` → `<Comments postSlug={post.slug!} className="mt-20" />` |
| `src/config/config.json:48-52`       | Replace `disqus` block with `comments` block (see below)                                |
| `src/types/index.d.ts`               | Append `Comment` + `CommentNode` types, following existing `Post`/`Author` style        |
| `package.json`                       | `+firebase`, `+dompurify`, `+@types/dompurify` (dev), `-disqus-react`                   |
| `src/layouts/components/Disqus.tsx`  | **Delete** after swap confirmed                                                         |

## New config block (`src/config/config.json`)

```json
"comments": {
  "enable": true,
  "providers": ["google", "github"],
  "max_depth": 3,
  "max_length": 5000
}
```

Consumed as `const { comments } = config` — same pattern as existing `disqus`, `google_tag_manager`, `announcement` blocks.

## New types (`src/types/index.d.ts`)

```ts
export type Comment = {
  id: string;
  postSlug: string;
  parentId: string | null;
  content: string;
  authorUid: string;
  authorName: string;
  authorPhoto: string | null;
  authorProvider: "google" | "github";
  createdAt: number; // ms since epoch after converting from Timestamp
  updatedAt: number;
  edited: boolean;
  deleted: boolean;
};

export type CommentNode = Comment & {
  depth: number;
  children: CommentNode[];
};
```

## Env vars (`.env.example`)

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

User creates `.env.local` from this template.

## Dependencies

```
yarn add firebase dompurify
yarn add -D @types/dompurify
yarn remove disqus-react
```

`marked@17` already in `package.json:25`.

## Design / UX decisions

- **Card style**: `rounded bg-light p-5 dark:bg-darkmode-light` (matches `AuthorCard` pattern).
- **Avatar**: 40px `rounded-full` with fallback initial on `object-cover`.
- **Nesting**: indent via `border-l border-border dark:border-darkmode-border pl-4` per depth level; cap at `max_depth` (default 3).
- **Buttons**: reuse `.btn .btn-sm .btn-outline-primary` for Reply/Cancel, `.btn .btn-sm .btn-primary` for Submit. Sign-in buttons use same classes + provider icon.
- **Markdown body**: wrap sanitized HTML in `<div className="content">` (existing prose class).
- **Relative time**: `date-fns` `formatDistanceToNow` — already installed.
- **Loading state**: skeleton rows (pulse bg-light dark:bg-darkmode-light).
- **Empty state**: "Be the first to comment" centered.
- **Optimistic post**: temp `id: "temp-<uuid>"` rendered immediately with reduced opacity; replaced when snapshot fires.

## Verification (end-to-end)

1. Create Firebase project at console.firebase.google.com. Enable Firestore (production mode) and Authentication.
2. Auth → Sign-in method: enable **Google** (one click) and **GitHub** (create OAuth app at github.com/settings/developers, paste Client ID + Secret).
3. Firestore → Rules: paste rules from above, Publish.
4. Firestore → Indexes: create composite `postSlug ASC, createdAt ASC` on `comments`.
5. Project settings → copy web-app config, paste into `.env.local`.
6. `yarn install && yarn dev`.
7. Open `/blog/<any-slug>` → comments block renders with sign-in buttons.
8. Sign in with Google → avatar + form appear.
9. Post `**bold** and [link](https://example.com)` → renders formatted.
10. Reply → nested card indents one level.
11. Reply 4 deep → fourth level flattens under third with `@parentAuthor` prefix.
12. Delete own comment → `[deleted]` placeholder, replies persist.
13. Submit `<script>alert(1)</script>` → renders as escaped text (XSS test).
14. Toggle theme → card uses `dark:bg-darkmode-light`, borders adapt.
15. Open second browser → post in one, watch other update live.

## Risks & edge cases

- **XSS**: every render goes through DOMPurify. Sanitize is non-negotiable — logged-in user can write any string, rules only cap length.
- **SSR**: Firebase SDK and auth state are browser-only. `Comments.tsx` must be `"use client"`; server `page.tsx` just passes `postSlug`.
- **Quota**: per-post `onSnapshot` is fine at blog scale. Listener unsubscribes on unmount. No listeners on list/home pages.
- **Popup blockers**: `signInWithPopup` → fallback `signInWithRedirect` on `auth/popup-blocked`.
- **GitHub email privacy**: `displayName` may be null — fallback to `"Anonymous"`.
- **Rate limiting**: not enforceable in rules alone. Acceptable for low-traffic personal blog; future Cloud Function if abused.
- **Soft delete**: `deleted: true` + blank `content` preserves thread integrity.

## Critical files (absolute paths)

- `/Users/rubel/Developments/Internal/nextplate-tfrubel/src/app/blog/[single]/page.tsx` (swap usage)
- `/Users/rubel/Developments/Internal/nextplate-tfrubel/src/config/config.json` (new `comments` block)
- `/Users/rubel/Developments/Internal/nextplate-tfrubel/src/types/index.d.ts` (new `Comment`/`CommentNode` types)
- `/Users/rubel/Developments/Internal/nextplate-tfrubel/package.json` (dep changes)
- `/Users/rubel/Developments/Internal/nextplate-tfrubel/src/layouts/components/Disqus.tsx` (delete)
