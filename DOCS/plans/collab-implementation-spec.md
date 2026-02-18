# GamePlan AI — Idea Stream (Collaboration Module)
Date: 2026-02-18  
Scope: Lightweight, always-open collaboration space per project. Threads + replies. Plain text only. Live updates (no full page refresh). Finalize selected threads → generate Brainstorm doc → Synthesize.

---

## 1) UX Summary
- New project nav item: **Idea Stream**
- 2-panel layout:
  - **Left:** thread list (newest activity, unread indicator)
  - **Right:** active thread (messages + inline replies)
- Posting:
  - Quick “new thread” input (one box)
  - Reply to any message (inline reply)
  - Plain text only (no types/tags/labels)
- Live:
  - New threads/messages appear without page reload (v1: client polling/refresh loop)
- Finalize:
  - Select one or more threads → “Finalize + Synthesize”
  - Generates a **Brainstorm Session** markdown document that contains full threads + replies
  - Then routes user into the existing synthesis flow for that brainstorm session
- Edit/Delete:
  - Users can edit/delete their own messages
  - Edits show “(edited)” marker; deletes show “message deleted” tombstone

---

## 2) Identity / Display Rules

### User display name
- Add a **display name** setting accessible via clicking avatar in top bar:
  - If set: show initials from display name
  - If not set: fall back to role label per thread:
    - “Creator” = the author of the first message in the thread
    - “Responder” = everyone else in that thread

- Avatar colors:
  - Deterministic color derived from user id hash (or role label if no display name)
  - Creator and Responder should be distinct colors by default when no display names

---

## 3) Live Updates (v1)

### v1 approach (simple)
- Use client polling/refetch every **2 seconds** while Idea Stream page is open:
  - Threads list endpoint returns updated threads + last activity + unread state
  - Messages endpoint returns new messages since last fetch
- Use optimistic UI for posting (append locally, reconcile on response)
- Later upgrade path (not in v1): WebSockets or SSE

---

## 4) Data Model (Prisma/Postgres)

> Naming is suggestion; use existing conventions.

### Tables

#### `users`
- `id` (string/cuid)
- `email`
- `display_name` (nullable string)
- `avatar_color` (nullable string) — optional if computed

#### `projects`
- existing

#### `project_memberships`
- existing (controls who can access Idea Stream)

#### `idea_stream_threads`
- `id` (cuid)
- `project_id` (fk)
- `created_by_user_id` (fk)
- `title` (nullable string) — optional; if null, derive from first message snippet in UI
- `created_at`
- `updated_at` (bumped on new message/edit)

#### `idea_stream_messages`
- `id` (cuid)
- `project_id` (fk)
- `thread_id` (fk)
- `parent_message_id` (nullable fk -> idea_stream_messages.id)  // reply-to relationship
- `author_user_id` (fk)
- `content` (text)
- `created_at`
- `updated_at`
- `edited_at` (nullable)
- `deleted_at` (nullable)
- `deleted_by_user_id` (nullable fk)
- Indexes:
  - (thread_id, created_at)
  - (project_id, updated_at)
  - (parent_message_id)

#### `idea_stream_thread_reads`
- `id` (cuid)
- `project_id` (fk)
- `thread_id` (fk)
- `user_id` (fk)
- `last_read_at` (timestamp)
- Unique constraint: (thread_id, user_id)

#### `brainstorm_sessions`
- existing (target for finalize)
  - Ensure it supports `content_markdown` and metadata such as `source = "idea-stream"` and `source_thread_ids`

#### `audit_log` (optional but recommended)
- `id`
- `entity_type` (“idea_stream_message”)
- `entity_id`
- `action` (“edit” | “delete”)
- `actor_user_id`
- `before` (jsonb)
- `after` (jsonb)
- `created_at`

---

## 5) API / Server Actions

Prefer Server Actions where already used; route handlers are fine for polling.

### AuthZ
- Every endpoint must verify user is a project member.

### Endpoints (suggested)

#### Threads list (left panel)
`GET /api/projects/:projectId/idea-stream/threads?cursor=&limit=30`

Returns:
- threads with:
  - id
  - created_at
  - updated_at
  - created_by_user_id
  - last_message_preview (derived)
  - last_activity_at (max message created/edited)
  - unread (boolean for current user)
  - unread_count (optional; can be computed as messages after last_read_at)

#### Thread detail (messages)
`GET /api/projects/:projectId/idea-stream/threads/:threadId/messages?since=<iso>`

Returns:
- messages sorted by created_at asc
- include deleted state:
  - if deleted_at: return `{ deleted: true }` and omit content or return empty content

#### Create thread + first message
`POST /api/projects/:projectId/idea-stream/threads`

Body:
- `content` (string, required)
- `title` (optional; if omitted, derive later)

Returns created thread + message.

#### Post message (reply or normal)
`POST /api/projects/:projectId/idea-stream/threads/:threadId/messages`

Body:
- `content` (string, required)
- `parent_message_id` (nullable) — when replying to a message

Returns created message.

#### Edit message
`PATCH /api/projects/:projectId/idea-stream/messages/:messageId`

Body:
- `content` (string, required)

Rules:
- only author can edit
- set edited_at, updated_at

#### Delete message
`DELETE /api/projects/:projectId/idea-stream/messages/:messageId`

Rules:
- only author can delete (v1)
- soft delete: set deleted_at, deleted_by_user_id

#### Mark thread read
`POST /api/projects/:projectId/idea-stream/threads/:threadId/read`

Body:
- `last_read_at` (optional; default now)

Behavior:
- upsert idea_stream_thread_reads

#### Finalize selected threads → create brainstorm session
`POST /api/projects/:projectId/idea-stream/finalize`

Body:
- `thread_ids: string[]` (required)
- `title` (optional)
- `author_display` (optional; can be current user display name)

Returns:
- `brainstorm_session_id`

Then UI navigates:
- `/projects/:projectId/brainstorms/:sessionId` (or your existing synthesize route)

---

## 6) Markdown Generation for Finalize (Thread(s) → Brainstorm content)

When finalizing, generate markdown like:

```md
# Idea Stream Finalize — <Project Name>
Generated: <ISO timestamp>
Threads: <count>

---

## Thread 1 — <derived title or first line snippet>
Created by: <Creator label or initials>
Created at: <timestamp>

- <time> <name>: <content>
  - reply to <message-id-or-short-ref> by <name>: <content>
- <time> <name>: <content>

---

## Thread 2 — ...
...
```

### Rules:
- Include full thread + replies
- Preserve chronological order in each thread
- Replies:
  - Either nest under parent or include ↳ reply to <name @ time>
- Deleted messages:
  - Render as: `- <time> <name>: (deleted)`

Store:
- `brainstorm_sessions.source = "idea-stream"`
- `brainstorm_sessions.source_thread_ids = [...]`

---

## 7) UI Implementation Details (Next.js App Router)

### Route
Add: `/projects/[projectId]/idea-stream/page.tsx`

Layout: 2 panels  
Use Resizable (shadcn) optional; otherwise fixed widths:

- Left: 360px (min 280)
- Right: fill

---

### Left Panel: Thread List

Elements:

Header:
- Title “Idea Stream”
- Button: “New Thread”
- Search (optional v1.1; skip for v1)

List items:
- derived title/snippet (1 line)
- last activity time
- unread dot/badge

Multi-select:
- checkbox per thread for finalize selection

Footer action:
- Button: “Finalize + Synthesize” (enabled when >=1 selected)

Behavior:
- Poll threads list every 2s
- Clicking a thread opens it on the right and calls mark-read

---

### Right Panel: Active Thread

Header:
- Thread title/snippet
- meta: created by, created at
- Optional: “Copy link” (v1.1)

Messages:
- Chronological

Each message row:
- Avatar (initials or Creator/Responder)
- Name label
- Timestamp
- Content
- Actions (on hover):
  - Reply
  - Edit (only author; not deleted)
  - Delete (only author; not deleted)
- Edited marker if edited_at
- Deleted tombstone if deleted_at

Reply UX:
- Clicking Reply opens an inline input anchored to bottom composer:
  - Shows “Replying to <name>: <snippet>” with cancel X
  - Sends `parent_message_id`

Composer (sticky bottom):
- Textarea (plain text)
- Send button
- Enter-to-send (optional) + Shift+Enter newline

Live updates:
- Poll messages every 2s using `since=lastSeenTimestamp` (or just refetch full list in v1)
- If user is scrolled near bottom, auto-scroll on new messages; otherwise show “New messages” pill

Read tracking:
- On opening thread: set `last_read_at = now`
- Update unread indicators based on `(thread.last_activity_at > last_read_at)`

---

## 8) Settings: Display Name

Add to Settings or Avatar dropdown modal:
- “Display name” input
- Save button

Used immediately for Idea Stream avatar labels.

If display name is empty:
- use Creator/Responder labeling per thread

---

## 9) Minimal State Strategy

Keep global state light:
- `activeThreadId`
- `selectedThreadIds` (for finalize)
- `replyToMessageId` (nullable)
- draft message content

Prefer server as source of truth; client polling keeps it fresh.

---

## 10) Validation & Limits (v1)

- Thread create requires non-empty content (trimmed)
- Message create requires non-empty content
- Max message length: 10,000 chars (soft limit; enforce server-side)
- Rate limiting optional (v1.1)

---

## 11) Acceptance Criteria

- Project members can open Idea Stream and see threads/messages
- New message by partner appears within 2 seconds without page refresh
- Replying to a message creates a visible threaded reply relationship
- Edit/delete works with proper markers/tombstones
- Unread indicator works per user per thread
- Selecting threads and clicking Finalize creates a Brainstorm Session with full thread + replies and navigates to synthesis flow

---

## 12) Implementation Order (Suggested)

1. DB schema + Prisma migrations  
2. Threads list + create thread  
3. Thread messages + post message + replies  
4. Polling + unread tracking  
5. Edit/delete  
6. Finalize → brainstorm markdown generation → navigate to synthesize  
7. Settings display name  

End of spec.