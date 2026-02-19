'use client'

import { usePathname } from 'next/navigation'

/**
 * Wraps project main content. Synthesize route gets full width; other routes get max-w-6xl.
 */
export function ProjectContentWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isSynthesize = pathname?.includes('/synthesize') ?? false
  if (isSynthesize) return <>{children}</>
  return <div className="mx-auto max-w-6xl">{children}</div>
}
