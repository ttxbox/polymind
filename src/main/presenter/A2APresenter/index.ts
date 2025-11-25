import type {
  A2AClientData,
  A2AerrorResponse,
  A2AMessageSendParams,
  A2AServerResponse,
  AgentCardData,
  IA2APresenter,
  IConfigPresenter
} from '@shared/presenter'
import { ServerManager } from './serverManager'

export class A2APresenter implements IA2APresenter {
  private readonly manager: ServerManager

  constructor(configPresenter: IConfigPresenter) {
    this.manager = new ServerManager(configPresenter)
  }

  async getA2AClient(serverURL: string): Promise<A2AClientData | undefined> {
    const a2aClientAction = await this.manager.getA2AClient(serverURL)
    if (!a2aClientAction) {
      return
    }
    const agentCard = await a2aClientAction.getAgentCard()
    const getAgentCardData = () => {
      return agentCard?.skills.map((agentSkill) => ({
        name: agentSkill.name,
        description: agentSkill.description
      }))
    }
    return {
      isRunning: await this.manager.isA2AServerRunning(serverURL),
      agentCard: {
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
    }
  }

  async addA2AServer(serverURL: string): Promise<AgentCardData | A2AerrorResponse> {
    try {
      return await this.manager.addA2AServer(serverURL)
    } catch (error) {
      console.error(`[A2A] Failed to add server ${serverURL}`)
      return {
        errorCode: '-1',
        errorMsg: (error as Error).message
      }
    }
  }

  async fetchAgentCard(serverURL: string): Promise<AgentCardData | A2AerrorResponse> {
    try {
      return await this.manager.fetchAgentCard(serverURL)
    } catch (error) {
      console.error(`${(error as Error).message}`)
      return {
        errorCode: '-1',
        errorMsg: (error as Error).message
      }
    }
  }

  async removeA2AServer(serverURL: string): Promise<boolean> {
    try {
      return await this.manager.removeA2AServer(serverURL)
    } catch (error) {
      console.error(`[A2A] Failed to remove server ${serverURL}:`, error)
      return false
    }
  }

  async sendMessage(
    serverURL: string,
    params: A2AMessageSendParams
  ): Promise<A2AServerResponse | AsyncGenerator<A2AServerResponse>> {
    const a2aClientAction = await this.manager.getA2AClient(serverURL)
    if (!a2aClientAction) {
      throw new Error(`A2A server '${serverURL}' is not running`)
    }
    const agentCard = await a2aClientAction.getAgentCard()
    const isStreaming = agentCard.capabilities?.streaming === true
    if (isStreaming) {
      return a2aClientAction.sendStreamingMessage(params)
    } else {
      return a2aClientAction.sendMessage(params)
    }
  }

  async isServerRunning(serverURL: string): Promise<boolean> {
    return this.manager.isA2AServerRunning(serverURL)
  }
}
