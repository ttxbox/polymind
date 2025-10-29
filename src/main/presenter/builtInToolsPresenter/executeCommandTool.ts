import fs from 'fs/promises'
import path from 'path'
import { exec as execCallback } from 'child_process'
import { promisify } from 'util'
import { BuiltInToolDefinition, BuiltInToolResponse, buildRawData } from './base'

const execAsync = promisify(execCallback)

export const executeCommandTool: BuiltInToolDefinition = {
  name: 'execute_command',
  description: '在当前或指定工作目录中执行命令行指令，并返回标准输出和标准错误。',
  parameters: {
    type: 'object',
    properties: {
      command: {
        type: 'string',
        description: '要执行的完整命令字符串。'
      },
      working_directory: {
        type: 'string',
        description: '执行命令时使用的工作目录（可选，默认使用当前进程目录）。'
      },
      timeout: {
        type: 'number',
        description: '命令允许运行的最长时间（毫秒，默认 30000）。'
      },
      shell: {
        type: 'string',
        description: '用于执行命令的 shell（可选，留空则使用系统默认值）。'
      }
    },
    required: ['command']
  }
}

export async function executeCommandToolHandler(
  args: any,
  toolCallId: string
): Promise<BuiltInToolResponse> {
  try {
    const { command, working_directory, timeout, shell } = args ?? {}

    if (typeof command !== 'string' || command.trim().length === 0) {
      throw new Error('command 参数不能为空，并且必须是字符串')
    }
    const trimmedCommand = command.trim()

    let resolvedCwd = process.cwd()
    if (working_directory !== undefined) {
      if (typeof working_directory !== 'string' || working_directory.trim().length === 0) {
        throw new Error('working_directory 必须是字符串')
      }
      const cwdCandidate = path.isAbsolute(working_directory)
        ? working_directory
        : path.resolve(process.cwd(), working_directory)
      try {
        const stats = await fs.stat(cwdCandidate)
        if (!stats.isDirectory()) {
          throw new Error(`工作目录不是有效的目录: ${cwdCandidate}`)
        }
      } catch {
        throw new Error(`工作目录不存在或无法访问: ${cwdCandidate}`)
      }
      resolvedCwd = cwdCandidate
    }

    const resolvedTimeout =
      typeof timeout === 'number' && Number.isFinite(timeout) && timeout > 0 ? timeout : 30_000

    const execOptions: {
      cwd: string
      timeout: number
      maxBuffer: number
      shell?: string
    } = {
      cwd: resolvedCwd,
      timeout: resolvedTimeout,
      maxBuffer: 10 * 1024 * 1024
    }

    if (typeof shell === 'string' && shell.trim().length > 0) {
      execOptions.shell = shell.trim()
    }

    const { stdout, stderr } = await execAsync(trimmedCommand, execOptions)

    const metadata = {
      command: trimmedCommand,
      cwd: resolvedCwd,
      timeout: resolvedTimeout,
      shell: execOptions.shell ?? 'default',
      exitCode: 0,
      stdout,
      stderr
    }

    const successMessage = `命令执行成功 (exit 0)\n命令: ${trimmedCommand}\n工作目录: ${resolvedCwd}${
      execOptions.shell ? `\nShell: ${execOptions.shell}` : ''
    }\n\nstdout:\n${stdout || '(空)'}\n\nstderr:\n${stderr || '(空)'}`

    return {
      toolCallId,
      content: successMessage,
      success: true,
      metadata,
      rawData: buildRawData(toolCallId, successMessage, false, metadata)
    }
  } catch (error) {
    const execError = error as
      | (Error & {
          stdout?: string
          stderr?: string
          code?: number | string
          signal?: NodeJS.Signals
          killed?: boolean
        })
      | undefined

    const stdout = execError?.stdout ?? ''
    const stderr = execError?.stderr ?? ''
    const exitCode = execError?.code ?? null
    const signal = execError?.signal ?? null
    const errorMessage =
      execError?.message ?? (error instanceof Error ? error.message : String(error))
    const exitInfo =
      exitCode !== null ? `exit ${exitCode}` : signal ? `signal ${signal}` : '未知退出状态'

    const metadata = {
      command: typeof args?.command === 'string' ? args.command.trim() : '',
      cwd:
        typeof args?.working_directory === 'string'
          ? path.isAbsolute(args.working_directory)
            ? args.working_directory
            : path.resolve(process.cwd(), args.working_directory)
          : process.cwd(),
      timeout:
        typeof args?.timeout === 'number' && Number.isFinite(args.timeout) && args.timeout > 0
          ? args.timeout
          : 30_000,
      shell:
        typeof args?.shell === 'string' && args.shell.trim().length > 0
          ? args.shell.trim()
          : 'default',
      exitCode,
      signal,
      stdout,
      stderr,
      error: errorMessage
    }

    const failureMessage = `命令执行失败 (${exitInfo})\n命令: ${metadata.command}\n工作目录: ${metadata.cwd}\n\nstdout:\n${stdout || '(空)'}\n\nstderr:\n${stderr || '(空)'}\n\n错误信息: ${errorMessage}`

    return {
      toolCallId,
      content: failureMessage,
      success: false,
      metadata,
      rawData: buildRawData(toolCallId, failureMessage, true, metadata)
    }
  }
}

export { executeCommandToolHandler as executeExecuteCommandTool }
