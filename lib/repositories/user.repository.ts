import { prisma } from '@/lib/db'
import type { AppUser } from '@prisma/client'

export async function findUserById(id: string): Promise<AppUser | null> {
  return prisma.appUser.findUnique({ where: { id } })
}

export async function createUser(data: {
  id?: string
  email?: string | null
  displayName?: string | null
  avatarColor?: string | null
}): Promise<AppUser> {
  return prisma.appUser.create({
    data: {
      email: data.email ?? null,
      displayName: data.displayName ?? null,
      avatarColor: data.avatarColor ?? null,
    },
  })
}

export async function updateUserDisplayName(
  id: string,
  displayName: string | null
): Promise<AppUser> {
  return prisma.appUser.update({
    where: { id },
    data: { displayName: displayName?.trim() || null, updatedAt: new Date() },
  })
}

export async function updateUserAvatarColor(
  id: string,
  avatarColor: string | null
): Promise<AppUser> {
  return prisma.appUser.update({
    where: { id },
    data: { avatarColor, updatedAt: new Date() },
  })
}

/**
 * Returns the first user by creation date, or creates a default user.
 * Used when no user id is in cookie/header (e.g. first visit).
 */
export async function getOrCreateDefaultUser(): Promise<AppUser> {
  const first = await prisma.appUser.findFirst({
    orderBy: { createdAt: 'asc' },
  })
  if (first) return first
  return prisma.appUser.create({
    data: { displayName: 'User', email: null, avatarColor: null },
  })
}
