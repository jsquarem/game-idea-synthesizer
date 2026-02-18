import type { ActionPlan } from './types'
import { toolRegistry } from '@/lib/ai/tools'

export type ValidationResult =
  | { valid: true }
  | { valid: false; errors: string[] }

export function validateActionPlan(plan: ActionPlan): ValidationResult {
  const errors: string[] = []

  for (let i = 0; i < plan.steps.length; i++) {
    const step = plan.steps[i]

    // Check tool exists in registry
    if (!toolRegistry.get(step.toolName)) {
      errors.push(`Step ${i} ("${step.stepId}"): unknown tool "${step.toolName}"`)
    }

    // Check paramRefs reference prior steps
    for (const ref of step.paramRefs) {
      if (ref.stepIndex >= i) {
        errors.push(
          `Step ${i} ("${step.stepId}"): paramRef "${ref.paramName}" references step ${ref.stepIndex} which is not a prior step`
        )
      }
      if (ref.stepIndex < 0) {
        errors.push(
          `Step ${i} ("${step.stepId}"): paramRef "${ref.paramName}" has negative stepIndex ${ref.stepIndex}`
        )
      }
    }

    // Check dependsOn references prior steps and no cycles
    for (const depIndex of step.dependsOn) {
      if (depIndex >= i) {
        errors.push(
          `Step ${i} ("${step.stepId}"): dependsOn references step ${depIndex} which is not a prior step`
        )
      }
      if (depIndex < 0) {
        errors.push(
          `Step ${i} ("${step.stepId}"): dependsOn has negative index ${depIndex}`
        )
      }
    }
  }

  if (errors.length > 0) return { valid: false, errors }
  return { valid: true }
}
