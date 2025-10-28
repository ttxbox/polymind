import { Tool } from '@shared/presenter'
import { BuiltInToolDefinition, BuiltInToolResponse, validateToolArgs, buildRawData } from './base'
import { readFileTool, executeReadFileTool } from './readFileTool'
import { writeFileTool, executeWriteFileTool } from './writeFileTool'
import { listFilesTool, executeListFilesTool } from './listFilesTool'
import { executeCommandTool, executeCommandToolHandler } from './executeCommandTool'

export const builtInTools: Record<string, BuiltInToolDefinition> = {
  [readFileTool.name]: readFileTool,
  [writeFileTool.name]: writeFileTool,
  [listFilesTool.name]: listFilesTool,
  [executeCommandTool.name]: executeCommandTool
}

type BuiltInExecutor = (args: any, toolCallId: string) => Promise<BuiltInToolResponse>
const builtInToolExecutors: Record<string, BuiltInExecutor> = {
  [readFileTool.name]: executeReadFileTool,
  [writeFileTool.name]: executeWriteFileTool,
  [listFilesTool.name]: executeListFilesTool,
  [executeCommandTool.name]: executeCommandToolHandler
}

async function executeBuiltInToolInternal(
  toolName: string,
  args: any,
  toolCallId: string
): Promise<BuiltInToolResponse> {
  const def = builtInTools[toolName]
  let resolvedArgs = args
  if (def) {
    const check = validateToolArgs(def, args)
    if (!check.ok) {
      const failureMessage = `参数校验失败: ${check.message}`
      const meta = { error: check.message, tool: toolName, args }
      return {
        toolCallId,
        content: failureMessage,
        success: false,
        metadata: meta,
        rawData: buildRawData(toolCallId, failureMessage, true, meta)
      }
    }
    resolvedArgs = check.normalizedArgs
  }

  const executor = builtInToolExecutors[toolName]
  if (executor) {
    return await executor(resolvedArgs, toolCallId)
  }
  const msg = `未知的内置工具: ${toolName}`
  const metadata = { error: `Unknown built-in tool: ${toolName}` }
  return {
    toolCallId,
    content: msg,
    success: false,
    metadata,
    rawData: buildRawData(toolCallId, msg, true, metadata)
  }
}

export { executeBuiltInToolInternal as executeBuiltInTool }

export class BuiltInToolsPresenter {
  async getBuiltInTools(): Promise<Tool[]> {
    const definitions = Object.values(builtInTools)
    return definitions.map((def) => ({
      name: def.name,
      description: def.description,
      inputSchema: def.parameters,
      annotations: {
        title: def.name,
        readOnlyHint: false,
        destructiveHint: ['write_file', 'execute_command'].includes(def.name),
        idempotentHint: false,
        openWorldHint: true
      }
    }))
  }

  async getToolDescription(toolName: string): Promise<string | null> {
    const definition = builtInTools[toolName]
    return definition?.description || null
  }

  isBuiltInTool(toolName: string): boolean {
    return toolName in builtInTools
  }

  async executeBuiltInTool(
    toolName: string,
    args: any,
    toolCallId: string
  ): Promise<BuiltInToolResponse> {
    return await executeBuiltInToolInternal(toolName, args, toolCallId)
  }
}
