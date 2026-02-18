import { SettingsDisplayNameForm } from './settings-display-name-form'
import { SettingsAvatarColorForm } from './settings-avatar-color-form'
import { getCurrentUserId } from '@/lib/get-current-user'
import { findUserById } from '@/lib/repositories/user.repository'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export default async function SettingsPage() {
  const userId = await getCurrentUserId()
  const user = await findUserById(userId)
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

      <Card className="rounded-xl">
        <CardHeader>
          <h2 className="text-lg font-semibold">Profile</h2>
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
          <h2 className="text-lg font-semibold">Other</h2>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            AI provider config and theme settings will be here.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
