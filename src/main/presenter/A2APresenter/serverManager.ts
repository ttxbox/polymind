import { AgentCard } from '@a2a-js/sdk'
import { A2AClientAction } from './A2AClientAction'
import { AgentCardData, IConfigPresenter } from '@shared/presenter'

export class ServerManager {
  //key:serverURL value:A2AClientAction
  private clientPool: Map<string, A2AClientAction>
  private configPresenter: IConfigPresenter

  constructor(configPresenter: IConfigPresenter) {
    this.clientPool = new Map()
    this.configPresenter = configPresenter
    void this.loadExistingA2AAgents()
  }

  /**
   * 从配置中加载已有的 A2A agent 并对每个 agent 执行初始化处理（非阻塞）
   */
  private async loadExistingA2AAgents(): Promise<void> {
    try {
      const { agents } = await this.configPresenter.exportAgents('A2A')
      // agents 可能为空
      if (!agents || agents.length === 0) return

      for (const agent of agents) {
        try {
          const normalizedURL = this.normalLizeServerURL(agent.a2aURL || '')
          if (!normalizedURL) {
            throw new Error(`[A2A] Invalid server URL: ${agent.a2aURL || ''}`)
          }
          const client = new A2AClientAction(normalizedURL)
          this.clientPool.set(normalizedURL, client)
        } catch (e) {
          console.warn('[A2A] Failed to init client for agent', agent.name)
        }
      }
    } catch (error) {
      console.error('[A2A] Failed to load existing A2A agents:', error)
    }
  }

  async addA2AServer(serverURL: string): Promise<AgentCardData> {
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
    const agentCardData = this.agentCardDataTransfor(agentCard)
    await this.configPresenter.importAgentFromA2AData(agentCardData)
    return agentCardData
  }

  async fetchAgentCard(serverURL: string): Promise<AgentCardData> {
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
    return this.agentCardDataTransfor(agentCard)
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
    return trimmed.replace(/\/+$/, '')
  }

  private agentCardDataTransfor(agentCard: AgentCard): AgentCardData {
    const getAgentCardData = () => {
      return agentCard.skills.map((agentSkill) => ({
        name: agentSkill.name,
        description: agentSkill.description
      }))
    }
    const agentCardData: AgentCardData = {
      name: agentCard.name,
      description: agentCard.description,
      url: agentCard.url,
      streamingSupported: agentCard.capabilities?.streaming === true ? true : false,
      skills: getAgentCardData(),
      version: agentCard.version,
      provider: {
        organization: agentCard.provider?.organization || '',
        url: agentCard.provider?.url || ''
      },
      iconUrl: agentCard.iconUrl
    }
    return agentCardData
  }
}
