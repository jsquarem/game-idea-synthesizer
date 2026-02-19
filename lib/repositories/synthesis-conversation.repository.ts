import { prisma } from '@/lib/db'
import type { SynthesisConversationMessage } from '@prisma/client'

export type CreateSynthesisConversationMessageInput = {
  synthesizedOutputId: string
  role: 'user' | 'assistant'
  content: string
}

export async function listMessagesByOutputId(
  synthesizedOutputId: string
): Promise<SynthesisConversationMessage[]> {
  return prisma.synthesisConversationMessage.findMany({
    where: { synthesizedOutputId },
    orderBy: { createdAt: 'asc' },
  })
}

export async function appendMessage(
  input: CreateSynthesisConversationMessageInput
): Promise<SynthesisConversationMessage> {
  return prisma.synthesisConversationMessage.create({
    data: {
      synthesizedOutputId: input.synthesizedOutputId,
      role: input.role,
      content: input.content,
    },
  })
}

export async function deleteMessagesByOutputId(
  synthesizedOutputId: string
): Promise<number> {
  const result = await prisma.synthesisConversationMessage.deleteMany({
    where: { synthesizedOutputId },
  })
  return result.count
}
