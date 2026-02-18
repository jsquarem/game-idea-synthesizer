import { generateObject } from 'ai'
import { getModelForFeature } from '@/lib/ai/get-model-for-feature'
import { assembleProjectContext } from './context'
import { buildSystemPrompt, buildUserPrompt } from './prompt'
import { validateActionPlan } from './validate'
import { actionPlanSchema, type ActionPlan } from './types'
import { getThreadsWithMessagesForFinalize } from '@/lib/repositories/idea-stream.repository'
import { createPromptHistory } from '@/lib/repositories/prompt-history.repository'
import { toolRegistry } from '@/lib/ai/tools'
import type { ServiceResult } from '@/lib/services/types'

export async function generateActionPlan(
  threadIds: string[],
  projectId: string,
  workspaceId: string
): Promise<ServiceResult<ActionPlan>> {
  const startTime = Date.now()

  try {
    // 1. Get model for plan generation
    const model = await getModelForFeature(workspaceId, 'plan_generation')

    // 2. Assemble project context
    const contextResult = await assembleProjectContext(projectId)
    if (!contextResult.success) {
      return { success: false, error: contextResult.error, code: contextResult.code }
    }

    // 3. Fetch thread content
    const threads = await getThreadsWithMessagesForFinalize(threadIds)
    if (threads.length === 0) {
      return { success: false, error: 'No threads found', code: 'NOT_FOUND' }
    }

    // 4. Build prompts
    const availableTools = toolRegistry.getAll()
    const systemPrompt = buildSystemPrompt(contextResult.data, availableTools)
    const userPrompt = buildUserPrompt(threads)

    // 5. Generate structured plan
    const result = await generateObject({
      model,
      schema: actionPlanSchema,
      system: systemPrompt,
      prompt: userPrompt,
    })
    const plan = result.object

    // 6. Validate plan
    const validation = validateActionPlan(plan)
    if (!validation.valid) {
      return {
        success: false,
        error: `Generated plan has errors: ${validation.errors.join('; ')}`,
        code: 'AI_ERROR',
      }
    }

    // 7. Log to PromptHistory
    const durationMs = Date.now() - startTime
    createPromptHistory({
      projectId,
      promptType: 'action_plan_generation',
      promptTemplate: 'action-plan/generate',
      promptInput: userPrompt,
      promptContext: {
        threadIds,
        systemCount: contextResult.data.systems.length,
      },
      response: JSON.stringify(plan),
      aiProvider: 'ai-sdk',
      aiModel: result.response.modelId,
      promptTokens: result.usage.inputTokens,
      completionTokens: result.usage.outputTokens,
      durationMs,
      status: 'completed',
    }).catch(() => {})

    return { success: true, data: plan }
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Failed to generate action plan'
    return { success: false, error, code: 'AI_ERROR' }
  }
}
