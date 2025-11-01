import { A2AClientAction } from './A2AClientAction'

export class serverManager {
  private clients: Map<string, A2AClientAction> = new Map<string, A2AClientAction>()

  /**
   * Add a new A2A server
   */
  addA2AServer(serverID: string) {
    if (this.clients.has(serverID)) {
      throw new Error(`A2A server ${serverID} already exists`)
    }
    this.clients.set(serverID, new A2AClientAction(serverID))
  }

  /**
   * Remove an A2A server
   */
  removeA2AServer(serverID: string) {
    this.clients.delete(serverID)
  }

  getA2AServers(): Record<string, A2AClientAction> {
    return Object.fromEntries(this.clients.entries())
  }
  /**
   * Check if a server is running
   */
  async isA2AServerRunning(serverID: string): Promise<boolean> {
    if (!this.clients.has(serverID)) {
      return false
    }
    const client = this.clients.get(serverID)
    return client ? await client.isConnected() : false
  }

  /**
   * Get a running client by name
   */
  getA2AClient(serverID: string): A2AClientAction | undefined {
    return this.clients.get(serverID)
  }
}
