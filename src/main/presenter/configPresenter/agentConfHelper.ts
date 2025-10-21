import { eventBus, SendTarget } from '@/eventbus'
import { Agent } from '@shared/presenter'
import { AGENT_EVENTS } from '@/events'
import ElectronStore from 'electron-store'
import fs from 'fs'
import path from 'path'

// 智能体存储接口
interface IAgentStore {
  agents: Agent[]
  installedAgents: string[] // 已安装智能体的ID列表
  lastUpdateTime?: number
}

export class AgentConfHelper {
  private store: ElectronStore<IAgentStore>

  constructor() {
    this.store = new ElectronStore<IAgentStore>({
      name: 'agents',
      defaults: {
        agents: [],
        installedAgents: [],
        lastUpdateTime: Date.now()
      }
    })
  }

  /**
   * 从配置文件加载默认智能体数据
   */
  private async loadDefaultAgents(): Promise<Agent[]> {
    try {
      // 从项目根目录加载配置文件
      const configPath = path.join(process.cwd(), 'agentcard-settings.json')
      console.log('Loading agents from config path:', configPath)

      if (fs.existsSync(configPath)) {
        const configData = fs.readFileSync(configPath, 'utf-8')
        const config = JSON.parse(configData)
        const defaultAgents = config.settings?.defaultAgents || []
        console.log('Loaded default agents from config:', defaultAgents.length)
        return defaultAgents
      } else {
        console.warn('Config file not found:', configPath)
      }
    } catch (error) {
      console.error('Failed to load default agents from config:', error)
    }

    // 如果配置文件不存在或加载失败，返回空数组
    return []
  }

  /**
   * 初始化默认智能体数据
   */
  private async initializeDefaultAgents(): Promise<void> {
    try {
      const currentAgents = this.store.get('agents') || []
      console.log('Current agents in store:', currentAgents.length)

      if (currentAgents.length === 0) {
        console.log('No agents found in store, loading default agents...')
        const defaultAgents = await this.loadDefaultAgents()
        console.log('Default agents loaded:', defaultAgents.length)

        if (defaultAgents.length > 0) {
          await this.setAgents(defaultAgents)
          console.log('Initialized default agents from config file:', defaultAgents.length)
        } else {
          console.warn('No default agents found in config file')
        }
      } else {
        console.log('Agents already exist in store, skipping initialization')
      }
    } catch (error) {
      console.error('Failed to initialize default agents:', error)
    }
  }

  /**
   * 获取所有智能体
   */
  async getAgents(): Promise<Agent[]> {
    try {
      // 确保已初始化默认数据
      await this.initializeDefaultAgents()

      const agents = this.store.get('agents') || []
      const installedAgents = this.store.get('installedAgents') || []

      // 更新智能体的安装状态
      return agents.map((agent) => ({
        ...agent,
        installed: installedAgents.includes(agent.id)
      }))
    } catch (error) {
      console.error('Failed to get agents:', error)
      return []
    }
  }

  /**
   * 设置智能体列表
   */
  async setAgents(agents: Agent[]): Promise<void> {
    try {
      // 保存智能体数据（不包含安装状态）
      const agentsWithoutStatus = agents.map((agent) => {
        const { installed, ...agentWithoutStatus } = agent
        return agentWithoutStatus
      })

      this.store.set('agents', agentsWithoutStatus)
      this.store.set('lastUpdateTime', Date.now())

      // 触发智能体列表更新事件
      eventBus.send(AGENT_EVENTS.AGENTS_UPDATED, SendTarget.ALL_WINDOWS, {
        agents: await this.getAgents(),
        timestamp: Date.now()
      })
    } catch (error) {
      console.error('Failed to set agents:', error)
      throw error
    }
  }

  /**
   * 添加智能体
   */
  async addAgent(agent: Agent): Promise<void> {
    try {
      const agents = await this.getAgents()
      const existingIndex = agents.findIndex((a) => a.id === agent.id)

      if (existingIndex !== -1) {
        agents[existingIndex] = agent
      } else {
        agents.push(agent)
      }

      await this.setAgents(agents)
    } catch (error) {
      console.error('Failed to add agent:', error)
      throw error
    }
  }

  /**
   * 更新智能体
   */
  async updateAgent(agentId: string, updates: Partial<Agent>): Promise<void> {
    try {
      const agents = await this.getAgents()
      const index = agents.findIndex((a) => a.id === agentId)

      if (index !== -1) {
        agents[index] = { ...agents[index], ...updates }
        await this.setAgents(agents)
      } else {
        throw new Error(`Agent ${agentId} not found`)
      }
    } catch (error) {
      console.error('Failed to update agent:', error)
      throw error
    }
  }

  /**
   * 删除智能体
   */
  async removeAgent(agentId: string): Promise<void> {
    try {
      const agents = await this.getAgents()
      const filteredAgents = agents.filter((a) => a.id !== agentId)
      await this.setAgents(filteredAgents)

      // 同时从已安装列表中移除
      await this.uninstallAgent(agentId)
    } catch (error) {
      console.error('Failed to remove agent:', error)
      throw error
    }
  }

  /**
   * 安装智能体
   */
  async installAgent(agentId: string): Promise<void> {
    try {
      const installedAgents = this.store.get('installedAgents') || []

      if (!installedAgents.includes(agentId)) {
        installedAgents.push(agentId)
        this.store.set('installedAgents', installedAgents)

        // 触发智能体安装事件
        eventBus.send(AGENT_EVENTS.AGENT_INSTALLED, SendTarget.ALL_WINDOWS, {
          agentId,
          timestamp: Date.now()
        })
      }
    } catch (error) {
      console.error('Failed to install agent:', error)
      throw error
    }
  }

  /**
   * 卸载智能体
   */
  async uninstallAgent(agentId: string): Promise<void> {
    try {
      const installedAgents = this.store.get('installedAgents') || []
      const filteredAgents = installedAgents.filter((id) => id !== agentId)
      this.store.set('installedAgents', filteredAgents)

      // 触发智能体卸载事件
      eventBus.send(AGENT_EVENTS.AGENT_UNINSTALLED, SendTarget.ALL_WINDOWS, {
        agentId,
        timestamp: Date.now()
      })
    } catch (error) {
      console.error('Failed to uninstall agent:', error)
      throw error
    }
  }

  /**
   * 获取已安装的智能体
   */
  async getInstalledAgents(): Promise<Agent[]> {
    try {
      const agents = await this.getAgents()
      const installedAgents = this.store.get('installedAgents') || []

      return agents.filter((agent) => installedAgents.includes(agent.id))
    } catch (error) {
      console.error('Failed to get installed agents:', error)
      return []
    }
  }

  /**
   * 检查智能体是否已安装
   */
  async isAgentInstalled(agentId: string): Promise<boolean> {
    try {
      const installedAgents = this.store.get('installedAgents') || []
      return installedAgents.includes(agentId)
    } catch (error) {
      console.error('Failed to check agent installation:', error)
      return false
    }
  }

  /**
   * 根据分类获取智能体
   */
  async getAgentsByCategory(category: string): Promise<Agent[]> {
    try {
      const agents = await this.getAgents()

      if (category === 'all') {
        return agents
      }

      return agents.filter((agent) => agent.category === category)
    } catch (error) {
      console.error('Failed to get agents by category:', error)
      return []
    }
  }

  /**
   * 搜索智能体
   */
  async searchAgents(query: string): Promise<Agent[]> {
    try {
      const agents = await this.getAgents()
      const searchTerm = query.toLowerCase().trim()

      if (!searchTerm) {
        return agents
      }

      return agents.filter(
        (agent) =>
          agent.name.toLowerCase().includes(searchTerm) ||
          agent.description.toLowerCase().includes(searchTerm) ||
          agent.skills.some((feature) => feature.toLowerCase().includes(searchTerm)) ||
          agent.author.toLowerCase().includes(searchTerm)
      )
    } catch (error) {
      console.error('Failed to search agents:', error)
      return []
    }
  }

  /**
   * 获取智能体统计信息
   */
  async getAgentStats(): Promise<{
    total: number
    installed: number
    byCategory: Record<string, number>
  }> {
    try {
      const agents = await this.getAgents()
      const installedAgents = await this.getInstalledAgents()

      const byCategory: Record<string, number> = {}
      agents.forEach((agent) => {
        byCategory[agent.category] = (byCategory[agent.category] || 0) + 1
      })

      return {
        total: agents.length,
        installed: installedAgents.length,
        byCategory
      }
    } catch (error) {
      console.error('Failed to get agent stats:', error)
      return {
        total: 0,
        installed: 0,
        byCategory: {}
      }
    }
  }

  /**
   * 导入智能体数据
   */
  async importAgents(data: { agents: Agent[]; installedAgents?: string[] }): Promise<void> {
    try {
      await this.setAgents(data.agents)

      if (data.installedAgents) {
        this.store.set('installedAgents', data.installedAgents)
      }

      // 触发导入事件
      eventBus.send(AGENT_EVENTS.AGENTS_IMPORTED, SendTarget.ALL_WINDOWS, {
        count: data.agents.length,
        timestamp: Date.now()
      })
    } catch (error) {
      console.error('Failed to import agents:', error)
      throw error
    }
  }

  /**
   * 导出智能体数据
   */
  async exportAgents(): Promise<{
    agents: Agent[]
    installedAgents: string[]
    lastUpdateTime: number
  }> {
    try {
      const agents = await this.getAgents()
      const installedAgents = this.store.get('installedAgents') || []
      const lastUpdateTime = this.store.get('lastUpdateTime') || Date.now()

      return {
        agents,
        installedAgents,
        lastUpdateTime
      }
    } catch (error) {
      console.error('Failed to export agents:', error)
      throw error
    }
  }

  /**
   * 获取最后更新时间
   */
  getLastUpdateTime(): number {
    return this.store.get('lastUpdateTime') || Date.now()
  }
}
