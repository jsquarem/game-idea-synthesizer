import { z } from 'zod'

const projectStatusEnum = z.enum(['ideation', 'active', 'archived'])
const systemStatusEnum = z.enum(['draft', 'active', 'deprecated'])
const mvpCriticalityEnum = z.enum(['core', 'important', 'later'])
const versionFormat = z.string().regex(/^v\d+(\.\d+)?$/i, 'Version must match vX.Y format')
const versionPlanStatusEnum = z.enum(['draft', 'finalized'])

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().optional(),
  genre: z.string().optional(),
  platform: z.string().optional(),
  status: projectStatusEnum.optional().default('ideation'),
})

export const updateProjectSchema = createProjectSchema.partial()

export const createGameSystemSchema = z.object({
  projectId: z.string().min(1),
  systemId: z.string().min(1, 'System ID (slug) is required'),
  name: z.string().min(1),
  version: versionFormat.optional().default('v0.1'),
  status: systemStatusEnum.optional().default('draft'),
  purpose: z.string().optional(),
  currentState: z.string().optional(),
  targetState: z.string().optional(),
  coreMechanics: z.string().optional(),
  inputs: z.string().optional(),
  outputs: z.string().optional(),
  dependencies: z.array(z.string()).optional().default([]),
  failureStates: z.string().optional(),
  scalingBehavior: z.string().optional(),
  mvpCriticality: mvpCriticalityEnum.optional().default('important'),
  implementationNotes: z.string().optional(),
  openQuestions: z.string().optional(),
})

export const createBrainstormSessionSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().min(1),
  source: z.enum(['manual', 'discord', 'upload']).optional().default('manual'),
  content: z.string().min(1, 'Content is required'),
  author: z.string().min(1, 'Author is required'),
  tags: z.array(z.string()).optional(),
})

export const createVersionPlanSchema = z.object({
  projectId: z.string().min(1),
  versionIdentifier: z.string().min(1, 'Version identifier is required'),
  title: z.string().min(1),
  description: z.string().optional(),
  includedSystems: z.array(z.string()).min(1, 'Included systems list is required'),
  excludedSystems: z.array(z.string()).optional(),
  status: versionPlanStatusEnum.optional().default('draft'),
})

export const createDependencyEdgeSchema = z
  .object({
    sourceSystemId: z.string().min(1),
    targetSystemId: z.string().min(1),
    dependencyType: z.enum(['requires', 'enhances', 'optional']).optional().default('requires'),
    description: z.string().optional(),
  })
  .refine((data) => data.sourceSystemId !== data.targetSystemId, {
    message: 'Source and target system must be different',
    path: ['targetSystemId'],
  })

const ideaStreamContent = z
  .string()
  .max(10_000, 'Content must be at most 10,000 characters')
  .transform((s) => s.trim())
  .refine((s) => s.length > 0, 'Content is required')

export const createIdeaStreamThreadSchema = z.object({
  projectId: z.string().min(1),
  content: ideaStreamContent,
  title: z.string().max(200).optional().nullable(),
})

export const postIdeaStreamMessageSchema = z.object({
  projectId: z.string().min(1),
  threadId: z.string().min(1),
  content: ideaStreamContent,
  parentMessageId: z.string().optional().nullable(),
})

export const editIdeaStreamMessageSchema = z.object({
  messageId: z.string().min(1),
  content: ideaStreamContent,
})

export const finalizeIdeaStreamThreadsSchema = z.object({
  projectId: z.string().min(1),
  threadIds: z.array(z.string().min(1)).min(1, 'At least one thread is required'),
  title: z.string().max(200).optional().nullable(),
  authorDisplay: z.string().max(100).optional().nullable(),
})

export type CreateIdeaStreamThreadInput = z.infer<typeof createIdeaStreamThreadSchema>
export type PostIdeaStreamMessageInput = z.infer<typeof postIdeaStreamMessageSchema>
export type EditIdeaStreamMessageInput = z.infer<typeof editIdeaStreamMessageSchema>
export type FinalizeIdeaStreamThreadsInput = z.infer<typeof finalizeIdeaStreamThreadsSchema>

export type CreateProjectInput = z.infer<typeof createProjectSchema>
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>
export type CreateGameSystemInput = z.infer<typeof createGameSystemSchema>
export type CreateBrainstormSessionInput = z.infer<typeof createBrainstormSessionSchema>
export type CreateVersionPlanInput = z.infer<typeof createVersionPlanSchema>
export type CreateDependencyEdgeInput = z.infer<typeof createDependencyEdgeSchema>
