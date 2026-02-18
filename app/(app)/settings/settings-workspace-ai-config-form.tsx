'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { saveWorkspaceAiConfigAction } from '@/app/actions/workspace-ai-config.actions'

type ConfigSummary = {
  providerId: string
  hasApiKey: boolean
  baseUrl?: string
  defaultModel?: string
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
  const configByProvider = new Map(initialConfigs.map((c) => [c.providerId, c]))

  async function handleSubmit(formData: FormData) {
    setMessage(null)
    const result = await saveWorkspaceAiConfigAction(workspaceId, formData)
    if (result.success) {
      setMessage({ type: 'success', text: 'API config saved.' })
    } else {
      setMessage({ type: 'error', text: result.error ?? 'Failed to save' })
    }
  }

  const current = configByProvider.get(activeProvider)

  return (
    <form action={handleSubmit} className="flex max-w-md flex-col gap-4">
      <input type="hidden" name="providerId" value={activeProvider} />
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
      <div>
        <label
          htmlFor="defaultModel"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Default model
        </label>
        <Input
          id="defaultModel"
          name="defaultModel"
          type="text"
          placeholder={
            PROVIDERS.find((p) => p.id === activeProvider)?.defaultModel ?? ''
          }
          defaultValue={current?.defaultModel ?? ''}
          className="mt-1"
        />
      </div>
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
    </form>
  )
}
