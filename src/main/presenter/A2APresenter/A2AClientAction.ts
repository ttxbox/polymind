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

import { A2AResponseData, A2APart, A2AArtifact, A2A_INNER_ERROR_CODE } from './types'

export type { Task, TaskStatusUpdateEvent, TaskArtifactUpdateEvent, AgentCard }

export class A2AClientAction {
  sdkClient: A2AClient
  agentCardUrl: string = ''
  agentCard: AgentCard | undefined = undefined
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

    this.initialize(serverUrl).catch((error) => {
      console.error(`[A2A] Failed to initialize client:`, error.message)
      throw error
    })
  }

  async initialize(serverUrl: string): Promise<void> {
    await this.fetchAgentCard(serverUrl)
  }
  /**
   * get agentCard
   */
  async fetchAgentCard(serverUrl: string): Promise<void> {
    try {
      console.log(`[A2A] Fetching agent card ${serverUrl}`)

      // Get agent card from client
      this.agentCard = await this.sdkClient.getAgentCard()
    } catch (error) {
      console.error(`[A2A] Failed to connect to server ${serverUrl}:`, error)
      throw error
    }
  }

  /**
   * Check if client is connected
   */
  async isConnected(): Promise<boolean> {
    const response = await fetch(this.agentCardUrl)
    if (response.ok) {
      console.log('[A2A] JS Server is connected')
      return true
    } else {
      console.error('[A2A] JS Server response error:', response.status)
    }
    return false
  }

  async getAgentCard(): Promise<AgentCard> {
    if (this.agentCard == undefined) {
      await this.fetchAgentCard(this.agentCardUrl)
    }
    return this.agentCard as AgentCard
  }
  /**
   * Send a message and create a task (non-streaming)
   */
  async sendMessage(params: MessageSendParams): Promise<A2AResponseData> {
    if (!(await this.isConnected())) {
      throw new Error('Client not connected')
    }
    try {
      const sendParams: MessageSendParams = {
        message: params.message,
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
          serverName: this?.agentCard?.name || '',
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
      const errorResponse: A2AResponseData = {
        kind: 'error',
        serverName: this?.agentCard?.name || '',
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
  async *sendStreamingMessage(params: MessageSendParams): AsyncGenerator<A2AResponseData> {
    if (!(await this.isConnected())) {
      throw new Error('Client not connected')
    }
    try {
      console.log(`[A2A] Starting streaming message`)
      const streamIterator = this.sdkClient.sendMessageStream(params)
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
        // 将事件转换为统一的 A2AResponseData 格式
        const formatted = this.formatEventToResponse(event)
        yield formatted
      }
      streamIterator.return()
    } catch (error) {
      const errorResponse: A2AResponseData = {
        kind: 'error',
        serverName: this?.agentCard?.name || '',
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

  private formatEventToResponse(
    event: Message | Task | TaskStatusUpdateEvent | TaskArtifactUpdateEvent
  ): A2AResponseData {
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

  private resolveMessage(message: Message): A2AResponseData {
    return {
      kind: 'message',
      serverName: this?.agentCard?.name || '',
      contextId: message.contextId,
      message: {
        parts: this.convertParts(message.parts)
      }
    }
  }

  private resolveTask(task: Task): A2AResponseData {
    return {
      kind: 'task',
      serverName: this?.agentCard?.name || '',
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

  private resolveTaskStatusUpdate(event: TaskStatusUpdateEvent): A2AResponseData {
    return {
      kind: 'status-update',
      serverName: this?.agentCard?.name || '',
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

  private resolveTaskArtifactUpdate(event: TaskArtifactUpdateEvent): A2AResponseData {
    return {
      kind: 'artifact-update',
      serverName: this?.agentCard?.name || '',
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
