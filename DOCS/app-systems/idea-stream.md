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
- API responses for threads list and thread messages (polling)

## Dependencies
- doc-store (Prisma: AppUser, ProjectMembership, IdeaStreamThread, IdeaStreamMessage, IdeaStreamThreadRead)
- ingestion (consumes finalize output: createBrainstorm with source "idea-stream")

## Code Mapping
- Service: `lib/services/idea-stream.service.ts`
- Repository: `lib/repositories/idea-stream.repository.ts`
- User repository: `lib/repositories/user.repository.ts`
- Current user: `lib/get-current-user.ts`
- Actions: `app/actions/idea-stream.actions.ts`, `app/actions/user.actions.ts`
- API routes: `app/api/projects/[projectId]/idea-stream/threads`, `.../threads/[threadId]/messages`, `app/api/me`
- Zod schemas: `createIdeaStreamThreadSchema`, `postIdeaStreamMessageSchema`, `editIdeaStreamMessageSchema`, `finalizeIdeaStreamThreadsSchema`
- UI: `app/(app)/projects/[projectId]/idea-stream/` (page, idea-stream-content client component)

## Current Implementation
- v1: Client polling every 2s for threads and messages; optimistic UI for own posts
- Authz: project membership check (with fallback when no memberships exist for backward compatibility)
- Finalize builds markdown (threads + replies, edited/deleted markers), creates brainstorm session, redirects to `.../brainstorms/[id]/synthesize`

## Known Limitations
- No WebSockets or SSE; polling only
- No thread search in v1
- Single default user if no auth (cookie/X-User-Id optional)
- No rate limiting on message create

## Target Evolution
- WebSockets or SSE for live updates
- Thread search and filters
- Full auth integration (project membership required)
- Optional audit log for message edit/delete

## Change Log
- 2026-02: Initial spec and implementation (Idea Stream, full rename from Wall).
