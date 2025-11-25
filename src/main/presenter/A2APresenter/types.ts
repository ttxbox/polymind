/**
 * A2A Presenter Type Definitions
 *
 * This file centralizes all custom types that the presenter relies on so that
 * the rest of the module can import from a single place.
 */
// Re-export shared contract types that the presenter must comply with
export type {
  A2AArtifact,
  A2APart,
  A2AServerResponse,
  A2AMessageSendParams,
  A2AClientData,
  AgentCardData
} from '@shared/presenter'

export enum A2A_INNER_ERROR_CODE {
  MESSAGE_ERROR = -1,
  STREAMING_MESSAGE_ERROR = -2
}
