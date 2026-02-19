/**
 * Snapshot content structure (plan §1.3).
 * Stored as JSON in ProjectContextSnapshot.content.
 */
export type SnapshotProject = {
  name: string
  description: string | null
  genre: string | null
  platform: string | null
  status: string
  createdAt: string
  updatedAt: string
}

export type SnapshotChangesSummary = {
  brainstormsAdded?: { count: number; titles: string[]; dates: string[] }
  systemsAddedUpdated?: { slugs: string[]; versionBumps?: string[] }
  dependenciesAddedRemoved?: { added: number; removed: number }
  versionPlansCreatedFinalized?: { labels: string[]; statuses: string[] }
}

export type SnapshotSystemDetail = {
  id: string
  name: string
  detailType: string
  specSnippet: string
  sourceSynthesisId?: string | null
}

export type SnapshotSystem = {
  slug: string
  name: string
  version: string
  purpose: string | null
  currentState: string | null
  targetState: string | null
  dependencies: string[]
  mvpCriticality: string
  lastUpdated: string
  systemDetails: SnapshotSystemDetail[]
}

export type SnapshotDependencyGraph = {
  edges: { sourceSlug: string; targetSlug: string; type: string }[]
  topologicalOrder?: string[]
}

export type SnapshotVersionPlan = {
  versionLabel: string
  status: string
  includedSystemSlugs: string[]
  phases?: unknown
  implementationOrder?: unknown
}

export type SnapshotContent = {
  schemaVersion: number
  project: SnapshotProject
  changesSummary: SnapshotChangesSummary
  systems: SnapshotSystem[]
  dependencyGraph: SnapshotDependencyGraph
  versionPlans: SnapshotVersionPlan[]
  brainstormsSummary?: { count: number; titles: string[]; dates: string[] }
}

export type DeltaEntity = {
  kind: 'system' | 'systemDetail' | 'versionPlan' | 'brainstorm'
  id: string
  updatedAt: string
  content: unknown
}

export type AssembledSynthesisContext = {
  snapshotContent: string
  deltaContent: string
  newBrainstormContent: string
  instructions: string
  fullPrompt: string
}
