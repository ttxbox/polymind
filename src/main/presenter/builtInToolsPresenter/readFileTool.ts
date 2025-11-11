import fs from 'fs/promises'
import path from 'path'
import { BuiltInToolDefinition, BuiltInToolResponse, buildRawData } from './base'

export const readFileTool: BuiltInToolDefinition = {
  name: 'read_file',
  description: 'Read the contents of a file at a specified path',
  parameters: {
    type: 'object',
    properties: {
      file_path: {
        type: 'string',
        description: 'The path to the file to read, either absolute or relative'
      },
      encoding: {
        type: 'string',
        description: 'File encoding format, default utf-8',
        enum: ['utf-8', 'base64', 'hex'],
        default: 'utf-8'
      }
    },
    required: ['file_path']
  }
}

export async function executeReadFileTool(
  args: any,
  toolCallId: string
): Promise<BuiltInToolResponse> {
  try {
    const { file_path, encoding = 'utf-8' } = args

    if (!file_path) {
      throw new Error('The file path cannot be empty')
    }

    const resolvedPath = path.isAbsolute(file_path)
      ? file_path
      : path.resolve(process.cwd(), file_path)

    try {
      await fs.access(resolvedPath)
    } catch {
      throw new Error(`File does not exist: ${resolvedPath}`)
    }

    const stats = await fs.stat(resolvedPath)
    if (stats.isDirectory()) {
      throw new Error(`The path points to a directory rather than a file.: ${resolvedPath}`)
    }

    let content: string
    if (encoding === 'base64') {
      const buffer = await fs.readFile(resolvedPath)
      content = buffer.toString('base64')
    } else if (encoding === 'hex') {
      const buffer = await fs.readFile(resolvedPath)
      content = buffer.toString('hex')
    } else {
      content = await fs.readFile(resolvedPath, 'utf-8')
    }

    const fileInfo = {
      path: resolvedPath,
      size: stats.size,
      modified: stats.mtime,
      encoding
    }

    const successMessage = `The file has been read successfully.:\nPath: ${fileInfo.path}\nSize: ${fileInfo.size} bytes\nModification-time: ${fileInfo.modified}\nEncode: ${fileInfo.encoding}\n\nContent :\n${content}`
    return {
      toolCallId,
      content: successMessage,
      success: true,
      metadata: fileInfo,
      rawData: buildRawData(toolCallId, successMessage, false, fileInfo)
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const failureMessage = `读取文件失败: ${errorMessage}`
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
