import fs from 'fs/promises'
import path from 'path'
import { BuiltInToolDefinition, BuiltInToolResponse, buildRawData } from './base'

export const readFileTool: BuiltInToolDefinition = {
  name: 'read_file',
  description:
    'Requests to read the content of a file at a specified path. Use this tool when you need to inspect an existing file whose content you are unaware of, such as analyzing code, viewing a text file, or extracting information from a configuration file.The output content will have line numbers prefixed to each line (e.g., "1 | const x = 1"), making it easier to reference specific lines when creating diffs or discussing code. It can automatically extract raw text from PDF and DOCX files. It might not work for other types of binary files as it returns the raw content as a string.',
  parameters: {
    type: 'object',
    properties: {
      file_path: {
        type: 'string',
        description:
          'The path of the file to read (When the path is uncertain, confirm with the user).'
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
    const failureMessage = `Read file failures: ${errorMessage}`
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
