import type { BrainstormSession } from '@prisma/client'
import type { ServiceResult } from './types'
import type { PaginatedResult, PaginationParams } from '../repositories/types'
import {
  createBrainstorm,
  findBrainstormById,
  listBrainstorms as listBrainstormsRepo,
  deleteBrainstorm as deleteBrainstormRepo,
  getBrainstormWithOutputs,
} from '../repositories/brainstorm.repository'
import { findProjectById } from '../repositories/project.repository'
import type { CreateBrainstormInput } from '../repositories/brainstorm.repository'

export async function ingestBrainstorm(
  input: CreateBrainstormInput
): Promise<ServiceResult<BrainstormSession>> {
  const project = await findProjectById(input.projectId)
  if (!project) return { success: false, error: 'Project not found', code: 'NOT_FOUND' }
  try {
    const session = await createBrainstorm(input)
    return { success: true, data: session }
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Failed to create brainstorm',
      code: 'INTERNAL',
    }
  }
}

export async function getBrainstorm(id: string): Promise<ServiceResult<BrainstormSession>> {
  const session = await findBrainstormById(id)
  if (!session) return { success: false, error: 'Brainstorm not found', code: 'NOT_FOUND' }
  return { success: true, data: session }
}

export async function listBrainstorms(
  projectId: string,
  pagination?: PaginationParams
): Promise<ServiceResult<PaginatedResult<BrainstormSession>>> {
  const project = await findProjectById(projectId)
  if (!project) return { success: false, error: 'Project not found', code: 'NOT_FOUND' }
  try {
    const result = await listBrainstormsRepo({ projectId }, pagination)
    return { success: true, data: result }
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Failed to list brainstorms',
      code: 'INTERNAL',
    }
  }
}

export async function deleteBrainstorm(id: string): Promise<ServiceResult<void>> {
  const session = await findBrainstormById(id)
  if (!session) return { success: false, error: 'Brainstorm not found', code: 'NOT_FOUND' }
  try {
    await deleteBrainstormRepo(id)
    return { success: true, data: undefined }
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Failed to delete brainstorm',
      code: 'INTERNAL',
    }
  }
}

export async function getBrainstormWithSynthesis(id: string): Promise<
  ServiceResult<{
    brainstorm: BrainstormSession
    synthesizedOutputs: { id: string; title: string; status: string }[]
  }>
> {
  const session = await findBrainstormById(id)
  if (!session) return { success: false, error: 'Brainstorm not found', code: 'NOT_FOUND' }
  try {
    const withOutputs = await getBrainstormWithOutputs(id)
    return {
      success: true,
      data: {
        brainstorm: withOutputs,
        synthesizedOutputs: withOutputs.synthesizedOutputs.map((o) => ({
          id: o.id,
          title: o.title,
          status: o.status,
        })),
      },
    }
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Failed to load brainstorm',
      code: 'INTERNAL',
    }
  }
}
