'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

type BreadcrumbItem = {
  label: string
  href?: string
}

function getBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean)
  if (segments.length === 0) return [{ label: 'Dashboard', href: '/dashboard' }]
  const items: BreadcrumbItem[] = []
  let href = ''
  for (let i = 0; i < segments.length; i++) {
    href += `/${segments[i]}`
    const segment = segments[i]
    if (segment === 'dashboard') {
      items.push({ label: 'Dashboard', href: '/dashboard' })
    } else if (segment === 'projects') {
      items.push({ label: 'Projects', href: '/dashboard' })
    } else if (i === 1 && segments[0] === 'projects') {
      items.push({ label: '…', href })
    } else if (segment === 'overview') {
      items.push({ label: 'Overview', href })
    } else if (segment === 'brainstorms') {
      items.push({ label: 'Brainstorms', href })
    } else if (segment === 'systems') {
      items.push({ label: 'Systems', href })
    } else if (segment === 'dependencies') {
      items.push({ label: 'Dependencies', href })
    } else if (segment === 'versions') {
      items.push({ label: 'Versions', href })
    } else if (segment === 'prompts') {
      items.push({ label: 'Prompts', href })
    } else if (segment === 'export') {
      items.push({ label: 'Export', href })
    } else {
      items.push({ label: decodeURIComponent(segment), href })
    }
  }
  return items
}

type BreadcrumbsProps = {
  items?: BreadcrumbItem[] | null
  className?: string
}

export function Breadcrumbs({ items: propItems, className }: BreadcrumbsProps) {
  const pathname = usePathname()
  const items = propItems ?? getBreadcrumbs(pathname)

  if (items.length === 0) return null

  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center gap-1 text-sm', className)}>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="size-4 text-muted-foreground" />}
          {item.href && i < items.length - 1 ? (
            <Link
              href={item.href}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className={i === items.length - 1 ? 'font-medium' : 'text-muted-foreground'}>
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  )
}
