import * as projectService from '@/lib/services/project.service'
import * as gameSystemService from '@/lib/services/game-system.service'
import * as dependencyService from '@/lib/services/dependency.service'
import * as versionPlanService from '@/lib/services/version-plan.service'
import * as brainstormService from '@/lib/services/brainstorm.service'
import type { ServiceResult } from '@/lib/services/types'

export type ProjectContext = {
  project: {
    id: string
    name: string
    description: string | null
    genre: string | null
    platform: string | null
    status: string
  }
  systems: {
    id: string
    name: string
    systemSlug: string
    status: string
    purpose: string | null
    mvpCriticality: string
  }[]
  dependencies: {
    nodes: { id: string; label: string }[]
    edges: { source: string; target: string; type: string }[]
    implementationOrder: string[]
  }
  versionPlans: {
    id: string
    versionLabel: string
    title: string
    status: string
  }[]
  brainstormCount: number
}

export async function assembleProjectContext(
  projectId: string
): Promise<ServiceResult<ProjectContext>> {
  const projectResult = await projectService.getProject(projectId)
  if (!projectResult.success) {
    return { success: false, error: projectResult.error, code: projectResult.code }
  }

  const project = projectResult.data

  const [systemsResult, graphResult, versionPlansResult, brainstormsResult] =
    await Promise.all([
      gameSystemService.listSystems({ projectId }),
      dependencyService.getProjectGraph(projectId),
      versionPlanService.listVersionPlans(projectId),
      brainstormService.listBrainstorms(projectId),
    ])

  const systems = systemsResult.success
    ? systemsResult.data.data.map((s) => ({
        id: s.id,
        name: s.name,
        systemSlug: s.systemSlug,
        status: s.status,
        purpose: s.purpose,
        mvpCriticality: s.mvpCriticality,
      }))
    : []

  const dependencies = graphResult.success
    ? {
        nodes: graphResult.data.nodes.map((n) => ({ id: n.id, label: n.label })),
        edges: graphResult.data.edges.map((e) => ({
          source: e.source,
          target: e.target,
          type: e.type,
        })),
        implementationOrder: graphResult.data.implementationOrder,
      }
    : { nodes: [], edges: [], implementationOrder: [] }

  const versionPlans = versionPlansResult.success
    ? versionPlansResult.data.data.map((vp) => ({
        id: vp.id,
        versionLabel: vp.versionLabel,
        title: vp.title,
        status: vp.status,
      }))
    : []

  const brainstormCount = brainstormsResult.success
    ? brainstormsResult.data.data.length
    : 0

  return {
    success: true,
    data: {
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        genre: project.genre,
        platform: project.platform,
        status: project.status,
      },
      systems,
      dependencies,
      versionPlans,
      brainstormCount,
    },
  }
}
