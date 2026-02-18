'use client'

import { useEffect } from 'react'
import { useProjectBreadcrumb } from '@/lib/contexts/project-breadcrumb-context'

export function SetProjectBreadcrumb({
  projectId,
  projectName,
}: {
  projectId: string
  projectName: string
}) {
  const { setProjectBreadcrumb } = useProjectBreadcrumb()
  useEffect(() => {
    setProjectBreadcrumb({ projectId, projectName })
    return () => setProjectBreadcrumb(null)
  }, [projectId, projectName, setProjectBreadcrumb])
  return null
}
