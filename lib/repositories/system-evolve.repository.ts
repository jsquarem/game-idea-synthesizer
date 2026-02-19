import { prisma } from '@/lib/db'

export type CreateSystemEvolveMessageInput = {
  gameSystemId: string
  role: 'user' | 'assistant'
  content: string
}

export async function listMessagesByGameSystemId(
  gameSystemId: string
): Promise<{ id: string; role: string; content: string; createdAt: Date }[]> {
  const rows = await prisma.systemEvolveMessage.findMany({
    where: { gameSystemId },
    orderBy: { createdAt: 'asc' },
    select: { id: true, role: true, content: true, createdAt: true },
  })
  return rows
}

export async function appendMessage(
  input: CreateSystemEvolveMessageInput
): Promise<{ id: string; role: string; content: string; createdAt: Date }> {
  const created = await prisma.systemEvolveMessage.create({
    data: {
      gameSystemId: input.gameSystemId,
      role: input.role,
      content: input.content,
    },
    select: { id: true, role: true, content: true, createdAt: true },
  })
  return created
}
