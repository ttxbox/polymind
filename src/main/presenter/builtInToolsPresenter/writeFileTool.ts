import fs from 'fs/promises'
import path from 'path'
import { BuiltInToolDefinition, BuiltInToolResponse, buildRawData } from './base'

export const writeFileTool: BuiltInToolDefinition = {
  name: 'write_file',
  description: 'Write the content into a file in the specified path',
  parameters: {
    type: 'object',
    properties: {
      file_path: {
        type: 'string',
        description:
          'The file path to be written can be either an absolute path or a relative path.'
      },
      content: {
        type: 'string',
        description: 'The content to be written into the file'
      },
      encoding: {
        type: 'string',
        description: 'File encoding format, the default is utf-8.',
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
      throw new Error('The file path cannot be empty.')
    }

    if (content === undefined || content === null) {
      throw new Error('The content of the file cannot be empty.')
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

    const successMessage = `File written successfully:\nPath: ${fileInfo.path}\nEncode: ${fileInfo.encoding}\nWrite-in time: ${fileInfo.writtenAt}`
    return {
      toolCallId,
      content: successMessage,
      success: true,
      metadata: fileInfo,
      rawData: buildRawData(toolCallId, successMessage, false, fileInfo)
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const failureMessage = `Failed to write to the file: ${errorMessage}`
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
