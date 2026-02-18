# System: Idea Stream

## Purpose
Provides a lightweight, always-open collaboration space per project. Users discuss ideas in threads with replies; selected threads can be finalized into a Brainstorm Session and sent into the synthesis pipeline.

## Responsibilities
- Store and serve threads and messages (plain text only)
- Track per-user read state for unread indicators
- Enforce project membership for access
- Support create thread, post message, reply (parent_message_id), edit and soft-delete own messages
- Generate markdown from selected threads and create BrainstormSession (source = "idea-stream", sourceThreadIds)
- Redirect to synthesis flow after finalize
- User identity: display name and avatar (deterministic color); Creator/Responder labels when no display name

## Inputs
- Project reference and current user (from cookie or X-User-Id)
- Thread create: content, optional title
- Message create: content, optional parent_message_id
- Message edit/delete: message id (author-only)
- Mark thread read: thread id
- Finalize: thread_ids[], optional title, optional author_display

## Outputs
- IdeaStreamThread and IdeaStreamMessage records
- IdeaStreamThreadRead records (unread state)
- On finalize: BrainstormSession record with generated markdown and source metadata
- API responses for threads list and thread messages; SSE stream for live updates

## Dependencies
- doc-store (Prisma: AppUser, ProjectMembership, IdeaStreamThread, IdeaStreamMessage, IdeaStreamThreadRead)
- ingestion (consumes finalize output: createBrainstorm with source "idea-stream")

## Code Mapping
- Service: `lib/services/idea-stream.service.ts`
- Repository: `lib/repositories/idea-stream.repository.ts`
- User repository: `lib/repositories/user.repository.ts`
- Current user: `lib/get-current-user.ts`
- Actions: `app/actions/idea-stream.actions.ts`, `app/actions/user.actions.ts`
- API routes: `app/api/projects/[projectId]/idea-stream/threads`, `.../threads/[threadId]/messages`, `.../events` (SSE), `app/api/me`
- Events: `lib/idea-stream-events.ts` (in-process pub/sub for SSE)
- Zod schemas: `createIdeaStreamThreadSchema`, `postIdeaStreamMessageSchema`, `editIdeaStreamMessageSchema`, `finalizeIdeaStreamThreadsSchema`
- UI: `app/(app)/projects/[projectId]/idea-stream/` (page, idea-stream-content client component)

## Current Implementation
- Client subscribes to SSE at `GET .../idea-stream/events` and refetches threads/messages on `threads_updated` and `messages_updated` events. New messages typically appear within a second. Fallback: every 25s (when tab visible) the client also refetches so updates appear even if SSE drops. Each thread row has a refresh button to manually refetch.
- In-process pub/sub in `lib/idea-stream-events.ts`; Server Actions publish after create/post/edit/delete/markRead
- Authz: project membership check (with fallback when no memberships exist for backward compatibility)
- Finalize builds markdown (threads + replies, edited/deleted markers), creates brainstorm session, redirects to `.../brainstorms/[id]/synthesize`
- Per-message read state: each message includes `readBy` (users who have read it); thread list red-dot removed in favor of per-message “read by” mini avatars
- UI behavior: message actions (Reply, Edit, Delete) shown on message hover; Reply available on any message; Edit/Delete only on own messages; composer shows reply preview (author + snippet) when replying
- Project overview shows Idea Stream thread count in quick-stats and recent thread activity (with link to full Activity page)

## Read state
- A message is “read” by user U when U has an IdeaStreamThreadRead row for that thread with `lastReadAt >= message.createdAt`. Derived from existing thread-level read table; no per-message table.
- Author is always considered to have read their own message and is excluded from `readBy` in the UI.
- Unread count for a thread uses messages with `createdAt > lastReadAt`.

## Known Limitations
- SSE is in-process only; use Redis (or similar) pub/sub if scaling to multiple server instances. On serverless the writer and the SSE connection may be in different instances; the 25s fallback poll ensures messages still appear.
- Event bus state lives on `globalThis` so it survives Next.js dev HMR (module re-execution); otherwise publish() would use a new empty channel and the other user would never get events until refresh.
- SSE stream sends a keepalive comment every 15s; client reconnects on error with backoff.
- No thread search in v1
- Prototype identity is cookie-based (cookie/X-User-Id). Users can be created and the "current user" switched in Settings for testing multi-user flows (e.g. Idea Stream as different users).
- No rate limiting on message create

## Target Evolution
- Redis (or similar) pub/sub for SSE when running multiple instances
- Thread search and filters
- Full auth integration (project membership required)
- Optional audit log for message edit/delete

## Change Log
- 2026-02-17: Initial spec and implementation (Idea Stream, full rename from Wall).
- 2026-02-18: SSE for live updates (replace polling); per-message readBy (mini avatars); unread count uses createdAt; thread list red-dot removed; doc updated. Refresh button per thread row; latency note. SSE keepalive (15s) and client reconnection with backoff; serverless note. Event bus on globalThis for dev HMR; 25s visibility-gated fallback poll so messages update without manual refresh.
- 2026-02-18: Message actions on hover; reply to any message; Slack-style reply preview (author + snippet). Overview shows thread count and recent thread activity; Activity page for full history.
