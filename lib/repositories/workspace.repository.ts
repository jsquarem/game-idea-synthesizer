import { prisma } from '@/lib/db'
import type { Workspace, WorkspaceMembership, AppUser } from '@prisma/client'
import { getOrCreateDefaultUser } from './user.repository'

export async function findWorkspaceById(id: string): Promise<Workspace | null> {
  return prisma.workspace.findUnique({ where: { id } })
}

export async function getOrCreateDefaultWorkspace(): Promise<Workspace> {
  const first = await prisma.workspace.findFirst({
    orderBy: { createdAt: 'asc' },
  })
  if (first) return first
  const defaultUser = await getOrCreateDefaultUser()
  const workspace = await prisma.workspace.create({
    data: { name: 'Default' },
  })
  await prisma.workspaceMembership.create({
    data: { workspaceId: workspace.id, userId: defaultUser.id },
  })
  return workspace
}

export async function listWorkspaceMembers(workspaceId: string) {
  return prisma.workspaceMembership.findMany({
    where: { workspaceId },
    include: { user: true },
    orderBy: { createdAt: 'asc' },
  })
}

export async function listAllUsers(): Promise<AppUser[]> {
  return prisma.appUser.findMany({
    orderBy: { createdAt: 'asc' },
  })
}

export async function isWorkspaceMember(
  workspaceId: string,
  userId: string
): Promise<boolean> {
  const m = await prisma.workspaceMembership.findUnique({
    where: {
      workspaceId_userId: { workspaceId, userId },
    },
  })
  return m !== null
}

export async function addWorkspaceMember(
  workspaceId: string,
  userId: string
): Promise<WorkspaceMembership> {
  return prisma.workspaceMembership.upsert({
    where: {
      workspaceId_userId: { workspaceId, userId },
    },
    create: { workspaceId, userId },
    update: {},
  })
}
