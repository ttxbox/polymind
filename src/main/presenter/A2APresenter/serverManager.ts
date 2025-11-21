import { AgentCard } from '@a2a-js/sdk'
import { A2AClientAction } from './A2AClientAction'

export class ServerManager {
  //key:serverURL value:A2AClientAction
  private clientPool: Map<string, A2AClientAction>

  constructor() {
    this.clientPool = new Map()
  }

  async addA2AServer(serverURL: string): Promise<AgentCard> {
    const normalizedURL = this.normalLizeServerURL(serverURL)
    if (!normalizedURL) {
      throw new Error(`[A2A] Invalid server URL: ${serverURL}`)
    }

    if (this.clientPool.has(normalizedURL)) {
      throw new Error(`[A2A] ${serverURL} has been added`)
    }

    const client = new A2AClientAction(normalizedURL)
    const agentCard = await client.getAgentCard().catch((error: Error) => {
      throw new Error(error.message)
    })

    this.clientPool.set(normalizedURL, client)
    return agentCard
  }

  async removeA2AServer(serverURL: string): Promise<boolean> {
    const normalizedURL = this.normalLizeServerURL(serverURL)
    if (!normalizedURL) {
      throw new Error(`[A2A] Invalid server URL: ${serverURL}`)
    }
    if (!this.clientPool.has(normalizedURL)) {
      console.log(`[A2A] ${serverURL} doesn't exist`)
      return false
    }
    return this.clientPool.delete(normalizedURL)
  }

  async getA2AClient(serverURL: string): Promise<A2AClientAction | undefined> {
    const normalizedURL = this.normalLizeServerURL(serverURL)
    if (!normalizedURL) {
      console.log(`[A2A] Invalid server URL: ${serverURL}`)
      return
    }
    if (!this.clientPool.has(normalizedURL)) {
      console.log(`[A2A] ${serverURL} doesn't exist`)
      return
    }
    return this.clientPool.get(normalizedURL)
  }

  async isA2AServerRunning(serverURL: string): Promise<boolean> {
    const a2aClientAction = await this.getA2AClient(serverURL)
    if (!a2aClientAction) {
      return false
    } else {
      return await a2aClientAction.isConnected()
    }
  }

  private normalLizeServerURL(serverURL: string): string | undefined {
    if (!serverURL || !serverURL.trim()) {
      console.log('[A2A] server URL is null')
      return undefined
    }
    let trimmed = serverURL.trim()
    try {
      new URL(trimmed)
    } catch (e) {
      console.log('[A2A] server URL is invalid:', serverURL)
      return undefined
    }
    const agentCardSuffix = '/.well-known/agent-card.json'
    if (trimmed.endsWith(agentCardSuffix)) {
      trimmed = trimmed.slice(0, -agentCardSuffix.length)
    }
    return trimmed
  }
}
