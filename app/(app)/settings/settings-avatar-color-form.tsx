'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'
import { updateAvatarColorAction } from '@/app/actions/user.actions'
import { AVATAR_COLOR_PRESETS } from '@/lib/avatar'
import { cn } from '@/lib/utils'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Saving…' : 'Save'}
    </Button>
  )
}

export function SettingsAvatarColorForm({
  initialAvatarColor,
}: {
  initialAvatarColor: string | null
}) {
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)
  const [selected, setSelected] = useState<string | null>(
    initialAvatarColor?.trim() || null
  )

  async function handleSubmit(formData: FormData) {
    setMessage(null)
    const result = await updateAvatarColorAction(formData)
    if (result.success) {
      setMessage({ type: 'success', text: 'Avatar color saved.' })
    } else {
      setMessage({ type: 'error', text: result.error ?? 'Failed to save' })
    }
  }

  return (
    <form action={handleSubmit} className="flex max-w-sm flex-col gap-3">
      <div>
        <p className="text-sm font-medium leading-none">Avatar color</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Shown in the top bar and in Idea Stream. Default uses a generated
          color.
        </p>
        <input type="hidden" name="avatarColor" value={selected ?? ''} />
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelected(null)}
            className={cn(
              'size-8 shrink-0 rounded-full border-2 transition-shadow',
              selected === null
                ? 'border-foreground ring-2 ring-offset-2 ring-offset-background ring-foreground'
                : 'border-transparent hover:ring-2 hover:ring-offset-2 hover:ring-offset-background hover:ring-muted-foreground'
            )}
            style={{ backgroundColor: 'hsl(var(--muted))' }}
            title="Default (generated)"
            aria-pressed={selected === null}
          />
          {AVATAR_COLOR_PRESETS.map((hex) => (
            <button
              key={hex}
              type="button"
              onClick={() => setSelected(hex)}
              className={cn(
                'size-8 shrink-0 rounded-full border-2 transition-shadow',
                selected === hex
                  ? 'border-foreground ring-2 ring-offset-2 ring-offset-background ring-foreground'
                  : 'border-transparent hover:ring-2 hover:ring-offset-2 hover:ring-offset-background hover:ring-muted-foreground'
              )}
              style={{ backgroundColor: hex }}
              title={hex}
              aria-pressed={selected === hex}
            />
          ))}
        </div>
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
