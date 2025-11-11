import fs from 'fs/promises'
import path from 'path'
import { BuiltInToolDefinition, BuiltInToolResponse, buildRawData } from './base'

export const listFilesTool: BuiltInToolDefinition = {
  name: 'list_files',
  description: 'List files and directories in the specified directory',
  parameters: {
    type: 'object',
    properties: {
      directory_path: {
        type: 'string',
        description: 'Directory path to list content'
      },
      recursive: {
        type: 'boolean',
        description: 'Whether to recursively list subdirectories',
        default: false
      }
    },
    required: ['directory_path']
  }
}

export async function executeListFilesTool(
  args: any,
  toolCallId: string
): Promise<BuiltInToolResponse> {
  try {
    const { directory_path, recursive = false } = args

    if (!directory_path) {
      throw new Error('The directory path cannot be empty')
    }

    const resolvedPath = path.isAbsolute(directory_path)
      ? directory_path
      : path.resolve(process.cwd(), directory_path)

    try {
      await fs.access(resolvedPath)
    } catch {
      throw new Error(`Directory does not exist: ${resolvedPath}`)
    }

    const stats = await fs.stat(resolvedPath)
    if (!stats.isDirectory()) {
      throw new Error(`The path points to a file, not a directory: ${resolvedPath}`)
    }

    interface FileItemInfo {
      name: string
      path: string
      type: 'directory' | 'file'
      size: number
      modified: Date
      isDirectory: boolean
      isFile: boolean
    }

    const listFilesRecursive = async (dir: string): Promise<FileItemInfo[]> => {
      const items = await fs.readdir(dir, { withFileTypes: true })
      const result: FileItemInfo[] = []

      for (const item of items) {
        const fullPath = path.join(dir, item.name)
        const itemStats = await fs.stat(fullPath)

        const itemInfo: FileItemInfo = {
          name: item.name,
          path: fullPath,
          type: item.isDirectory() ? 'directory' : 'file',
          size: itemStats.size,
          modified: itemStats.mtime,
          isDirectory: item.isDirectory(),
          isFile: item.isFile()
        }

        result.push(itemInfo)

        if (recursive && item.isDirectory()) {
          const subItems = await listFilesRecursive(fullPath)
          result.push(...subItems)
        }
      }

      return result
    }

    const files = await listFilesRecursive(resolvedPath)

    const listMetadata = {
      path: resolvedPath,
      recursive,
      totalItems: files.length,
      items: files
    }
    const successContent = `Directory contents listed successfully:\nPath: ${resolvedPath}\nRecursive: ${recursive}\n\nItems found ${files.length}:\n${files
      .map(
        (item) =>
          `- ${item.type === 'directory' ? '📁' : '📄'} ${item.name} (${item.type}, ${item.size} bytes)`
      )
      .join('\n')}`

    return {
      toolCallId,
      content: successContent,
      success: true,
      metadata: listMetadata,
      rawData: buildRawData(toolCallId, successContent, false, listMetadata)
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const failureMessage = `Listing file failures: ${errorMessage}`
    const metadata = { error: errorMessage }
    return {
      toolCallId,
      content: failureMessage,
      success: false,
      metadata,
      rawData: buildRawData(toolCallId, failureMessage, true, metadata)
    }
  }
}
