import { prisma } from '@/lib/db'

export type ProjectActivityType =
  | 'thread'
  | 'brainstorm'
  | 'system'
  | 'export'
  | 'version_plan'
  | 'dependency'

export type ProjectActivityItem = {
  type: ProjectActivityType
  id: string
  label: string
  occurredAt: Date
  href: string
}

const PER_SOURCE_LIMIT = 25

function truncate(str: string, max: number): string {
  const t = str.trim()
  return t.length <= max ? t : t.slice(0, max) + '…'
}

/**
 * Fetches recent activity from all project sources, merges and sorts by occurredAt desc.
 * Optional beforeDate: only include items with occurredAt < beforeDate (for cursor/pagination).
 */
export async function listProjectActivity(
  projectId: string,
  limit: number,
  beforeDate?: Date
): Promise<ProjectActivityItem[]> {
  const before = beforeDate ?? new Date()

  const [
    threads,
    brainstorms,
    systems,
    exports,
    versionPlans,
    dependencies,
  ] = await Promise.all([
    prisma.ideaStreamThread.findMany({
      where: { projectId, updatedAt: { lt: before } },
      orderBy: { updatedAt: 'desc' },
      take: PER_SOURCE_LIMIT,
      select: {
        id: true,
        title: true,
        updatedAt: true,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { content: true },
        },
      },
    }),
    prisma.brainstormSession.findMany({
      where: { projectId, createdAt: { lt: before } },
      orderBy: { createdAt: 'desc' },
      take: PER_SOURCE_LIMIT,
      select: { id: true, title: true, createdAt: true },
    }),
    prisma.gameSystem.findMany({
      where: { projectId, createdAt: { lt: before } },
      orderBy: { createdAt: 'desc' },
      take: PER_SOURCE_LIMIT,
      select: { id: true, name: true, systemSlug: true, createdAt: true },
    }),
    prisma.export.findMany({
      where: { projectId, createdAt: { lt: before } },
      orderBy: { createdAt: 'desc' },
      take: PER_SOURCE_LIMIT,
      select: { id: true, exportType: true, createdAt: true },
    }),
    prisma.versionPlan.findMany({
      where: { projectId, createdAt: { lt: before } },
      orderBy: { createdAt: 'desc' },
      take: PER_SOURCE_LIMIT,
      select: { id: true, title: true, versionLabel: true, createdAt: true },
    }),
    prisma.dependency.findMany({
      where: { sourceSystem: { projectId }, createdAt: { lt: before } },
      orderBy: { createdAt: 'desc' },
      take: PER_SOURCE_LIMIT,
      select: {
        id: true,
        createdAt: true,
        sourceSystem: { select: { name: true, systemSlug: true } },
        targetSystem: { select: { name: true, systemSlug: true } },
      },
    }),
  ])

  const items: ProjectActivityItem[] = []

  const base = `/projects/${projectId}`

  for (const t of threads) {
    const lastMsg = t.messages[0] as { content: string } | undefined
    const preview = lastMsg
      ? truncate(lastMsg.content.trim().replace(/\s+/g, ' '), 60)
      : null
    items.push({
      type: 'thread',
      id: t.id,
      label: t.title ? `Thread: ${truncate(t.title, 50)}` : preview ? `Thread: ${preview}` : 'Thread activity',
      occurredAt: t.updatedAt,
      href: `${base}/idea-stream`,
    })
  }

  for (const b of brainstorms) {
    items.push({
      type: 'brainstorm',
      id: b.id,
      label: `New brainstorm: ${truncate(b.title, 50)}`,
      occurredAt: b.createdAt,
      href: `${base}/brainstorms/${b.id}/synthesize`,
    })
  }

  for (const s of systems) {
    items.push({
      type: 'system',
      id: s.id,
      label: `New system: ${truncate(s.name, 50)}`,
      occurredAt: s.createdAt,
      href: `${base}/systems/${s.id}`,
    })
  }

  for (const e of exports) {
    items.push({
      type: 'export',
      id: e.id,
      label: `Export: ${e.exportType}`,
      occurredAt: e.createdAt,
      href: `${base}/export`,
    })
  }

  for (const v of versionPlans) {
    items.push({
      type: 'version_plan',
      id: v.id,
      label: `Version plan: ${truncate(v.title, 50)}`,
      occurredAt: v.createdAt,
      href: `${base}/versions/${v.id}`,
    })
  }

  for (const d of dependencies) {
    const src = d.sourceSystem as { name: string; systemSlug: string }
    const tgt = d.targetSystem as { name: string; systemSlug: string }
    items.push({
      type: 'dependency',
      id: d.id,
      label: `Dependency: ${src.name} → ${tgt.name}`,
      occurredAt: d.createdAt,
      href: `${base}/dependencies`,
    })
  }

  items.sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime())
  return items.slice(0, limit)
}

/**
 * Returns the single most recent activity item per type (thread, brainstorm, system, export, version_plan, dependency).
 * Used for overview "Recent activity" to show last activity of each kind.
 */
export async function getLatestActivityPerType(
  projectId: string
): Promise<ProjectActivityItem[]> {
  const base = `/projects/${projectId}`

  const [
    thread,
    brainstorm,
    system,
    exp,
    versionPlan,
    dependency,
  ] = await Promise.all([
    prisma.ideaStreamThread.findFirst({
      where: { projectId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        updatedAt: true,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { content: true },
        },
      },
    }),
    prisma.brainstormSession.findFirst({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, createdAt: true },
    }),
    prisma.gameSystem.findFirst({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, createdAt: true },
    }),
    prisma.export.findFirst({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, exportType: true, createdAt: true },
    }),
    prisma.versionPlan.findFirst({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, createdAt: true },
    }),
    prisma.dependency.findFirst({
      where: { sourceSystem: { projectId } },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        createdAt: true,
        sourceSystem: { select: { name: true } },
        targetSystem: { select: { name: true } },
      },
    }),
  ])

  const items: ProjectActivityItem[] = []

  if (thread) {
    const lastMsg = thread.messages[0] as { content: string } | undefined
    const preview = lastMsg
      ? truncate(lastMsg.content.trim().replace(/\s+/g, ' '), 60)
      : null
    items.push({
      type: 'thread',
      id: thread.id,
      label: thread.title ? truncate(thread.title, 50) : preview ?? 'Thread activity',
      occurredAt: thread.updatedAt,
      href: `${base}/idea-stream`,
    })
  }
  if (brainstorm) {
    items.push({
      type: 'brainstorm',
      id: brainstorm.id,
      label: truncate(brainstorm.title, 50),
      occurredAt: brainstorm.createdAt,
      href: `${base}/brainstorms/${brainstorm.id}/synthesize`,
    })
  }
  if (system) {
    items.push({
      type: 'system',
      id: system.id,
      label: truncate(system.name, 50),
      occurredAt: system.createdAt,
      href: `${base}/systems/${system.id}`,
    })
  }
  if (exp) {
    items.push({
      type: 'export',
      id: exp.id,
      label: `Export: ${exp.exportType}`,
      occurredAt: exp.createdAt,
      href: `${base}/export`,
    })
  }
  if (versionPlan) {
    items.push({
      type: 'version_plan',
      id: versionPlan.id,
      label: truncate(versionPlan.title, 50),
      occurredAt: versionPlan.createdAt,
      href: `${base}/versions/${versionPlan.id}`,
    })
  }
  if (dependency) {
    const src = dependency.sourceSystem as { name: string }
    const tgt = dependency.targetSystem as { name: string }
    items.push({
      type: 'dependency',
      id: dependency.id,
      label: `${src.name} → ${tgt.name}`,
      occurredAt: dependency.createdAt,
      href: `${base}/dependencies`,
    })
  }

  items.sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime())
  return items
}
