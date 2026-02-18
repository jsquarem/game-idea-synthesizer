import { TopBar } from '@/components/top-bar'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <TopBar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
