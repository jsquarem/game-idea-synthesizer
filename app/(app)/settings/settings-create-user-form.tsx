'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createUserAction } from '@/app/actions/user.actions'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Creating…' : 'Create user'}
    </Button>
  )
}

export function SettingsCreateUserForm() {
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  async function handleSubmit(formData: FormData) {
    setMessage(null)
    const result = await createUserAction(formData)
    if (result.success) {
      setMessage({
        type: 'success',
        text: 'User created. They can now be selected as active user in any browser and added to the workspace.',
      })
    } else {
      setMessage({ type: 'error', text: result.error ?? 'Failed to create user' })
    }
  }

  return (
    <form action={handleSubmit} className="flex max-w-sm flex-col gap-3">
      <div>
        <label
          htmlFor="create-user-name"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Name
        </label>
        <Input
          id="create-user-name"
          name="name"
          type="text"
          placeholder="New user name"
          maxLength={100}
          className="mt-1"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Prototype: create a new user. They will appear in the active-user selector
          and can be added to the workspace.
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
