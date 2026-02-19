import type {
  SnapshotContent,
  SnapshotProject,
  SnapshotChangesSummary,
  SnapshotSystem,
  SnapshotSystemDetail,
  SnapshotDependencyGraph,
  SnapshotVersionPlan,
  DeltaEntity,
  AssembledSynthesisContext,
} from './context-builder.types'
import { findProjectById } from '@/lib/repositories/project.repository'
import { getAllGameSystems } from '@/lib/repositories/game-system.repository'
import { listSystemDetailsByProjectId } from '@/lib/repositories/system-detail.repository'
import { listDependenciesByProject } from '@/lib/repositories/dependency.repository'
import { listVersionPlans } from '@/lib/repositories/version-plan.repository'
import { listBrainstorms } from '@/lib/repositories/brainstorm.repository'
import { derivePurposeFromSystemDetails } from './system-detail-roll-up.service'
import { buildGraph, topologicalSort } from '@/lib/graph/graph-engine'
import type { GraphNode, GraphEdge } from '@/lib/graph/types'
import type { ProjectContextSnapshot } from '@prisma/client'

const CONTENT_VERSION = 1
const SPEC_SNIPPET_MAX_LEN = 500

function specSnippet(spec: string): string {
  if (spec.length <= SPEC_SNIPPET_MAX_LEN) return spec
  return spec.slice(0, SPEC_SNIPPET_MAX_LEN) + '...'
}

/**
 * Build full context (when no snapshot exists). Produces payload matching plan §1.3.
 */
export async function buildFullContext(projectId: string): Promise<SnapshotContent> {
  const [project, systems, systemDetailsByProject, deps, versionPlans, brainstorms] =
    await Promise.all([
      findProjectById(projectId),
      getAllGameSystems(projectId),
      listSystemDetailsByProjectId(projectId),
      listDependenciesByProject(projectId),
      listVersionPlans(projectId),
      listBrainstorms({ projectId }, { pageSize: 100 }),
    ])

  if (!project) throw new Error('Project not found')

  const systemDetailMap = new Map<string, SnapshotSystemDetail[]>()
  const fullSystemDetailsBySystemId = new Map<string, (typeof systemDetailsByProject)[number][]>()
  for (const b of systemDetailsByProject) {
    const list = systemDetailMap.get(b.gameSystemId) ?? []
    list.push({
      id: b.id,
      name: b.name,
      detailType: b.detailType,
      specSnippet: specSnippet(b.spec),
      sourceSynthesisId: b.synthesizedOutputId,
    })
    systemDetailMap.set(b.gameSystemId, list)
    const fullList = fullSystemDetailsBySystemId.get(b.gameSystemId) ?? []
    fullList.push(b)
    fullSystemDetailsBySystemId.set(b.gameSystemId, fullList)
  }

  const slugById = new Map(systems.map((s) => [s.id, s.systemSlug]))
  const snapshotSystems: SnapshotSystem[] = systems.map((s) => {
    const sysDetails = systemDetailMap.get(s.id) ?? []
    const fullDetails = fullSystemDetailsBySystemId.get(s.id) ?? []
    const purpose =
      s.purpose?.trim() ||
      (fullDetails.length ? derivePurposeFromSystemDetails(fullDetails) : null)
    return {
    slug: s.systemSlug,
    name: s.name,
    version: s.version,
    purpose: purpose ?? null,
    currentState: s.currentState ?? null,
    targetState: s.targetState ?? null,
    dependencies: deps
      .filter((d) => d.sourceSystemId === s.id)
      .map((d) => slugById.get(d.targetSystemId) ?? d.targetSystemId),
    mvpCriticality: s.mvpCriticality,
    lastUpdated: s.updatedAt.toISOString(),
    systemDetails: sysDetails,
  }
  })

  const nodes: GraphNode[] = systems.map((s) => ({
    id: s.id,
    label: s.name,
    metadata: { slug: s.systemSlug },
  }))
  const edges: GraphEdge[] = deps.map((d) => ({
    source: d.sourceSystemId,
    target: d.targetSystemId,
    type: d.dependencyType,
  }))
  const graph = buildGraph(nodes, edges)
  const order = topologicalSort(graph)
  const slugOrder = order
    ?.map((id) => systems.find((s) => s.id === id)?.systemSlug)
    .filter(Boolean) as string[] | undefined

  const dependencyGraph: SnapshotDependencyGraph = {
    edges: deps.map((d) => ({
      sourceSlug: d.sourceSystem.systemSlug,
      targetSlug: d.targetSystem.systemSlug,
      type: d.dependencyType,
    })),
    topologicalOrder: slugOrder,
  }

  const snapshotVersionPlans: SnapshotVersionPlan[] = versionPlans.data.map(
    (vp) => ({
      versionLabel: vp.versionLabel,
      status: vp.status,
      includedSystemSlugs: JSON.parse(vp.includedSystems || '[]') as string[],
      phases: vp.phases ? JSON.parse(vp.phases) : undefined,
      implementationOrder: vp.implementationOrder
        ? JSON.parse(vp.implementationOrder)
        : undefined,
    })
  )

  const changesSummary: SnapshotChangesSummary = {
    brainstormsAdded: {
      count: brainstorms.total,
      titles: brainstorms.data.map((b) => b.title),
      dates: brainstorms.data.map((b) => b.createdAt.toISOString()),
    },
    systemsAddedUpdated: {
      slugs: systems.map((s) => s.systemSlug),
    },
    dependenciesAddedRemoved: {
      added: deps.length,
      removed: 0,
    },
    versionPlansCreatedFinalized: {
      labels: versionPlans.data.map((vp) => vp.versionLabel),
      statuses: versionPlans.data.map((vp) => vp.status),
    },
  }

  const snapshotProject: SnapshotProject = {
    name: project.name,
    description: project.description ?? null,
    genre: project.genre ?? null,
    platform: project.platform ?? null,
    status: project.status,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  }

  return {
    schemaVersion: CONTENT_VERSION,
    project: snapshotProject,
    changesSummary,
    systems: snapshotSystems,
    dependencyGraph,
    versionPlans: snapshotVersionPlans,
    brainstormsSummary: {
      count: brainstorms.total,
      titles: brainstorms.data.map((b) => b.title),
      dates: brainstorms.data.map((b) => b.createdAt.toISOString()),
    },
  }
}

/**
 * Build delta since snapshot: entities with updatedAt/createdAt > snapshot.createdAt.
 * Includes actual updated content for each (plan §1.3, §1.5).
 */
export async function buildDeltaSinceSnapshot(
  projectId: string,
  snapshot: ProjectContextSnapshot
): Promise<DeltaEntity[]> {
  const since = snapshot.createdAt
  const delta: DeltaEntity[] = []

  const [systems, systemDetailsByProject, versionPlans, brainstorms] = await Promise.all([
    getAllGameSystems(projectId),
    listSystemDetailsByProjectId(projectId),
    listVersionPlans(projectId),
    listBrainstorms({ projectId }, { pageSize: 200 }),
  ])

  for (const s of systems) {
    if (s.updatedAt > since || s.createdAt > since) {
      delta.push({
        kind: 'system',
        id: s.id,
        updatedAt: s.updatedAt.toISOString(),
        content: {
          slug: s.systemSlug,
          name: s.name,
          version: s.version,
          purpose: s.purpose,
          currentState: s.currentState,
          targetState: s.targetState,
          coreMechanics: s.coreMechanics,
          inputs: s.inputs,
          outputs: s.outputs,
          mvpCriticality: s.mvpCriticality,
          implementationNotes: s.implementationNotes,
          openQuestions: s.openQuestions,
          markdownContent: s.markdownContent,
        },
      })
    }
  }

  for (const b of systemDetailsByProject) {
    if (b.updatedAt > since || b.createdAt > since) {
      delta.push({
        kind: 'systemDetail',
        id: b.id,
        updatedAt: b.updatedAt.toISOString(),
        content: {
          gameSystemId: b.gameSystemId,
          name: b.name,
          detailType: b.detailType,
          spec: b.spec,
          sortOrder: b.sortOrder,
          synthesizedOutputId: b.synthesizedOutputId,
        },
      })
    }
  }

  for (const vp of versionPlans.data) {
    if (vp.updatedAt > since || vp.createdAt > since) {
      delta.push({
        kind: 'versionPlan',
        id: vp.id,
        updatedAt: vp.updatedAt.toISOString(),
        content: {
          versionLabel: vp.versionLabel,
          title: vp.title,
          status: vp.status,
          includedSystems: vp.includedSystems,
          phases: vp.phases,
          implementationOrder: vp.implementationOrder,
        },
      })
    }
  }

  for (const bs of brainstorms.data) {
    if (bs.createdAt > since) {
      delta.push({
        kind: 'brainstorm',
        id: bs.id,
        updatedAt: bs.createdAt.toISOString(),
        content: {
          title: bs.title,
          content: bs.content,
          tags: bs.tags,
          createdAt: bs.createdAt.toISOString(),
        },
      })
    }
  }

  return delta.sort(
    (a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
  )
}

const EXTRACTION_INSTRUCTIONS = `You must identify game systems AND their system details from the context and new brainstorm. Respond with ONLY a single JSON object (no markdown, no code fence, no explanation). Do not repeat or include the example below; output only your extraction. The JSON must have at least these two keys; optional keys for gap-filling:

1. "extractedSystems": array of objects. Each has: name, systemSlug (lowercase-with-hyphens), purpose (one short sentence), dependencies (array of other system slugs this system depends on or interfaces with—who calls whom, who feeds whom; may be empty).
2. "extractedSystemDetails": array of objects. Each has: name, detailType (exactly one of: mechanic, input, output, content, ui_hint), spec (markdown string describing the system detail), targetSystemSlug (must match the systemSlug of the system this detail belongs to).

If a system would have no dependencies (solo system), that often indicates a gap—a missing system this one should depend on or be depended on by. In that case, add one or more systems to the optional "suggestedSystems" array (same shape as extractedSystems) and add suggested system details to the optional "suggestedSystemDetails" array (same shape as extractedSystemDetails; use targetSystemSlug to attach details to a suggested system). Make the originally-solo extracted system depend on the suggested system's slug or vice versa.

Rules:
- Every system you list MUST have at least one system detail in extractedSystemDetails. Use targetSystemSlug on each detail to attach it to a system (use the exact systemSlug value).
- Optional "suggestedSystems" and "suggestedSystemDetails": when you identify a system with no dependencies, suggest new system(s) that would fill the gap and list them here; then give the solo system a dependency on the suggested system's slug.
- The main definition of each system is its system details—break down mechanics, inputs, outputs, and UI/content into separate details rather than putting everything in purpose.
- Produce one system per major interface boundary so the result can be visualized as a systems interaction flowchart (e.g. Guild Management, Quest Selection, Combat/Encounters, Behavior Trees, Roles, Heroes/Units, Player Intervention, AI Learning, Boss/Encounter Mechanics, Reputation, Resource Production, Hero Training Upgrades as distinct systems where the design implies them).
- Set dependencies to reflect interaction flow: for each system, list the slugs of systems it interfaces with or uses (data flow, triggers, "A sends to B"). This drives the dependency graph used for the flowchart. The graph is used to show what systems interact with which and how; describe interaction flow clearly in purpose or system details so it can be visualized.
- Use the dependency graph in the project context when existing systems are present. When proposing new systems, set dependencies so the graph shows how systems connect.
- Fit new ideas into existing systems where appropriate; suggest new systems when needed.

Example shape (replace with real content; suggestedSystems and suggestedSystemDetails are optional and may be empty arrays if no gap):
{
  "extractedSystems": [
    {
      "name": "Quest Selection",
      "systemSlug": "quest-selection",
      "purpose": "Chooses which dungeons or objectives the guild pursues.",
      "dependencies": ["combat-encounters"]
    },
    {
      "name": "Combat / Encounters",
      "systemSlug": "combat-encounters",
      "purpose": "Runs dungeon rooms and combat; hosts bosses and heroes.",
      "dependencies": ["reputation", "heroes-units"]
    }
  ],
  "extractedSystemDetails": [
    {
      "name": "Dungeon selection",
      "detailType": "mechanic",
      "spec": "Selects next dungeon or objective from guild.",
      "targetSystemSlug": "quest-selection"
    },
    {
      "name": "Encounter resolution",
      "detailType": "mechanic",
      "spec": "Resolves combat and encounter events.",
      "targetSystemSlug": "combat-encounters"
    }
  ],
  "suggestedSystems": [],
  "suggestedSystemDetails": []
}`

/**
 * Assemble for synthesis: last snapshot content + delta + new brainstorm + instructions.
 */
export function assembleForSynthesis(
  snapshotContent: SnapshotContent,
  delta: DeltaEntity[],
  newBrainstormContent: string,
  newBrainstormTitle?: string
): AssembledSynthesisContext {
  const snapshotContentStr = JSON.stringify(snapshotContent, null, 2)
  const deltaContentStr =
    delta.length === 0
      ? 'No changes since last snapshot.'
      : `## Changes since last snapshot\n\n${JSON.stringify(delta, null, 2)}`

  const newSection = newBrainstormTitle
    ? `## New brainstorm: ${newBrainstormTitle}\n\n${newBrainstormContent}`
    : `## New brainstorm content\n\n${newBrainstormContent}`

  const fullPrompt = [
    '# Project context (snapshot)',
    snapshotContentStr,
    '',
    deltaContentStr,
    '',
    newSection,
    '',
    '# Instructions',
    EXTRACTION_INSTRUCTIONS,
  ].join('\n')

  return {
    snapshotContent: snapshotContentStr,
    deltaContent: deltaContentStr,
    newBrainstormContent: newSection,
    instructions: EXTRACTION_INSTRUCTIONS,
    fullPrompt,
  }
}

export { CONTENT_VERSION }
