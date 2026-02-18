'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { updateDisplayNameAction } from '@/app/actions/user.actions'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Saving…' : 'Save'}
    </Button>
  )
}

export function SettingsDisplayNameForm({
  initialDisplayName,
}: {
  initialDisplayName: string
}) {
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  async function handleSubmit(formData: FormData) {
    setMessage(null)
    const result = await updateDisplayNameAction(formData)
    if (result.success) {
      setMessage({ type: 'success', text: 'Display name saved.' })
    } else {
      setMessage({ type: 'error', text: result.error ?? 'Failed to save' })
    }
  }

  return (
    <form action={handleSubmit} className="flex max-w-sm flex-col gap-3">
      <div>
        <label
          htmlFor="displayName"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Name
        </label>
        <Input
          id="displayName"
          name="displayName"
          type="text"
          placeholder="Your name"
          defaultValue={initialDisplayName}
          maxLength={100}
          className="mt-1"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Used when you create threads or messages in Idea Stream and other
          authoring. Leave blank to use Creator / Responder labels per thread.
        </p>
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
