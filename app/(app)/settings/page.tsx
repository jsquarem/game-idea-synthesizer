import { SettingsDisplayNameForm } from './settings-display-name-form'
import { SettingsAvatarColorForm } from './settings-avatar-color-form'
import { SettingsSwitchUserSelect } from './settings-switch-user-select'
import { SettingsCreateUserForm } from './settings-create-user-form'
import { SettingsWorkspaceMembersForm } from './settings-workspace-members-form'
import { SettingsWorkspaceAiConfigForm } from './settings-workspace-ai-config-form'
import { getCurrentUserId } from '@/lib/get-current-user'
import { findUserById } from '@/lib/repositories/user.repository'
import {
  getOrCreateDefaultWorkspace,
  listWorkspaceMembers,
  listAllUsers,
} from '@/lib/repositories/workspace.repository'
import { listWorkspaceAiConfigs } from '@/lib/repositories/workspace-ai-config.repository'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export default async function SettingsPage() {
  const userId = await getCurrentUserId()
  const user = await findUserById(userId)
  const workspace = await getOrCreateDefaultWorkspace()
  const [members, aiConfigs] = await Promise.all([
    listWorkspaceMembers(workspace.id),
    listWorkspaceAiConfigs(workspace.id),
  ])
  const allUsers = await listAllUsers()

  const memberInfo = members.map((m) => ({
    id: m.user.id,
    displayName: m.user.displayName,
    email: m.user.email,
  }))
  const allUsersInfo = allUsers.map((u) => ({
    id: u.id,
    displayName: u.displayName,
    email: u.email,
  }))

  return (
    <div className="space-y-8">
      <Card className="rounded-xl">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="mt-1 text-muted-foreground">
              Profile and app preferences.
            </p>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-8 md:grid-cols-2">
        <Card className="rounded-xl">
          <CardHeader>
            <h2 className="text-lg font-semibold">Profile</h2>
            <p className="text-sm text-muted-foreground">
              Display name and avatar for Idea Stream and authoring.
            </p>
          </CardHeader>
          <CardContent className="space-y-0">
            <div className="pb-6">
              <SettingsAvatarColorForm
                initialAvatarColor={user?.avatarColor ?? null}
              />
            </div>
            <div className="border-t border-border pt-6">
              <SettingsDisplayNameForm
                initialDisplayName={user?.displayName ?? ''}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl">
          <CardHeader>
            <h2 className="text-lg font-semibold">Workspace</h2>
            <p className="text-sm text-muted-foreground">
              Members and AI provider configuration for this workspace.
            </p>
          </CardHeader>
          <CardContent className="space-y-0">
            <div className="pb-6">
              <SettingsWorkspaceMembersForm
                workspaceId={workspace.id}
                workspaceName={workspace.name}
                members={memberInfo}
                allUsers={allUsersInfo}
              />
            </div>
            <div className="border-t border-border pt-6">
              <SettingsWorkspaceAiConfigForm
                workspaceId={workspace.id}
                initialConfigs={aiConfigs.map((c) => ({
                  providerId: c.providerId,
                  hasApiKey: !!c.encryptedApiKey,
                  baseUrl: c.baseUrl ?? undefined,
                  defaultModel: c.defaultModel ?? undefined,
                }))}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-xl border-dashed">
        <CardHeader>
          <h2 className="text-lg font-semibold">Prototype: user simulation</h2>
          <p className="text-sm text-muted-foreground">
            Create users and set which user this browser acts as. For testing
            multi-user flows only.
          </p>
        </CardHeader>
        <CardContent className="space-y-0">
          <div className="pb-6">
            <SettingsSwitchUserSelect
              allUsers={allUsersInfo}
              currentUserId={userId}
            />
          </div>
          <div className="border-t border-border pt-6">
            <SettingsCreateUserForm />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
