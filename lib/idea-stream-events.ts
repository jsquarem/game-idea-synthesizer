/**
 * In-process pub/sub for Idea Stream project events.
 * Used by the SSE events route to push updates; Server Actions publish after mutations.
 * Single-instance only; use Redis (or similar) if you scale to multiple servers.
 * Channels are stored on globalThis so they survive Next.js dev HMR (module re-execution).
 */

export type IdeaStreamEvent =
  | { type: 'threads_updated' }
  | { type: 'messages_updated'; threadId: string }

type Listener = (event: IdeaStreamEvent) => void

const globalKey = '__idea_stream_events_channels__' as const
function getChannels(): Map<string, Set<Listener>> {
  const g = globalThis as unknown as { [key: string]: Map<string, Set<Listener>> }
  if (!g[globalKey]) g[globalKey] = new Map()
  return g[globalKey]
}

function getChannel(projectId: string): Set<Listener> {
  const channels = getChannels()
  let set = channels.get(projectId)
  if (!set) {
    set = new Set()
    channels.set(projectId, set)
  }
  return set
}

export function subscribe(
  projectId: string,
  listener: Listener
): () => void {
  const channels = getChannels()
  const set = getChannel(projectId)
  set.add(listener)
  return () => {
    set.delete(listener)
    if (set.size === 0) channels.delete(projectId)
  }
}

export function publish(projectId: string, event: IdeaStreamEvent): void {
  const channels = getChannels()
  const set = channels.get(projectId)
  if (!set) return
  for (const listener of set) {
    try {
      listener(event)
    } catch (e) {
      console.error('[idea-stream-events] listener error:', e)
    }
  }
}
