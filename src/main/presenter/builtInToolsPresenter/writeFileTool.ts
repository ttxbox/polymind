import fs from 'fs/promises'
import path from 'path'
import { BuiltInToolDefinition, BuiltInToolResponse, buildRawData } from './base'

export const writeFileTool: BuiltInToolDefinition = {
  name: 'write_file',
  description: '将内容写入指定路径的文件',
  parameters: {
    type: 'object',
    properties: {
      file_path: {
        type: 'string',
        description: '要写入的文件路径，可以是绝对路径或相对路径'
      },
      content: {
        type: 'string',
        description: '要写入的文件内容'
      },
      encoding: {
        type: 'string',
        description: '文件编码格式，默认为 utf-8',
        enum: ['utf-8', 'base64'],
        default: 'utf-8'
      }
    },
    required: ['file_path', 'content']
  }
}

export async function executeWriteFileTool(
  args: any,
  toolCallId: string
): Promise<BuiltInToolResponse> {
  try {
    const { file_path, content, encoding = 'utf-8' } = args

    if (!file_path) {
      throw new Error('文件路径不能为空')
    }

    if (content === undefined || content === null) {
      throw new Error('文件内容不能为空')
    }

    const resolvedPath = path.isAbsolute(file_path)
      ? file_path
      : path.resolve(process.cwd(), file_path)

    const dir = path.dirname(resolvedPath)
    await fs.mkdir(dir, { recursive: true })

    if (encoding === 'base64') {
      const buffer = Buffer.from(content, 'base64')
      await fs.writeFile(resolvedPath, buffer)
    } else {
      await fs.writeFile(resolvedPath, content, 'utf-8')
    }

    const fileInfo = {
      path: resolvedPath,
      encoding,
      writtenAt: new Date().toISOString()
    }

    const successMessage = `文件写入成功:\n路径: ${fileInfo.path}\n编码: ${fileInfo.encoding}\n写入时间: ${fileInfo.writtenAt}`
    return {
      toolCallId,
      content: successMessage,
      success: true,
      metadata: fileInfo,
      rawData: buildRawData(toolCallId, successMessage, false, fileInfo)
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const failureMessage = `写入文件失败: ${errorMessage}`
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
