export type ServiceResult<T> =
  | { success: true; data: T }
  | {
      success: false
      error: string
      code:
        | 'NOT_FOUND'
        | 'VALIDATION'
        | 'CONFLICT'
        | 'IMMUTABLE'
        | 'AI_ERROR'
        | 'CYCLE_DETECTED'
        | 'INTERNAL'
        | 'FORBIDDEN'
    }

export type EvolutionDelta = {
  systemId: string
  systemName: string
  deltaSummary: string
  requiredChanges: string[]
  dependencyImpact: {
    added: string[]
    removed: string[]
    modified: string[]
  }
  suggestedRefactorOrder: string[]
}
