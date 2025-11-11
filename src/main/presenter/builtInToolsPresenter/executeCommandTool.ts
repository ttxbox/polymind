import fs from 'fs/promises'
import path from 'path'
import { exec as execCallback } from 'child_process'
import { promisify } from 'util'
import { BuiltInToolDefinition, BuiltInToolResponse, buildRawData } from './base'

const execAsync = promisify(execCallback)

export const executeCommandTool: BuiltInToolDefinition = {
  name: 'execute_command',
  description:
    'Executes a command-line command in the current or specified working directory, and returns standard output and standard error.',
  parameters: {
    type: 'object',
    properties: {
      command: {
        type: 'string',
        description: 'The complete command string to execute.'
      },
      working_directory: {
        type: 'string',
        description:
          'The working directory to use when executing the command (optional; the current process directory is the default).'
      },
      timeout: {
        type: 'number',
        description: 'Maximum time the command is allowed to run (milliseconds, default 30000)。'
      },
      shell: {
        type: 'string',
        description:
          'The shell to use to execute the command (optional; if left blank, the system default is used)。'
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
      throw new Error('The command argument cannot be empty and must be a string')
    }
    const trimmedCommand = command.trim()

    let resolvedCwd = process.cwd()
    if (working_directory !== undefined) {
      if (typeof working_directory !== 'string' || working_directory.trim().length === 0) {
        throw new Error('working_directory must be a string')
      }
      const cwdCandidate = path.isAbsolute(working_directory)
        ? working_directory
        : path.resolve(process.cwd(), working_directory)
      try {
        const stats = await fs.stat(cwdCandidate)
        if (!stats.isDirectory()) {
          throw new Error(`The working directory is not a valid directory: ${cwdCandidate}`)
        }
      } catch {
        throw new Error(
          `The working directory does not exist or cannot be accessed: ${cwdCandidate}`
        )
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

    const successMessage = `The command executed successfully. (exit 0)\nCommand: ${trimmedCommand}\nWorking directory: ${resolvedCwd}${
      execOptions.shell ? `\nShell: ${execOptions.shell}` : ''
    }\n\nstdout:\n${stdout || '(empty)'}\n\nstderr:\n${stderr || '(empty)'}`

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
      exitCode !== null ? `exit ${exitCode}` : signal ? `signal ${signal}` : 'unknown exit status'

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

    const failureMessage = `Command execution failed (${exitInfo})\nCommand: ${metadata.command}\nWorking directory: ${metadata.cwd}\n\nstdout:\n${stdout || '(empty)'}\n\nstderr:\n${stderr || '(empty)'}\n\nerror message: ${errorMessage}`

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
