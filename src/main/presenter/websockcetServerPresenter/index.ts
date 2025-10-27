#!/usr/bin/env node

import { WebSocketServerManager } from './WebSocketServer'

export class websocketServerPresenter {
  private server: WebSocketServerManager
  private port: number = 41300
  constructor() {
    this.server = new WebSocketServerManager(this.port)
  }

  /** 启动websocketServer */
  async startServer(): Promise<void> {
    try {
      await this.server.start()
    } catch (error) {
      console.error('[WebSocket Server] 启动失败:', error)
      throw error
    }
  }

  async stopServer(): Promise<void> {
    try {
      await this.server.stop()
      console.log('[WebSocket Server] 已停止')
    } catch (error) {
      console.error('[WebSocket Server] 停止失败:', error)
      throw error
    }
  }

  getServerStatus(): { port: number; clientCount: number; isRunning: boolean } {
    return this.server.getStatus()
  }
}

new websocketServerPresenter().startServer().catch((error) => {
  console.error('无法启动 WebSocket 服务器:', error)
})
