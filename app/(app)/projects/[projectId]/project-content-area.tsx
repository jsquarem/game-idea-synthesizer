'use client'

import { usePathname } from 'next/navigation'

/**
 * Wraps project content area. Applies horizontal padding except on full-width
 * routes (dependencies, synthesize) so those pages control their own padding.
 */
export function ProjectContentArea({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isFullWidth =
    pathname?.includes('/dependencies') ?? pathname?.includes('/synthesize') ?? false

  return (
    <div
      className={
        isFullWidth
          ? 'flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden p-6'
          : 'min-h-0 min-w-0 flex-1 overflow-y-auto px-4 py-6 md:px-8 lg:px-10'
      }
    >
      {children}
    </div>
  )
}
