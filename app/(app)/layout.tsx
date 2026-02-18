import { TopBar } from '@/components/top-bar'
import { getCurrentUserId } from '@/lib/get-current-user'
import { findUserById } from '@/lib/repositories/user.repository'
import { ProjectBreadcrumbProvider } from '@/lib/contexts/project-breadcrumb-context'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const userId = await getCurrentUserId()
  const user = await findUserById(userId)
  const userForBar =
    user == null
      ? null
      : {
          id: user.id,
          displayName: user.displayName,
          avatarColor: user.avatarColor,
        }
  return (
    <ProjectBreadcrumbProvider>
      <div className="flex min-h-screen flex-col">
        <TopBar user={userForBar} />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </ProjectBreadcrumbProvider>
  )
}
