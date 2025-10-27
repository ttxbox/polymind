import http from 'http'
import { WebSocketServer, WebSocket } from 'ws'
import type { RawData } from 'ws'
import { v4 as uuidv4 } from 'uuid'
import type { MessageType, WebSocketMessage, ClientInfo, RawMessage } from './types'

export class WebSocketServerManager {
  private server: http.Server
  private wss: WebSocketServer
  private clients: Map<string, ClientInfo> = new Map()
  private heartbeatInterval: NodeJS.Timeout | null = null
  private port: number
  private isRunning = false

  constructor(port: number = 41300) {
    this.port = port
    this.server = http.createServer()
    this.wss = new WebSocketServer({ server: this.server })
    this.setupEventHandlers()
  }

  /**
   * 启动服务器
   */
  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server.listen(this.port, (err?: Error) => {
        if (err) {
          reject(err)
          return
        }

        this.isRunning = true
        this.startHeartbeat()
        console.log(`[WebSocket Server] 启动成功，监听端口: ${this.port}`)
        resolve()
      })
    })
  }

  /**
   * 停止服务器
   */
  async stop(): Promise<void> {
    return new Promise((resolve) => {
      this.isRunning = false

      // 停止心跳检测
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval)
        this.heartbeatInterval = null
      }

      // 关闭所有客户端连接
      this.clients.forEach((client) => {
        try {
          client.ws.close(1001, 'Server shutting down')
        } catch (error) {
          console.error(`[WebSocket Server] 关闭客户端连接失败: ${error}`)
        }
      })
      this.clients.clear()

      // 关闭 WebSocket 服务器
      this.wss.close(() => {
        // 关闭 HTTP 服务器
        this.server.close(() => {
          console.log('[WebSocket Server] 服务器已停止')
          resolve()
        })
      })
    })
  }

  /**
   * 设置事件处理器
   */
  private setupEventHandlers(): void {
    this.wss.on('connection', (ws: WebSocket, req) => {
      this.handleConnection(ws, req)
    })

    this.server.on('error', (err) => {
      console.error('[WebSocket Server] 服务器错误:', err)
    })

    // 优雅关闭
    process.on('SIGINT', () => this.stop())
    process.on('SIGTERM', () => this.stop())
  }

  /**
   * 处理新连接
   */
  private handleConnection(ws: WebSocket, req: any): void {
    const clientId = uuidv4()
    const clientAddress = req.socket.remoteAddress || 'unknown'

    const clientInfo: ClientInfo = {
      id: clientId,
      connectedAt: new Date(),
      lastActive: new Date(),
      address: clientAddress,
      ws: ws
    }

    this.clients.set(clientId, clientInfo)
    console.log(`[WebSocket Server] 新客户端连接: ${clientId} (${clientAddress})`)

    // 标记为活跃状态
    ;(ws as any).isAlive = true
    ;(ws as any).clientId = clientId

    // 设置消息处理器
    ws.on('message', (data, isBinary) => {
      this.handleMessage(clientId, data, isBinary)
    })

    // 设置 pong 处理器
    ws.on('pong', () => {
      ;(ws as any).isAlive = true
      clientInfo.lastActive = new Date()
    })

    // 设置错误处理器
    ws.on('error', (error) => {
      console.error(`[WebSocket Server] 客户端 ${clientId} 错误:`, error)
    })

    // 设置关闭处理器
    ws.on('close', (code, reason) => {
      console.log(
        `[WebSocket Server] 客户端 ${clientId} 断开连接: code=${code}, reason=${reason.toString()}`
      )
      this.clients.delete(clientId)
    })

    // 发送初始化数据
    this.sendInitializationData(clientId)
  }

  /**
   * 发送初始化数据
   */
  private sendInitializationData(clientId: string): void {
    const initData: WebSocketMessage = {
      llm_config: {
        api_key: process.env.LLM_API_KEY || 'sk-4c95a7ad84154ac584b42bfbccf99165',
        port: parseInt(process.env.LLM_PORT || '8080'),
        model: process.env.LLM_MODEL || 'deepseek/deepseek-chat',
        temperature: parseFloat(process.env.LLM_TEMPERATURE || '0.7'),
        base_url: ''
      },
      port: this.port,
      type: 'client_init'
    }

    this.sendToClient(clientId, initData)
  }

  /**
   * 处理接收到的消息
   */
  private handleMessage(clientId: string, data: RawData, isBinary: boolean): void {
    const client = this.clients.get(clientId)
    if (!client) {
      console.warn(`[WebSocket Server] Unknown client ${clientId}, message ignored`)
      return
    }

    try {
      const normalized = this.normalizeIncomingData(data, isBinary)
      if (normalized.kind === 'binary') {
        this.handleRawMessage(clientId, {
          type: 'raw',
          payload: normalized.buffer.toString('base64'),
          encoding: 'base64',
          metadata: {
            originalLength: normalized.buffer.byteLength,
            note: 'binary_message'
          }
        })
        return
      }

      const parseResult = this.tryParseJson(normalized.text)
      if (parseResult.ok) {
        console.log(`[WebSocket Server] 收到消息 (${clientId}):`, parseResult.value)
      }
    } catch (error) {
      console.error(`[WebSocket Server] Failed to process message (${clientId}):`, error)
    }
  }

  /**
   * 标准化原始数据，区分文本与二进制
   */
  private normalizeIncomingData(
    data: RawData,
    isBinary: boolean
  ): { kind: 'text'; text: string } | { kind: 'binary'; buffer: Buffer } {
    if (typeof data === 'string') {
      return { kind: 'text', text: data }
    }

    const buffer = this.ensureBuffer(data)
    const { text, validUtf8 } = this.decodeBuffer(buffer)

    if (!isBinary || validUtf8) {
      return { kind: 'text', text }
    }

    return { kind: 'binary', buffer }
  }

  /**
   * 确保原始数据转换为 Buffer
   */
  private ensureBuffer(data: RawData): Buffer {
    if (Buffer.isBuffer(data)) {
      return data
    }

    if (Array.isArray(data)) {
      return Buffer.concat(data)
    }

    if (data instanceof ArrayBuffer) {
      return Buffer.from(data)
    }

    throw new Error('Unsupported message payload received')
  }

  /**
   * 尝试以 UTF-8 解码缓冲数据，并标记是否有效
   */
  private decodeBuffer(buffer: Buffer): { text: string; validUtf8: boolean } {
    const text = buffer.toString('utf8')
    const reconverted = Buffer.from(text, 'utf8')
    return { text, validUtf8: reconverted.equals(buffer) }
  }

  /**
   * 安全解析 JSON 字符串
   */
  private tryParseJson(
    value: string
  ):
    | { ok: true; value: unknown }
    | { ok: false; errorCode: 'EMPTY_PAYLOAD' | 'INVALID_JSON'; errorMessage: string } {
    const trimmed = value.trim()

    if (!trimmed.length) {
      return { ok: false, errorCode: 'EMPTY_PAYLOAD', errorMessage: 'Received payload is empty' }
    }

    try {
      return { ok: true, value: JSON.parse(trimmed) }
    } catch (error) {
      return {
        ok: false,
        errorCode: 'INVALID_JSON',
        errorMessage: error instanceof Error ? error.message : 'Unable to parse JSON'
      }
    }
  }

  /**
   * 处理原始消息
   */
  private handleRawMessage(clientId: string, message: RawMessage): void {
    console.log(`[WebSocket Server] 收到原始消息 (${clientId}):`, message.payload)
  }
  /**
   * 发送消息到指定客户端
   */
  private sendToClient(clientId: string, message: MessageType): void {
    const client = this.clients.get(clientId)
    if (!client || client.ws.readyState !== WebSocket.OPEN) {
      console.warn(`[WebSocket Server] 客户端 ${clientId} 不可用`)
      return
    }

    try {
      client.ws.send(JSON.stringify(message))
    } catch (error) {
      console.error(`[WebSocket Server] 发送消息失败:`, error)
    }
  }

  /**
   * 广播消息到所有客户端
   */
  broadcast(message: MessageType): void {
    this.clients.forEach((client, clientId) => {
      this.sendToClient(clientId, message)
    })
  }

  /**
   * 启动心跳检测
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.clients.forEach((client, clientId) => {
        const ws = client.ws
        const isAlive = (ws as any).isAlive

        if (isAlive === false) {
          console.log(`[WebSocket Server] 客户端 ${clientId} 心跳超时，断开连接`)
          ws.terminate()
          this.clients.delete(clientId)
          return
        }

        ;(ws as any).isAlive = false
        try {
          ws.ping()
        } catch (error) {
          console.error(`[WebSocket Server] 心跳检测失败:`, error)
        }
      })
    }, 30000) // 30秒间隔
  }

  /**
   * 获取服务器状态
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      port: this.port,
      clientCount: this.clients.size,
      clients: Array.from(this.clients.values()).map((client) => ({
        id: client.id,
        address: client.address,
        connectedAt: client.connectedAt,
        lastActive: client.lastActive
      }))
    }
  }

  /**
   * 获取客户端信息
   */
  getClient(clientId: string): ClientInfo | undefined {
    return this.clients.get(clientId)
  }

  /**
   * 获取所有客户端
   */
  getAllClients(): ClientInfo[] {
    return Array.from(this.clients.values())
  }
}
