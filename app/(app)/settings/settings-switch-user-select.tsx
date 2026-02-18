'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { switchCurrentUserAction } from '@/app/actions/user.actions'

type UserInfo = { id: string; displayName: string | null; email: string | null }

function displayLabel(u: UserInfo) {
  if (u.displayName?.trim()) return u.displayName.trim()
  if (u.email?.trim()) return u.email.trim()
  return u.id.slice(0, 8)
}

export function SettingsSwitchUserSelect({
  allUsers,
  currentUserId,
}: {
  allUsers: UserInfo[]
  currentUserId: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selectedUserId, setSelectedUserId] = useState(currentUserId)
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  function handleUseInBrowser() {
    if (selectedUserId === currentUserId) return
    setMessage(null)
    startTransition(async () => {
      const result = await switchCurrentUserAction(selectedUserId)
      if (result.success) {
        setMessage({ type: 'success', text: 'Active user updated for this browser.' })
        router.refresh()
      } else {
        setMessage({ type: 'error', text: result.error ?? 'Failed to switch user' })
      }
    })
  }

  if (allUsers.length === 0) return null
  if (allUsers.length === 1) {
    return (
      <div className="flex max-w-sm flex-col gap-2">
        <p className="text-sm font-medium leading-none">Active user (this browser)</p>
        <p className="text-xs text-muted-foreground">
          Prototype: this browser acts as one user. Create another user below to switch.
        </p>
        <p className="text-sm text-muted-foreground">{displayLabel(allUsers[0])}</p>
      </div>
    )
  }

  const currentLabel = allUsers.find((u) => u.id === currentUserId)
  const canSwitch = selectedUserId !== currentUserId

  return (
    <div className="flex max-w-sm flex-col gap-3">
      <div>
        <p className="text-sm font-medium leading-none">Active user (this browser)</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Prototype: choose who this browser acts as. Click the button to set the active user
          for this browser only.
        </p>
      </div>
      {currentLabel && (
        <p className="text-sm text-muted-foreground">
          Current: <span className="font-medium text-foreground">{displayLabel(currentLabel)}</span>
        </p>
      )}
      <div className="flex flex-wrap items-end gap-2">
        <div className="flex flex-col gap-1">
          <label
            htmlFor="switch-user"
            className="text-xs font-medium text-muted-foreground"
          >
            Select user
          </label>
          <select
            id="switch-user"
            value={selectedUserId}
            disabled={isPending}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="flex h-9 min-w-[12rem] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            {allUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {displayLabel(u)}
              </option>
            ))}
          </select>
        </div>
        <Button
          type="button"
          variant="secondary"
          disabled={!canSwitch || isPending}
          onClick={handleUseInBrowser}
        >
          {isPending ? 'Switching…' : 'Use this user in this browser'}
        </Button>
      </div>
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
  )
}
