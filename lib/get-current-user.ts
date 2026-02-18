import { cookies } from 'next/headers'
import {
  findUserById,
  getOrCreateDefaultUser,
} from '@/lib/repositories/user.repository'

const USER_ID_COOKIE = 'gameplan-user-id'

/**
 * Returns the current user id for the request.
 * In server actions: reads from cookie or creates/returns a default user.
 * In API routes: pass the Request to read X-User-Id header; otherwise falls back to default user.
 */
export async function getCurrentUserId(request?: Request): Promise<string> {
  let userId: string | null = null

  if (request) {
    userId = request.headers.get('X-User-Id')?.trim() || null
  } else {
    try {
      const store = await cookies()
      userId = store.get(USER_ID_COOKIE)?.value?.trim() || null
    } catch {
      // Not in request context (e.g. server action without cookies)
    }
  }

  if (userId) {
    const user = await findUserById(userId)
    if (user) return user.id
  }

  const defaultUser = await getOrCreateDefaultUser()
  return defaultUser.id
}
