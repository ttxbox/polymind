import fs from 'fs/promises'
import path from 'path'
import { BuiltInToolDefinition, BuiltInToolResponse, buildRawData } from './base'

export const readFileTool: BuiltInToolDefinition = {
  name: 'read_file',
  description: '读取指定路径的文件内容',
  parameters: {
    type: 'object',
    properties: {
      file_path: {
        type: 'string',
        description: '要读取的文件路径，可以是绝对路径或相对路径'
      },
      encoding: {
        type: 'string',
        description: '文件编码格式，默认为 utf-8',
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
      throw new Error('文件路径不能为空')
    }

    const resolvedPath = path.isAbsolute(file_path)
      ? file_path
      : path.resolve(process.cwd(), file_path)

    try {
      await fs.access(resolvedPath)
    } catch {
      throw new Error(`文件不存在: ${resolvedPath}`)
    }

    const stats = await fs.stat(resolvedPath)
    if (stats.isDirectory()) {
      throw new Error(`路径指向的是目录而不是文件: ${resolvedPath}`)
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

    const successMessage = `文件读取成功:\n路径: ${fileInfo.path}\n大小: ${fileInfo.size} bytes\n修改时间: ${fileInfo.modified}\n编码: ${fileInfo.encoding}\n\n文件内容:\n${content}`
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
