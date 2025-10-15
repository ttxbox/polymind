/**
 * A2A Presenter Type Definitions
 *
 * This file contains all custom types and interfaces used by the A2A Presenter.
 * It also re-exports necessary types from the @a2a-js/sdk for convenience.
 */

// Re-export SDK types
export type {
  AgentCard,
  Task,
  TaskState,
  TaskStatusUpdateEvent,
  TaskArtifactUpdateEvent,
  Message,
  MessageSendParams,
  Part,
  TextPart,
  FilePart,
  DataPart,
  JSONRPCErrorResponse
} from '@a2a-js/sdk'

export enum A2A_INNER_ERROR_CODE {
  MESSAGE_ERROR = -1,
  STREAMING_MESSAGE_ERROR = -2
}

/**
 * Unified response data format for A2A interactions
 * Used for frontend display and event propagation
 */
export interface A2AResponseData {
  /** Response type discriminator */
  kind: 'message' | 'task' | 'status-update' | 'artifact-update' | 'error'
  /** Timestamp when this response was created */
  /** Name of the A2A server that generated this response */
  serverName: string
  contextId?: string
  taskId?: string

  /** Message data (when type is 'message') */
  message?: {
    parts: A2APart[]
  }

  /** Task data (when type is 'task') */
  task?: {
    status: {
      state: string // TaskState
      parts?: A2APart[]
    }
    artifacts?: A2AArtifact[]
  }

  /** Status update data (when type is 'task-status-update') */
  statusUpdate?: {
    status: {
      state: string // TaskState
      parts?: A2APart[]
    }
    final: boolean
  }

  /** Artifact update data (when type is 'task-artifact-update') */
  artifactUpdate?: {
    artifact: A2AArtifact
    /** If true, the content of this artifact should be appended to a previously sent artifact with the same ID. */
    append?: boolean
    /** If true, this is the final chunk of the artifact. */
    lastChunk?: boolean
  }

  /** Error data (when type is 'error') */
  error?: {
    code: number
    message: string
    data?: unknown
  }
}

/**
 * Simplified part representation for frontend consumption
 */
export interface A2APart {
  /** Part type */
  type: 'text' | 'data' | 'file'
  /** Text content (for text parts) */
  text?: string
  /** Structured data (for data parts) */
  data?: unknown
  /** File information (for file parts) */
  file?: {
    name?: string
    mimeType?: string
    uri?: string
    bytes?: string // base64 encoded
  }
}

/**
 * Artifact representation for frontend consumption
 */
export interface A2AArtifact {
  /**
   * An optional, human-readable name for the artifact.
   */
  name?: string
  /**
   * An array of content parts that make up the artifact.
   */
  parts: A2APart[]
}
