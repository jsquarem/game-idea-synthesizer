'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  saveWorkspaceAiConfigAction,
  refreshWorkspaceModelsAction,
} from '@/app/actions/workspace-ai-config.actions'
import {
  groupAndSortModels,
  getModelDescription,
  resolveSuggestedModel,
} from '@/lib/utils/group-models-for-select'
import { Badge } from '@/components/ui/badge'

type ConfigSummary = {
  providerId: string
  hasApiKey: boolean
  baseUrl?: string
  defaultModel?: string
  availableModels?: string[]
}

const PROVIDERS = [
  { id: 'openai', name: 'OpenAI', defaultModel: 'gpt-4o-mini' },
  { id: 'anthropic', name: 'Anthropic', defaultModel: 'claude-3-5-haiku-20241022' },
] as const

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Saving…' : 'Save'}
    </Button>
  )
}

export function SettingsWorkspaceAiConfigForm({
  workspaceId,
  initialConfigs,
}: {
  workspaceId: string
  initialConfigs: ConfigSummary[]
}) {
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)
  const [activeProvider, setActiveProvider] = useState<string>(PROVIDERS[0]?.id ?? 'openai')
  const [useOtherModel, setUseOtherModel] = useState<Record<string, boolean>>({})
  const [otherModelValue, setOtherModelValue] = useState<Record<string, string>>({})
  const [selectedModelId, setSelectedModelId] = useState<Record<string, string>>({})
  const [refreshing, setRefreshing] = useState(false)
  const router = useRouter()
  const configByProvider = new Map(initialConfigs.map((c) => [c.providerId, c]))

  const current = configByProvider.get(activeProvider)
  const availableModels = current?.availableModels ?? []
  const suggestedId = resolveSuggestedModel(activeProvider, availableModels)
  const effectiveModel =
    useOtherModel[activeProvider]
      ? (otherModelValue[activeProvider] ?? current?.defaultModel ?? '')
      : (selectedModelId[activeProvider] ??
          current?.defaultModel ??
          resolveSuggestedModel(activeProvider, availableModels) ??
          '')

  async function handleSubmit(formData: FormData) {
    setMessage(null)
    formData.set('defaultModel', effectiveModel)
    const result = await saveWorkspaceAiConfigAction(workspaceId, formData)
    if (result.success) {
      setMessage({ type: 'success', text: 'API config saved.' })
      router.refresh()
    } else {
      setMessage({ type: 'error', text: result.error ?? 'Failed to save' })
    }
  }

  async function handleRefreshModels() {
    setMessage(null)
    setRefreshing(true)
    const result = await refreshWorkspaceModelsAction(workspaceId, activeProvider)
    setRefreshing(false)
    if (result.success) {
      setMessage({ type: 'success', text: 'Models refreshed.' })
      router.refresh()
    } else {
      setMessage({ type: 'error', text: result.error ?? 'Failed to refresh' })
    }
  }

  const groups = groupAndSortModels(availableModels)
  const showModelList = availableModels.length > 0 && !useOtherModel[activeProvider]

  return (
    <form action={handleSubmit} className="flex w-full flex-col gap-4">
      <input type="hidden" name="providerId" value={activeProvider} />
      <input type="hidden" name="defaultModel" value={effectiveModel} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,0.75fr)]">
        {/* Column 1: Provider, API key, Base URL, Other model, Save, Refresh */}
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-sm font-medium leading-none">Provider</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Choose the AI provider and set an API key. Keys are stored encrypted.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {PROVIDERS.map((p) => (
                <Button
                  key={p.id}
                  type="button"
                  variant={activeProvider === p.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveProvider(p.id)}
                >
                  {p.name}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <label
              htmlFor="apiKey"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              API key
            </label>
            <Input
              id="apiKey"
              name="apiKey"
              type="password"
              autoComplete="off"
              placeholder={current?.hasApiKey ? '••••••••••••' : 'Enter API key'}
              className="mt-1 font-mono"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Leave blank to keep existing key. Never stored in plaintext.
            </p>
          </div>
          <div>
            <label
              htmlFor="baseUrl"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Base URL (optional)
            </label>
            <Input
              id="baseUrl"
              name="baseUrl"
              type="url"
              placeholder="https://api.openai.com/v1"
              defaultValue={current?.baseUrl ?? ''}
              className="mt-1"
            />
          </div>
          {useOtherModel[activeProvider] && (
            <div>
              <label htmlFor="otherModel" className="text-sm font-medium leading-none">
                Model ID (other)
              </label>
              <Input
                id="otherModel"
                className="mt-1 font-mono"
                placeholder="e.g. gpt-4o"
                value={otherModelValue[activeProvider] ?? ''}
                onChange={(e) =>
                  setOtherModelValue((prev) => ({
                    ...prev,
                    [activeProvider]: e.target.value,
                  }))
                }
              />
            </div>
          )}
          {current?.hasApiKey && availableModels.length === 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={refreshing}
              onClick={handleRefreshModels}
            >
              {refreshing ? 'Refreshing…' : 'Refresh models'}
            </Button>
          )}
          {!current?.hasApiKey && availableModels.length === 0 && (
            <p className="text-xs text-muted-foreground">
              Save API key to load available models.
            </p>
          )}
          <SubmitButton />
          {message && (
            <p
              className={
                message.type === 'success'
                  ? 'text-sm text-green-600 dark:text-green-400'
                  : 'text-sm text-destructive'
              }
              role="status"
            >
              {message.text}
            </p>
          )}
        </div>

        {/* Column 2: Grouped model list */}
        <div
          className="flex flex-col"
          role="region"
          aria-label="Default model"
        >
          <p className="text-sm font-medium leading-none">Default model</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Select a model from the list or use Other to enter an ID.
          </p>
          {showModelList ? (
            <div
              className="mt-2 max-h-[min(24rem,50vh)] overflow-y-auto rounded-md border border-input"
              role="listbox"
              aria-label="Default model"
            >
              {groups.map((group) => (
                <div
                  key={group.label}
                  className="border-b border-border last:border-b-0"
                  role="group"
                  aria-label={group.label}
                >
                  <div className="sticky top-0 z-10 bg-muted/80 px-2 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-sm">
                    {group.label}
                  </div>
                  <ul className="py-0.5">
                    {group.models.map((id) => {
                      const isSelected = effectiveModel === id
                      const isSuggested = suggestedId === id
                      const description = getModelDescription(activeProvider, id)
                      return (
                        <li key={id}>
                          <button
                            type="button"
                            role="option"
                            aria-selected={isSelected}
                            className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm transition-colors hover:bg-muted/60 focus:bg-muted/60 focus:outline-none aria-selected:bg-primary/10 dark:aria-selected:bg-primary/20"
                            onClick={() => {
                              setUseOtherModel((prev) => ({ ...prev, [activeProvider]: false }))
                              setSelectedModelId((prev) => ({ ...prev, [activeProvider]: id }))
                            }}
                          >
                            <span className="flex flex-wrap items-center gap-1.5">
                              <span className="font-mono">{id}</span>
                              {isSuggested && (
                                <Badge variant="secondary" className="text-[10px] font-normal">
                                  Suggested
                                </Badge>
                              )}
                            </span>
                            {description && (
                              <span className="text-xs text-muted-foreground line-clamp-2">
                                {description}
                              </span>
                            )}
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ))}
              <div className="border-t border-border">
                <button
                  type="button"
                  role="option"
                  aria-selected={useOtherModel[activeProvider]}
                  className="flex w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted/60 focus:bg-muted/60 focus:outline-none aria-selected:bg-primary/10 dark:aria-selected:bg-primary/20"
                  onClick={() => {
                    setUseOtherModel((prev) => ({ ...prev, [activeProvider]: true }))
                    setOtherModelValue((prev) => ({
                      ...prev,
                      [activeProvider]: current?.defaultModel ?? '',
                    }))
                  }}
                >
                  Other…
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-2 rounded-md border border-dashed border-muted-foreground/30 px-3 py-6 text-center text-sm text-muted-foreground">
              {!current?.hasApiKey
                ? 'Save API key to load available models.'
                : availableModels.length === 0
                  ? 'Click Refresh models to load the list.'
                  : 'Enter a model ID in the Other field on the left.'}
            </div>
          )}
        </div>

        {/* Column 3: Selected model summary */}
        <div className="flex flex-col">
          <p className="text-sm font-medium leading-none">Selected</p>
          {effectiveModel ? (
            <div className="mt-2 rounded-md border border-input bg-muted/20 p-3 text-sm">
              <p className="font-mono text-foreground">{effectiveModel}</p>
              {getModelDescription(activeProvider, effectiveModel) && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {getModelDescription(activeProvider, effectiveModel)}
                </p>
              )}
            </div>
          ) : (
            <p className="mt-2 text-xs text-muted-foreground">No model selected.</p>
          )}
        </div>
      </div>
    </form>
  )
}
