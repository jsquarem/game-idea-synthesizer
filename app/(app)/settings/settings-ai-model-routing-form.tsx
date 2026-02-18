'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { saveFeatureConfigAction } from '@/app/actions/workspace-ai-feature-config.actions'

type FeatureConfigSummary = {
  featureId: string
  providerId: string
  modelId: string
}

const FEATURES = [
  { id: 'default', label: 'Default', description: 'Fallback model for all AI features' },
  { id: 'plan_generation', label: 'Plan Generation', description: 'Model used for Synthesize to Actions' },
] as const

const PROVIDERS = [
  { id: 'openai', name: 'OpenAI' },
  { id: 'anthropic', name: 'Anthropic' },
] as const

export function SettingsAiModelRoutingForm({
  workspaceId,
  initialConfigs,
}: {
  workspaceId: string
  initialConfigs: FeatureConfigSummary[]
}) {
  const configMap = new Map(initialConfigs.map((c) => [c.featureId, c]))
  const [saving, setSaving] = useState<string | null>(null)
  const [message, setMessage] = useState<{ featureId: string; type: 'success' | 'error'; text: string } | null>(null)

  async function handleSave(featureId: string, form: HTMLFormElement) {
    setSaving(featureId)
    setMessage(null)
    const formData = new FormData(form)
    formData.set('featureId', featureId)
    const result = await saveFeatureConfigAction(workspaceId, formData)
    setSaving(null)
    if (result.success) {
      setMessage({ featureId, type: 'success', text: 'Saved.' })
    } else {
      setMessage({ featureId, type: 'error', text: result.error ?? 'Failed to save' })
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium leading-none">AI Model Routing</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Choose which AI model to use for each feature. Falls back to Default if not set.
        </p>
      </div>
      <div className="space-y-3">
        {FEATURES.map((feature) => {
          const config = configMap.get(feature.id)
          return (
            <form
              key={feature.id}
              onSubmit={(e) => {
                e.preventDefault()
                handleSave(feature.id, e.currentTarget)
              }}
              className="rounded-md border p-3"
            >
              <div className="mb-2">
                <p className="text-sm font-medium">{feature.label}</p>
                <p className="text-xs text-muted-foreground">{feature.description}</p>
              </div>
              <div className="flex flex-wrap items-end gap-2">
                <div className="flex-1 min-w-[120px]">
                  <label htmlFor={`provider-${feature.id}`} className="text-xs font-medium">
                    Provider
                  </label>
                  <select
                    id={`provider-${feature.id}`}
                    name="providerId"
                    defaultValue={config?.providerId ?? 'openai'}
                    className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {PROVIDERS.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-[2] min-w-[160px]">
                  <label htmlFor={`model-${feature.id}`} className="text-xs font-medium">
                    Model ID
                  </label>
                  <Input
                    id={`model-${feature.id}`}
                    name="modelId"
                    type="text"
                    placeholder={feature.id === 'default' ? 'gpt-4o' : 'gpt-4o'}
                    defaultValue={config?.modelId ?? ''}
                    className="mt-1"
                  />
                </div>
                <Button type="submit" size="sm" disabled={saving === feature.id}>
                  {saving === feature.id ? 'Saving...' : 'Save'}
                </Button>
              </div>
              {message?.featureId === feature.id && (
                <p
                  className={`mt-2 text-xs ${
                    message.type === 'success'
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-destructive'
                  }`}
                  role="status"
                >
                  {message.text}
                </p>
              )}
            </form>
          )
        })}
      </div>
    </div>
  )
}
