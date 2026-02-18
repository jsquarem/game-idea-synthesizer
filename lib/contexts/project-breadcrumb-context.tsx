'use client'

import { createContext, useCallback, useContext, useState } from 'react'

type ProjectBreadcrumb = {
  projectId: string
  projectName: string
} | null

const ProjectBreadcrumbContext = createContext<{
  project: ProjectBreadcrumb
  setProjectBreadcrumb: (project: ProjectBreadcrumb) => void
}>({
  project: null,
  setProjectBreadcrumb: () => {},
})

export function ProjectBreadcrumbProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [project, setProject] = useState<ProjectBreadcrumb>(null)
  const setProjectBreadcrumb = useCallback((value: ProjectBreadcrumb) => {
    setProject(value)
  }, [])
  return (
    <ProjectBreadcrumbContext.Provider value={{ project, setProjectBreadcrumb }}>
      {children}
    </ProjectBreadcrumbContext.Provider>
  )
}

export function useProjectBreadcrumb() {
  return useContext(ProjectBreadcrumbContext)
}
