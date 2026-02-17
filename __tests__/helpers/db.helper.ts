import { prisma } from '@/lib/db'

/**
 * Resets the database by deleting all data in dependency-safe order.
 * Use for integration tests with a dedicated test database.
 */
export async function resetTestDatabase(): Promise<void> {
  await prisma.changeLog.deleteMany()
  await prisma.versionPlanItem.deleteMany()
  await prisma.dependency.deleteMany()
  await prisma.promptHistory.deleteMany()
  await prisma.gameSystem.deleteMany()
  await prisma.versionPlan.deleteMany()
  await prisma.export.deleteMany()
  await prisma.synthesizedOutput.deleteMany()
  await prisma.brainstormSession.deleteMany()
  await prisma.project.deleteMany()
}

/**
 * Returns the Prisma client for tests (same singleton as app when DATABASE_URL matches).
 */
export function getTestDb() {
  return prisma
}
