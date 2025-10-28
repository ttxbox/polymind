/**
 * WebSocket 消息类型定义
 */

export interface LLMConfig {
  /** API 密钥 */
  api_key: string
  /** 端口号 */
  port: number
  /** 模型名称 */
  model: string
  /** 模型URL */
  base_url: string
  /** 温度参数 (0.0 - 2.0) */
  temperature: number
}

export interface WebSocketMessage {
  type: 'client_init'
  /** LLM 配置 */
  llm_config?: LLMConfig
  /** 端口号 */
  port?: number
}

export interface RawMessage {
  /** 消息类型 */
  type: 'raw'
  /** 原始载荷内容 */
  payload: string
  /** 原始数据的编码 */
  encoding?: 'utf8' | 'base64' | 'binary'
  /** 附加元数据 */
  metadata?: Record<string, unknown>
}

export type MessageType = WebSocketMessage | RawMessage

export interface ClientInfo {
  /** 客户端 ID */
  id: string
  /** 连接时间 */
  connectedAt: Date
  /** 最后活跃时间 */
  lastActive: Date
  /** 客户端地址 */
  address: string
  /** WebSocket 连接 */
  ws: any // WebSocket 类型
}
