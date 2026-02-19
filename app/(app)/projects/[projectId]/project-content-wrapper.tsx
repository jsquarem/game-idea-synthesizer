'use client'

import { usePathname } from 'next/navigation'

/**
 * Full-width container for dependencies (and synthesize). Fills the p-6 area;
 * for dependencies, height is limited to viewport so the page fits in one screen (no main scrollbar).
 */
const fullWidthContainerClass =
  'flex min-h-0 w-full flex-1 flex-col overflow-hidden'

/**
 * Wraps project main content. Synthesize and Dependencies routes get full width
 * in a viewport-height–constrained container; other routes get max-w-6xl.
 */
export function ProjectContentWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isFullWidth =
    typeof pathname === 'string' &&
    (pathname.includes('/dependencies') || pathname.includes('/synthesize'))
  if (isFullWidth) {
    return <div className={fullWidthContainerClass}>{children}</div>
  }
  return <div className="mx-auto max-w-6xl">{children}</div>
}
