import { toolRegistry } from './registry'
import { projectTools } from './project.tools'
import { gameSystemTools } from './game-system.tools'
import { brainstormTools } from './brainstorm.tools'
import { dependencyTools } from './dependency.tools'
import { versionPlanTools } from './version-plan.tools'
import { ideaStreamTools } from './idea-stream.tools'
import { exportTools } from './export.tools'

const allTools = [
  ...projectTools,
  ...gameSystemTools,
  ...brainstormTools,
  ...dependencyTools,
  ...versionPlanTools,
  ...ideaStreamTools,
  ...exportTools,
]

for (const tool of allTools) {
  toolRegistry.register(tool)
}

export { toolRegistry } from './registry'
export { executeTool } from './executor'
export type {
  ToolDefinition,
  ToolCategory,
  ToolMutationType,
  ToolContext,
  ToolCallResult,
  JsonSchema,
  JsonSchemaProperty,
} from './types'
export type { ConfirmationRequest, ExecutionOptions } from './executor'
