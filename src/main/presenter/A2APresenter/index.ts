/**
 * A2A Presenter Implementation
 * Main interface exposing all A2A operations and integrating with the existing system
 */

import { serverManager } from './serverManager'
import type { MessageSendParams, AgentCard } from '@a2a-js/sdk'

// Local interfaces for presenter API
export interface TaskQueryParams {
  taskId: string
  contextId?: string
}

export interface TaskIdParams {
  taskId: string
}
import { IA2APresenter } from '@shared/presenter'
import { A2AClientAction } from './A2AClientAction'
import { A2AResponseData } from './types'

export class A2APresenter implements IA2APresenter {
  private manager: serverManager

  constructor() {
    this.manager = new serverManager()
  }

  /**
   * Get all A2A server configurations
   */
  async getA2AServers(): Promise<Record<string, A2AClientAction>> {
    return this.manager.getA2AServers()
  }

  /**
   * Add a new A2A server
   */
  async addA2AServer(serverID: string): Promise<boolean> {
    try {
      // Check if server already exists
      const existingServers = await this.getA2AServers()
      if (existingServers[serverID]) {
        console.error(`[A2A] Failed to add A2A server: Server "${serverID}" already exists.`)
        return false
      }

      this.manager.addA2AServer(serverID)
      console.log(`[A2A] Added server: ${serverID}`)
      return true
    } catch (error) {
      console.error(`[A2A] Failed to add server ${serverID}:`, error)
      throw error
    }
  }
  /**
   * Remove an A2A server
   */
  async removeA2AServer(serverID: string): Promise<void> {
    try {
      this.manager.removeA2AServer(serverID)
      console.log(`[A2A] Removed server: ${serverID}`)
    } catch (error) {
      console.error(`[A2A] Failed to remove server ${serverID}:`, error)
      throw error
    }
  }

  /**
   * Check if a server is running
   */
  async isServerRunning(serverID: string): Promise<boolean> {
    return await this.manager.isA2AServerRunning(serverID)
  }

  /**
   * Send a message to an A2A server
   */
  async sendMessage(
    serverID: string,
    params: MessageSendParams
  ): Promise<A2AResponseData | AsyncGenerator<A2AResponseData>> {
    const client = this.manager.getA2AClient(serverID)
    if (!client) {
      throw new Error(`A2A server '${serverID}' is not running`)
    }
    const agentCard = await client.getAgentCard()
    const isStreaming = agentCard.capabilities?.streaming === true
    if (isStreaming) {
      return client.sendStreamingMessage(params)
    } else {
      return client.sendMessage(params)
    }
  }
  /**
   * Cancel a task
   */
  async cancelTask(serverID: string, taskID: string): Promise<void> {
    const client = this.manager.getA2AClient(serverID)
    if (!client) {
      throw new Error(`A2A server '${serverID}' is not running`)
    }
    await client.cancelTask(taskID)
  }

  /**
   * Get agent card for a server
   */
  async getAgentCard(serverName: string): Promise<AgentCard> {
    const client = this.manager.getA2AClient(serverName)
    if (!client) {
      throw new Error(`A2A server '${serverName}' is not running`)
    }
    return await client.getAgentCard()
  }
}
