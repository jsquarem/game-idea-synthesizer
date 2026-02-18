import { z } from 'zod'

// --- Param as key-value pair (avoids z.record which uses additionalProperties) ---

export const paramEntrySchema = z.object({
  key: z.string(),
  value: z.string(),
})

// --- Reference to a previous step's output ---

export const paramRefEntrySchema = z.object({
  paramName: z.string(),
  stepIndex: z.number().int().min(0),
  path: z.string().min(1),
})
export type ParamRefEntry = z.infer<typeof paramRefEntrySchema>

// --- Single step in the plan ---

export const actionStepSchema = z.object({
  stepId: z.string().min(1),
  description: z.string().min(1),
  toolName: z.string().min(1),
  params: z.array(paramEntrySchema),
  paramRefs: z.array(paramRefEntrySchema),
  dependsOn: z.array(z.number().int().min(0)),
})
export type ActionStep = z.infer<typeof actionStepSchema>

// --- Full action plan ---

export const actionPlanSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  steps: z.array(actionStepSchema).min(1),
})
export type ActionPlan = z.infer<typeof actionPlanSchema>

// --- Helpers to convert array-based params to Record for tool execution ---

export function paramsToRecord(params: { key: string; value: string }[]): Record<string, string> {
  const record: Record<string, string> = {}
  for (const { key, value } of params) {
    record[key] = value
  }
  return record
}

export function paramRefsToRecord(
  refs: ParamRefEntry[]
): Record<string, { stepIndex: number; path: string }> {
  const record: Record<string, { stepIndex: number; path: string }> = {}
  for (const { paramName, stepIndex, path } of refs) {
    record[paramName] = { stepIndex, path }
  }
  return record
}

// --- Execution tracking ---

export type StepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped'

export type StepResult = {
  stepId: string
  status: StepStatus
  toolResult?: unknown
  error?: string
}

// --- SSE events during execution ---

export type PlanExecutionEvent =
  | { type: 'plan_started'; totalSteps: number }
  | { type: 'step_started'; stepIndex: number; stepId: string; description: string }
  | { type: 'step_completed'; stepIndex: number; stepId: string; result: unknown; description: string }
  | { type: 'step_failed'; stepIndex: number; stepId: string; error: string }
  | { type: 'step_skipped'; stepIndex: number; stepId: string; reason: string }
  | { type: 'plan_completed'; summary: string }
  | { type: 'plan_failed'; error: string; failedAtStep: number }
