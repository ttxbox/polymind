import fs from 'fs/promises'
import path from 'path'
import { BuiltInToolDefinition, BuiltInToolResponse, buildRawData } from './base'

export const writeFileTool: BuiltInToolDefinition = {
  name: 'write_file',
  description:
    'Requests to write the complete content to a file at a specified path. If the file already exists, it will be overwritten with the provided content. If the file does not exist, a new file will be created. This tool automatically creates all necessary directories required to write the file.',
  parameters: {
    type: 'object',
    properties: {
      file_path: {
        type: 'string',
        description:
          'The path of the file to write to (When the path is uncertain, confirm with the user).'
      },
      content: {
        type: 'string',
        description:
          'The content to write to the file. Always provide the complete intended content of the file, without any truncation or omission. You must include all parts of the file, even if they are unmodified. However, do not include line numbers in the content, only provide the actual content of the file.'
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
