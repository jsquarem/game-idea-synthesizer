import { describe, it, expect, vi } from 'vitest'
import { assembleProjectContext } from '../context'

// Mock all services
vi.mock('@/lib/services/project.service', () => ({
  getProject: vi.fn(),
}))
vi.mock('@/lib/services/game-system.service', () => ({
  listSystems: vi.fn(),
}))
vi.mock('@/lib/services/dependency.service', () => ({
  getProjectGraph: vi.fn(),
}))
vi.mock('@/lib/services/version-plan.service', () => ({
  listVersionPlans: vi.fn(),
}))
vi.mock('@/lib/services/brainstorm.service', () => ({
  listBrainstorms: vi.fn(),
}))

import * as projectService from '@/lib/services/project.service'
import * as gameSystemService from '@/lib/services/game-system.service'
import * as dependencyService from '@/lib/services/dependency.service'
import * as versionPlanService from '@/lib/services/version-plan.service'
import * as brainstormService from '@/lib/services/brainstorm.service'

const mockGetProject = vi.mocked(projectService.getProject)
const mockListSystems = vi.mocked(gameSystemService.listSystems)
const mockGetProjectGraph = vi.mocked(dependencyService.getProjectGraph)
const mockListVersionPlans = vi.mocked(versionPlanService.listVersionPlans)
const mockListBrainstorms = vi.mocked(brainstormService.listBrainstorms)

function setupDefaultMocks() {
  mockGetProject.mockResolvedValue({
    success: true,
    data: {
      id: 'proj-1',
      name: 'Test Project',
      description: 'A test',
      genre: 'RPG',
      platform: 'PC',
      status: 'active',
      workspaceId: 'ws-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  })

  mockListSystems.mockResolvedValue({
    success: true,
    data: {
      data: [
        {
          id: 'sys-1',
          name: 'Combat',
          systemSlug: 'combat',
          status: 'draft',
          purpose: 'Handle combat',
          mvpCriticality: 'core',
          projectId: 'proj-1',
          synthesizedOutputId: null,
          version: 'v0.1',
          currentState: null,
          targetState: null,
          coreMechanics: null,
          inputs: null,
          outputs: null,
          failureStates: null,
          scalingBehavior: null,
          implementationNotes: null,
          openQuestions: null,
          markdownContent: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      total: 1,
      page: 1,
      pageSize: 50,
      totalPages: 1,
    },
  })

  mockGetProjectGraph.mockResolvedValue({
    success: true,
    data: {
      nodes: [{ id: 'sys-1', label: 'Combat', metadata: {} }],
      edges: [],
      implementationOrder: ['sys-1'],
    },
  })

  mockListVersionPlans.mockResolvedValue({
    success: true,
    data: {
      data: [
        {
          id: 'vp-1',
          versionLabel: 'v0.1',
          title: 'MVP',
          status: 'draft',
          projectId: 'proj-1',
          description: null,
          includedSystems: '[]',
          excludedSystems: null,
          phases: null,
          milestones: null,
          riskAreas: null,
          implementationOrder: null,
          scopeValidation: null,
          markdownContent: null,
          finalizedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      total: 1,
      page: 1,
      pageSize: 50,
      totalPages: 1,
    },
  })

  mockListBrainstorms.mockResolvedValue({
    success: true,
    data: {
      data: [
        {
          id: 'bs-1',
          projectId: 'proj-1',
          title: 'Test brainstorm',
          source: 'manual',
          content: 'Some content',
          author: null,
          tags: null,
          sourceThreadIds: null,
          createdAt: new Date(),
        },
      ],
      total: 1,
      page: 1,
      pageSize: 50,
      totalPages: 1,
    },
  })
}

describe('assembleProjectContext', () => {
  it('assembles context with systems, dependencies, version plans', async () => {
    setupDefaultMocks()

    const result = await assembleProjectContext('proj-1')
    expect(result.success).toBe(true)
    if (!result.success) return

    expect(result.data.project.name).toBe('Test Project')
    expect(result.data.systems).toHaveLength(1)
    expect(result.data.systems[0].name).toBe('Combat')
    expect(result.data.dependencies.nodes).toHaveLength(1)
    expect(result.data.versionPlans).toHaveLength(1)
    expect(result.data.brainstormCount).toBe(1)
  })

  it('handles empty project (no systems)', async () => {
    setupDefaultMocks()
    mockListSystems.mockResolvedValue({
      success: true,
      data: { data: [], total: 0, page: 1, pageSize: 50, totalPages: 0 },
    })
    mockGetProjectGraph.mockResolvedValue({
      success: true,
      data: { nodes: [], edges: [], implementationOrder: [] },
    })
    mockListVersionPlans.mockResolvedValue({
      success: true,
      data: { data: [], total: 0, page: 1, pageSize: 50, totalPages: 0 },
    })
    mockListBrainstorms.mockResolvedValue({
      success: true,
      data: { data: [], total: 0, page: 1, pageSize: 50, totalPages: 0 },
    })

    const result = await assembleProjectContext('proj-1')
    expect(result.success).toBe(true)
    if (!result.success) return

    expect(result.data.systems).toHaveLength(0)
    expect(result.data.dependencies.nodes).toHaveLength(0)
    expect(result.data.versionPlans).toHaveLength(0)
    expect(result.data.brainstormCount).toBe(0)
  })

  it('returns error when project not found', async () => {
    mockGetProject.mockResolvedValue({
      success: false,
      error: 'Project not found',
      code: 'NOT_FOUND',
    })

    const result = await assembleProjectContext('nonexistent')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBe('Project not found')
      expect(result.code).toBe('NOT_FOUND')
    }
  })
})
