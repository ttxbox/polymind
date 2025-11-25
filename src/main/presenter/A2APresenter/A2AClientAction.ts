import { A2AClient } from '@a2a-js/sdk/client'
import type {
  Task,
  MessageSendParams,
  AgentCard,
  Message,
  TaskStatusUpdateEvent,
  TaskArtifactUpdateEvent,
  JSONRPCErrorResponse,
  SendMessageSuccessResponse,
  Part,
  DataPart,
  TextPart,
  FilePart,
  Artifact
} from '@a2a-js/sdk'
import { A2AMessageSendParams, A2AServerResponse } from '@shared/presenter'
import { A2A_INNER_ERROR_CODE, A2AArtifact, A2APart } from './types'

export type { Task, TaskStatusUpdateEvent, TaskArtifactUpdateEvent, AgentCard }

export class A2AClientAction {
  private sdkClient: A2AClient
  private agentCardUrl: string

  constructor(
    serverUrl: string,
    private timeout: number = 120000
  ) {
    this.sdkClient = new A2AClient(serverUrl)
    if (serverUrl.endsWith('/.well-known/agent-card.json')) {
      this.agentCardUrl = serverUrl
    } else {
      this.agentCardUrl = serverUrl + '/.well-known/agent-card.json'
    }
  }
  /**
   * Check if client is connected
   */
  async isConnected(): Promise<boolean> {
    const response = await fetch(this.agentCardUrl)
    if (response.ok) {
      console.log('[A2A] A2A Server is connected')
      return true
    } else {
      console.error('[A2A] A2A Server response error:', response.status)
    }
    return false
  }

  async getAgentCard(): Promise<AgentCard> {
    try {
      console.log(`[A2A] Fetching agent card ${this.agentCardUrl}`)
      // Get agent card from client
      return await this.sdkClient.getAgentCard()
    } catch (error) {
      console.error(`[A2A] Failed to connect to server ${this.agentCardUrl}:`, error)
      throw error
    }
  }
  /**
   * Send a message and create a task (non-streaming)
   */
  async sendMessage(params: A2AMessageSendParams): Promise<A2AServerResponse> {
    if (!(await this.isConnected())) {
      throw new Error('Client not connected')
    }
    try {
      const sendParams: MessageSendParams = {
        message: {
          messageId: params.messageId,
          kind: params.kind,
          role: params.role,
          parts: this.partDataTransfer(params.parts)
        },
        configuration: {
          blocking: true // Non-streaming mode
        }
      }
      console.log(`[A2A] Sending message`)
      let timeoutHandle: NodeJS.Timeout | null = null
      const response = await Promise.race([
        this.sdkClient.sendMessage(sendParams),
        new Promise(
          (_, reject) =>
            (timeoutHandle = setTimeout(
              () => reject(new Error(`[A2A] sendMessage timed out after ${this.timeout} ms`)),
              this.timeout
            ))
        )
      ]).finally(() => {
        if (timeoutHandle) {
          clearTimeout(timeoutHandle)
          timeoutHandle = null
        }
      })
      // Check if response is error
      if (typeof response === 'object' && response !== null && 'error' in response) {
        const errorResponse = response as JSONRPCErrorResponse
        console.error(`[A2A] Error: ${errorResponse.error.message}`)
        return {
          kind: 'error',
          error: {
            code: errorResponse.error.code,
            message: errorResponse.error.message
          }
        }
      }
      // Get task from result
      let successResponse = response as SendMessageSuccessResponse
      return this.formatEventToResponse(successResponse.result)
    } catch (error) {
      const errorResponse: A2AServerResponse = {
        kind: 'error',
        error: {
          code: A2A_INNER_ERROR_CODE.STREAMING_MESSAGE_ERROR,
          message: `send message error: ${error instanceof Error ? error.message : String(error)}`
        }
      }
      return errorResponse
    }
  }

  /**
   * Send a streaming message
   */
  async *sendStreamingMessage(params: A2AMessageSendParams): AsyncGenerator<A2AServerResponse> {
    if (!(await this.isConnected())) {
      throw new Error('Client not connected')
    }
    try {
      console.log(`[A2A] Starting streaming message`)
      const sendParams: MessageSendParams = {
        message: {
          messageId: params.messageId,
          kind: params.kind,
          role: params.role,
          parts: this.partDataTransfer(params.parts)
        }
      }
      const streamIterator = this.sdkClient.sendMessageStream(sendParams)
      // Helper function to race event with timeout
      async function nextWithTimeout<T>(
        iterator: AsyncIterator<T>,
        ms: number
      ): Promise<IteratorResult<T>> {
        let timeoutHandle: NodeJS.Timeout | null = null

        const timeoutPromise = new Promise<IteratorResult<T>>((_, reject) => {
          timeoutHandle = setTimeout(() => {
            reject(new Error(`[A2A] Streaming message timed out after ${ms} ms`))
          }, ms)
        })
        return Promise.race([iterator.next(), timeoutPromise]).finally(() => {
          if (timeoutHandle) {
            clearTimeout(timeoutHandle)
            timeoutHandle = null
          }
        })
      }
      // 处理流式事件
      while (true) {
        const result = await nextWithTimeout(streamIterator, this.timeout)
        if (result.done) {
          console.log(`[A2A] Stream completed`)
          break
        }
        const event = result.value
        // 将事件转换为统一的 A2AServerResponse 格式
        const formatted = this.formatEventToResponse(event)
        yield formatted
      }
      streamIterator.return()
    } catch (error) {
      const errorResponse: A2AServerResponse = {
        kind: 'error',
        error: {
          code: A2A_INNER_ERROR_CODE.STREAMING_MESSAGE_ERROR,
          message: `Streaming message error: ${error instanceof Error ? error.message : String(error)}`
        }
      }
      yield errorResponse
    }
  }

  /**
   * Cancel a task
   */
  async cancelTask(taskId: string): Promise<void> {
    if (!(await this.isConnected())) {
      throw new Error('Client not connected')
    }
    try {
      await this.sdkClient.cancelTask({ id: taskId })
      console.log(`[A2A] Task cancelled: ${taskId}`)
    } catch (error) {
      console.error('[A2A] Failed to cancel task:', error)
      throw error
    }
  }

  private partDataTransfer(a2aPartData: A2APart[]): Part[] {
    return a2aPartData.map((part) => {
      if (part.type === 'text') {
        return {
          kind: 'text',
          text: part.text
        } as TextPart
      } else if (part.type === 'data') {
        return {
          kind: 'data',
          data: part.data
        } as DataPart
      } else {
        return {
          kind: 'file',
          file: {
            name: part?.file?.name,
            mimeType: part?.file?.mimeType,
            uri: part?.file?.uri,
            bytes: part?.file?.bytes
          }
        } as FilePart
      }
    })
  }

  private formatEventToResponse(
    event: Message | Task | TaskStatusUpdateEvent | TaskArtifactUpdateEvent
  ): A2AServerResponse {
    if (event.kind === 'message') {
      return this.resolveMessage(event as Message)
    } else if (event.kind === 'task') {
      return this.resolveTask(event as Task)
    } else if (event.kind === 'status-update') {
      return this.resolveTaskStatusUpdate(event as TaskStatusUpdateEvent)
    } else if (event.kind === 'artifact-update') {
      return this.resolveTaskArtifactUpdate(event as TaskArtifactUpdateEvent)
    }
    throw new Error('Unknown event type')
  }

  private resolveMessage(message: Message): A2AServerResponse {
    return {
      kind: 'message',
      contextId: message.contextId,
      message: {
        parts: this.convertParts(message.parts)
      }
    }
  }

  private resolveTask(task: Task): A2AServerResponse {
    return {
      kind: 'task',
      contextId: task.contextId,
      taskId: task.id,
      task: {
        status: {
          state: task.status.state,
          parts: task.status.message?.parts ? this.convertParts(task.status.message.parts) : []
        },
        artifacts: task.artifacts ? this.convertArtifacts(task.artifacts) : []
      }
    }
  }

  private resolveTaskStatusUpdate(event: TaskStatusUpdateEvent): A2AServerResponse {
    return {
      kind: 'status-update',
      contextId: event.contextId,
      taskId: event.taskId,
      statusUpdate: {
        status: {
          state: event.status.state,
          parts: event.status.message?.parts ? this.convertParts(event.status.message.parts) : []
        },
        final: event.final
      }
    }
  }

  private resolveTaskArtifactUpdate(event: TaskArtifactUpdateEvent): A2AServerResponse {
    return {
      kind: 'artifact-update',
      contextId: event.contextId,
      taskId: event.taskId,
      artifactUpdate: {
        artifact: {
          name: event.artifact?.name || '',
          parts: event.artifact.parts ? this.convertParts(event.artifact.parts) : []
        },
        ...(event?.append ? { append: event.append } : {}),
        ...(event?.lastChunk ? { lastChunk: event.lastChunk } : {})
      }
    }
  }

  private convertParts(parts: Part[]): A2APart[] {
    const result: A2APart[] = []
    for (const part of parts || []) {
      if (part.kind === 'text') {
        result.push({ type: 'text', text: (part as TextPart).text })
      } else if (part.kind === 'data') {
        result.push({ type: 'data', data: (part as DataPart).data })
      } else if (part.kind === 'file') {
        const fp = part as FilePart
        const file: any = (fp as any).file || {}
        result.push({
          type: 'file',
          file: {
            name: file.name,
            mimeType: file.mimeType,
            uri: file.uri,
            bytes: file.bytes
          }
        })
      }
    }
    return result
  }

  private convertArtifacts(artifacts: Artifact[]): A2AArtifact[] {
    return artifacts.map((artifact) => ({
      name: artifact?.name || '',
      parts: artifact.parts ? this.convertParts(artifact.parts) : []
    }))
  }
}
