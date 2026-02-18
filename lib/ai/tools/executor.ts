import { revalidatePath } from 'next/cache'
import { toolRegistry } from './registry'
import { createPromptHistory } from '@/lib/repositories/prompt-history.repository'
import type { ToolCallResult, ToolContext } from './types'
import type { ServiceResult } from '@/lib/services/types'

export type ConfirmationRequest = {
  toolName: string
  description: string
  params: unknown
}

export type ExecutionOptions = {
  onConfirmationNeeded?: (request: ConfirmationRequest) => Promise<boolean>
}

function errorResult(toolName: string, error: string, code: string): ToolCallResult {
  return {
    toolName,
    description: error,
    apiCall: {
      service: toolName,
      payload: null,
      mutationType: 'read',
    },
    result: { success: false, error, code } as ServiceResult<unknown>,
    executedAt: new Date().toISOString(),
  }
}

async function logToolExecution(
  context: ToolContext,
  toolCallResult: ToolCallResult
): Promise<void> {
  await createPromptHistory({
    projectId: context.projectId,
    promptType: 'tool_call',
    promptTemplate: toolCallResult.toolName,
    promptInput: JSON.stringify(toolCallResult.apiCall.payload),
    promptContext: {
      workspaceId: context.workspaceId,
      mutationType: toolCallResult.apiCall.mutationType,
    },
    response: JSON.stringify(toolCallResult.result),
    aiProvider: 'tool_executor',
    aiModel: 'n/a',
    status: toolCallResult.result.success ? 'completed' : 'error',
    error: toolCallResult.result.success ? undefined : toolCallResult.result.error,
  }).catch(() => {})
}

function revalidateForTool(
  tool: { revalidatePaths?: (context: ToolContext, params: unknown) => string[]; category: string },
  context: ToolContext,
  params: unknown
): void {
  if (tool.revalidatePaths) {
    for (const path of tool.revalidatePaths(context, params)) {
      revalidatePath(path, 'layout')
    }
  } else {
    revalidatePath(`/projects/${context.projectId}`, 'layout')
  }
}

export async function executeTool(
  toolName: string,
  rawParams: unknown,
  context: ToolContext,
  options: ExecutionOptions = {}
): Promise<ToolCallResult> {
  const tool = toolRegistry.get(toolName)
  if (!tool) {
    return errorResult(toolName, `Unknown tool: ${toolName}`, 'NOT_FOUND')
  }

  const parsed = tool.parameterSchema.safeParse(rawParams)
  if (!parsed.success) {
    return errorResult(
      toolName,
      `Invalid parameters: ${parsed.error.issues.map((i) => i.message).join(', ')}`,
      'VALIDATION'
    )
  }

  if (tool.requiresConfirmation && options.onConfirmationNeeded) {
    const approved = await options.onConfirmationNeeded({
      toolName,
      description: tool.description,
      params: parsed.data,
    })
    if (!approved) {
      return errorResult(toolName, 'Action declined by user', 'FORBIDDEN')
    }
  }

  const result = await tool.execute(parsed.data, context)
  const description = tool.describe(parsed.data, result)

  const toolCallResult: ToolCallResult = {
    toolName,
    description,
    apiCall: {
      service: `${tool.category}Service.${toolName}`,
      payload: parsed.data,
      mutationType: tool.mutationType,
    },
    result,
    executedAt: new Date().toISOString(),
  }

  logToolExecution(context, toolCallResult).catch(() => {})

  const isMutation = tool.mutationType !== 'read'
  if (isMutation && result.success) {
    revalidateForTool(tool, context, parsed.data)
  }

  return toolCallResult
}
