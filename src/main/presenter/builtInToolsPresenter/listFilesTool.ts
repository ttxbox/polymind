import fs from 'fs/promises'
import path from 'path'
import { BuiltInToolDefinition, BuiltInToolResponse, buildRawData } from './base'

export const listFilesTool: BuiltInToolDefinition = {
  name: 'list_files',
  description: '列出指定目录中的文件和目录',
  parameters: {
    type: 'object',
    properties: {
      directory_path: {
        type: 'string',
        description: '要列出内容的目录路径'
      },
      recursive: {
        type: 'boolean',
        description: '是否递归列出子目录',
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
      throw new Error('目录路径不能为空')
    }

    const resolvedPath = path.isAbsolute(directory_path)
      ? directory_path
      : path.resolve(process.cwd(), directory_path)

    try {
      await fs.access(resolvedPath)
    } catch {
      throw new Error(`目录不存在: ${resolvedPath}`)
    }

    const stats = await fs.stat(resolvedPath)
    if (!stats.isDirectory()) {
      throw new Error(`路径指向的是文件而不是目录: ${resolvedPath}`)
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
    const successContent = `目录内容列出成功:\n路径: ${resolvedPath}\n递归: ${recursive}\n\n找到 ${files.length} 个项目:\n${files
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
    const failureMessage = `列出文件失败: ${errorMessage}`
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
