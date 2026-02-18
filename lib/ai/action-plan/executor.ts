import type { ActionPlan, StepResult, PlanExecutionEvent, ActionStep } from './types'
import { paramsToRecord, paramRefsToRecord } from './types'
import type { ToolContext } from '@/lib/ai/tools/types'
import { executeTool } from '@/lib/ai/tools'

export function getNestedValue(obj: unknown, dotPath: string): unknown {
  const parts = dotPath.split('.')
  let current: unknown = obj
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined
    current = (current as Record<string, unknown>)[part]
  }
  return current
}

export function resolveParamRefs(
  params: Record<string, unknown>,
  paramRefs: Record<string, { stepIndex: number; path: string }>,
  completedSteps: StepResult[]
): Record<string, unknown> {
  if (Object.keys(paramRefs).length === 0) return { ...params }

  const resolved = { ...params }
  for (const [paramName, ref] of Object.entries(paramRefs)) {
    const stepResult = completedSteps[ref.stepIndex]
    if (!stepResult || stepResult.status !== 'completed') {
      throw new Error(
        `Cannot resolve paramRef "${paramName}": step ${ref.stepIndex} is not completed (status: ${stepResult?.status ?? 'missing'})`
      )
    }
    const value = getNestedValue(stepResult.toolResult, ref.path)
    if (value === undefined) {
      throw new Error(
        `Cannot resolve paramRef "${paramName}": path "${ref.path}" not found in step ${ref.stepIndex} result`
      )
    }
    resolved[paramName] = value
  }
  return resolved
}

function getDependencies(step: ActionStep, stepIndex: number): number[] {
  if (step.dependsOn && step.dependsOn.length > 0) return step.dependsOn
  // Default: depend on previous step
  return stepIndex > 0 ? [stepIndex - 1] : []
}

export async function executeActionPlan(
  plan: ActionPlan,
  context: ToolContext,
  onEvent: (event: PlanExecutionEvent) => void
): Promise<StepResult[]> {
  const results: StepResult[] = plan.steps.map((step) => ({
    stepId: step.stepId,
    status: 'pending',
  }))

  onEvent({ type: 'plan_started', totalSteps: plan.steps.length })

  let lastFailedIndex = -1

  for (let i = 0; i < plan.steps.length; i++) {
    const step = plan.steps[i]
    const deps = getDependencies(step, i)

    // Check if any dependency failed or was skipped
    const hasFailedDep = deps.some(
      (depIdx) => results[depIdx]?.status === 'failed' || results[depIdx]?.status === 'skipped'
    )

    if (hasFailedDep) {
      results[i] = { stepId: step.stepId, status: 'skipped' }
      onEvent({
        type: 'step_skipped',
        stepIndex: i,
        stepId: step.stepId,
        reason: 'A dependency failed or was skipped',
      })
      continue
    }

    // Start step
    results[i] = { stepId: step.stepId, status: 'running' }
    onEvent({
      type: 'step_started',
      stepIndex: i,
      stepId: step.stepId,
      description: step.description,
    })

    try {
      // Convert array-based params/refs to records for tool execution
      const paramsRecord = paramsToRecord(step.params)
      const refsRecord = paramRefsToRecord(step.paramRefs)

      // Resolve paramRefs
      const resolvedParams = resolveParamRefs(paramsRecord, refsRecord, results)

      // Execute tool — auto-approve since user approved the whole plan
      const toolResult = await executeTool(step.toolName, resolvedParams, context, {
        onConfirmationNeeded: async () => true,
      })

      if (toolResult.result.success) {
        results[i] = {
          stepId: step.stepId,
          status: 'completed',
          toolResult: toolResult.result.data,
        }
        onEvent({
          type: 'step_completed',
          stepIndex: i,
          stepId: step.stepId,
          result: toolResult.result.data,
          description: toolResult.description,
        })
      } else {
        results[i] = {
          stepId: step.stepId,
          status: 'failed',
          error: toolResult.result.error,
        }
        lastFailedIndex = i
        onEvent({
          type: 'step_failed',
          stepIndex: i,
          stepId: step.stepId,
          error: toolResult.result.error,
        })
      }
    } catch (e) {
      const error = e instanceof Error ? e.message : 'Unknown execution error'
      results[i] = { stepId: step.stepId, status: 'failed', error }
      lastFailedIndex = i
      onEvent({
        type: 'step_failed',
        stepIndex: i,
        stepId: step.stepId,
        error,
      })
    }
  }

  const allCompleted = results.every(
    (r) => r.status === 'completed' || r.status === 'skipped'
  )

  if (allCompleted) {
    const completedCount = results.filter((r) => r.status === 'completed').length
    onEvent({
      type: 'plan_completed',
      summary: `Successfully executed ${completedCount} of ${plan.steps.length} steps`,
    })
  } else {
    onEvent({
      type: 'plan_failed',
      error: `Plan execution failed at step ${lastFailedIndex}`,
      failedAtStep: lastFailedIndex,
    })
  }

  return results
}
