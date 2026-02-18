'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { addWorkspaceMemberAction } from '@/app/actions/workspace.actions'

type UserInfo = { id: string; displayName: string | null; email: string | null }

export function SettingsWorkspaceMembersForm({
  workspaceId,
  workspaceName,
  members,
  allUsers,
}: {
  workspaceId: string
  workspaceName: string
  members: UserInfo[]
  allUsers: UserInfo[]
}) {
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)
  const [pendingUserId, setPendingUserId] = useState<string | null>(null)
  const memberIds = new Set(members.map((m) => m.id))
  const addableUsers = allUsers.filter((u) => !memberIds.has(u.id))

  async function handleAdd(userId: string) {
    setMessage(null)
    setPendingUserId(userId)
    const result = await addWorkspaceMemberAction(workspaceId, userId)
    setPendingUserId(null)
    if (result.success) {
      setMessage({ type: 'success', text: 'User added to workspace.' })
    } else {
      setMessage({ type: 'error', text: result.error ?? 'Failed to add user' })
    }
  }

  function displayLabel(u: UserInfo) {
    if (u.displayName?.trim()) return u.displayName.trim()
    if (u.email?.trim()) return u.email.trim()
    return u.id.slice(0, 8)
  }

  return (
    <div className="flex max-w-sm flex-col gap-3">
      <div>
        <p className="text-sm font-medium leading-none">
          Members: {workspaceName}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Add existing users to this workspace. Invite-by-email may be added
          later.
        </p>
      </div>
      {members.length > 0 && (
        <ul className="text-sm text-muted-foreground">
          {members.map((m) => (
            <li key={m.id}>{displayLabel(m)}</li>
          ))}
        </ul>
      )}
      {addableUsers.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {addableUsers.map((u) => (
            <Button
              key={u.id}
              type="button"
              variant="secondary"
              size="sm"
              disabled={pendingUserId !== null}
              onClick={() => handleAdd(u.id)}
            >
              {pendingUserId === u.id ? 'Adding…' : `Add ${displayLabel(u)}`}
            </Button>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          All users are already in this workspace.
        </p>
      )}
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
