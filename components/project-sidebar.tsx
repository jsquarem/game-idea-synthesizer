'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Activity,
  LayoutDashboard,
  Lightbulb,
  MessageCircle,
  Boxes,
  GitBranch,
  Calendar,
  MessageSquare,
  FileOutput,
  PanelLeftClose,
  PanelLeft,
  Menu,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'

const SIDEBAR_STORAGE_KEY = 'gameplan-sidebar-collapsed'

const navItems = [
  { href: 'overview', label: 'Overview', icon: LayoutDashboard },
  { href: 'activity', label: 'Activity', icon: Activity },
  { href: 'brainstorms', label: 'Brainstorms', icon: Lightbulb },
  { href: 'idea-stream', label: 'Idea Stream', icon: MessageCircle },
  { href: 'systems', label: 'Systems', icon: Boxes },
  { href: 'dependencies', label: 'Dependencies', icon: GitBranch },
  { href: 'versions', label: 'Versions', icon: Calendar },
  { href: 'prompts', label: 'Prompts', icon: MessageSquare },
  { href: 'export', label: 'Export', icon: FileOutput },
] as const

type ProjectSidebarProps = {
  projectId: string
}

export function ProjectSidebar({ projectId }: ProjectSidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY)
    if (stored !== null) setCollapsed(stored === 'true')
  }, [])

  const toggleCollapsed = () => {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next))
  }

  const basePath = `/projects/${projectId}`

  const nav = (
    <ScrollArea className="flex-1 px-2 py-4">
      <nav className="flex flex-col gap-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const hrefFull = `${basePath}/${href}`
          const isActive = pathname === hrefFull || (href !== 'overview' && pathname.startsWith(hrefFull + '/'))
          return (
            <Link
              key={href}
              href={hrefFull}
              onClick={() => setOpen(false)}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-muted text-foreground border-l-2 border-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                collapsed && 'justify-center px-2'
              )}
            >
              <Icon className="size-5 shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          )
        })}
      </nav>
    </ScrollArea>
  )

  const collapseButton = (
    <div className="border-t border-border p-2">
      <Button
        variant="ghost"
        size={collapsed ? 'icon' : 'sm'}
        className="w-full justify-center"
        onClick={toggleCollapsed}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <PanelLeft className="size-4" /> : <PanelLeftClose className="size-4" />}
        {!collapsed && <span className="ml-2">Collapse</span>}
      </Button>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden shrink-0 flex-col border-r border-border bg-card transition-[width] md:flex',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        {nav}
        {collapseButton}
      </aside>

      {/* Mobile: sheet trigger */}
      <div className="flex w-full items-center gap-2 md:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" aria-label="Open menu">
              <Menu className="size-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <div className="flex h-full flex-col">
              <div className="border-b border-border p-4 font-semibold">Menu</div>
              {nav}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}
