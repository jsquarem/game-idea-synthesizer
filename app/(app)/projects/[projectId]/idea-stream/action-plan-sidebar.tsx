'use client'

import { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ActionStepCard } from './action-step-card'
import { generateActionPlanAction } from '@/app/actions/action-plan.actions'
import { Loader2, RefreshCw, X } from 'lucide-react'
import type { ActionPlan, StepStatus, PlanExecutionEvent } from '@/lib/ai/action-plan/types'

type SidebarState = 'generating' | 'reviewing' | 'executing' | 'completed' | 'failed'

type StepStatusMap = Record<number, { status: StepStatus; error?: string }>

export function ActionPlanSidebar({
  projectId,
  threadIds,
  onClose,
}: {
  projectId: string
  threadIds: string[]
  onClose: () => void
}) {
  const [state, setState] = useState<SidebarState>('generating')
  const [plan, setPlan] = useState<ActionPlan | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [stepStatuses, setStepStatuses] = useState<StepStatusMap>({})
  const [executionSummary, setExecutionSummary] = useState<string | null>(null)

  const handleGenerate = useCallback(async () => {
    setState('generating')
    setError(null)
    setPlan(null)
    setStepStatuses({})
    setExecutionSummary(null)

    const result = await generateActionPlanAction(projectId, threadIds)
    if (result.success) {
      setPlan(result.data)
      setState('reviewing')
    } else {
      setError(result.error)
      setState('failed')
    }
  }, [projectId, threadIds])

  // Auto-generate on mount
  useEffect(() => {
    handleGenerate()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleExecute = useCallback(async () => {
    if (!plan) return
    setState('executing')
    setError(null)

    try {
      const response = await fetch(
        `/api/projects/${projectId}/action-plans/execute`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan }),
        }
      )

      if (!response.ok || !response.body) {
        setError('Failed to start execution')
        setState('failed')
        return
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const event = JSON.parse(line.slice(6)) as PlanExecutionEvent
            handleEvent(event)
          } catch {
            // Skip malformed events
          }
        }
      }

      if (buffer.startsWith('data: ')) {
        try {
          const event = JSON.parse(buffer.slice(6)) as PlanExecutionEvent
          handleEvent(event)
        } catch {
          // Skip
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Execution failed')
      setState('failed')
    }
  }, [plan, projectId])

  function handleEvent(event: PlanExecutionEvent) {
    switch (event.type) {
      case 'step_started':
        setStepStatuses((prev) => ({
          ...prev,
          [event.stepIndex]: { status: 'running' },
        }))
        break
      case 'step_completed':
        setStepStatuses((prev) => ({
          ...prev,
          [event.stepIndex]: { status: 'completed' },
        }))
        break
      case 'step_failed':
        setStepStatuses((prev) => ({
          ...prev,
          [event.stepIndex]: { status: 'failed', error: event.error },
        }))
        break
      case 'step_skipped':
        setStepStatuses((prev) => ({
          ...prev,
          [event.stepIndex]: { status: 'skipped' },
        }))
        break
      case 'plan_completed':
        setExecutionSummary(event.summary)
        setState('completed')
        break
      case 'plan_failed':
        setError(event.error)
        setState('failed')
        break
    }
  }

  const canClose = state !== 'executing'

  return (
    <div className="flex h-full w-[380px] shrink-0 flex-col border-l border-white/[0.06] bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold">
            {state === 'generating' && 'Generating Plan...'}
            {state === 'reviewing' && (plan?.title ?? 'Action Plan')}
            {state === 'executing' && 'Executing...'}
            {state === 'completed' && 'Completed'}
            {state === 'failed' && 'Error'}
          </h3>
          {plan?.summary && state !== 'generating' && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {plan.summary}
            </p>
          )}
        </div>
        {canClose && (
          <Button
            variant="ghost"
            size="icon"
            className="size-7 shrink-0"
            onClick={onClose}
            aria-label="Close action plan"
          >
            <X className="size-4" />
          </Button>
        )}
      </div>

      {/* Body */}
      <ScrollArea className="flex-1">
        <div className="p-3">
          {state === 'generating' && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                Analyzing threads and project state...
              </p>
            </div>
          )}

          {plan && state !== 'generating' && (
            <div className="space-y-2">
              {plan.steps.map((step, i) => (
                <ActionStepCard
                  key={step.stepId}
                  stepIndex={i}
                  stepId={step.stepId}
                  description={step.description}
                  toolName={step.toolName}
                  params={step.params}
                  paramRefs={step.paramRefs}
                  status={stepStatuses[i]?.status ?? 'pending'}
                  error={stepStatuses[i]?.error}
                />
              ))}
            </div>
          )}

          {error && (
            <p className="mt-3 text-xs text-destructive">{error}</p>
          )}

          {executionSummary && (
            <p className="mt-3 text-xs text-green-600 dark:text-green-400">
              {executionSummary}
            </p>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t border-white/[0.06] p-3">
        {state === 'reviewing' && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={handleGenerate}
            >
              <RefreshCw className="mr-1.5 size-3.5" />
              Regenerate
            </Button>
            <Button size="sm" className="flex-1" onClick={handleExecute}>
              Execute Plan
            </Button>
          </div>
        )}
        {state === 'executing' && (
          <Button size="sm" className="w-full" disabled>
            <Loader2 className="mr-1.5 size-3.5 animate-spin" />
            Executing...
          </Button>
        )}
        {(state === 'completed' || state === 'failed') && (
          <div className="flex gap-2">
            {state === 'failed' && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={handleGenerate}
              >
                <RefreshCw className="mr-1.5 size-3.5" />
                Retry
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={onClose}
            >
              Close
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
