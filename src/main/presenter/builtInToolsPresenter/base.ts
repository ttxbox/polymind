import { MCPToolResponse } from '@shared/presenter'

export interface BuiltInToolDefinition {
  name: string
  description: string
  parameters: {
    type: string
    properties: Record<string, any>
    required: string[]
  }
}

export interface BuiltInToolExecuteResult {
  content: string
  success: boolean
  metadata?: Record<string, any>
}

export interface BuiltInToolResponse {
  toolCallId: string
  content: string
  success: boolean
  metadata?: Record<string, any>
  rawData: MCPToolResponse
}

export function validateToolArgs(
  tool: BuiltInToolDefinition,
  args: any
): { ok: true; normalizedArgs: any } | { ok: false; message: string } {
  try {
    const properties = tool.parameters.properties || {}
    const normalizedArgs = normalizeToolArgs(args, properties)

    const required = Array.isArray(tool.parameters.required) ? tool.parameters.required : []

    for (const key of required) {
      if (normalizedArgs == null || !(key in normalizedArgs)) {
        return { ok: false, message: `Required parameters are missing: ${key}` }
      }
    }

    for (const [key, schema] of Object.entries(properties)) {
      if (!(key in (normalizedArgs || {}))) continue
      const val = (normalizedArgs as any)[key]
      const schemaTypes = getSchemaTypes((schema as any)?.type)

      if (schemaTypes.has('string') && typeof val !== 'string') {
        return { ok: false, message: `The parameter ${key} needs to be string` }
      }
      if (schemaTypes.has('boolean') && typeof val !== 'boolean') {
        return { ok: false, message: `The parameter ${key} needs to be boolean` }
      }
      if ((schemaTypes.has('number') || schemaTypes.has('integer')) && typeof val !== 'number') {
        return { ok: false, message: `The parameter ${key} needs to be number` }
      }
    }

    return { ok: true, normalizedArgs }
  } catch {
    return { ok: true, normalizedArgs: args }
  }
}

function normalizeToolArgs(
  args: any,
  properties: Record<string, any>
): Record<string, unknown> | any {
  if (args == null || typeof args !== 'object' || Array.isArray(args)) return args

  const normalized: Record<string, unknown> = { ...(args as Record<string, unknown>) }

  for (const [key, schema] of Object.entries(properties)) {
    if (!(key in normalized)) continue
    normalized[key] = coerceToolArgValue(normalized[key], schema)
  }

  return normalized
}

function coerceToolArgValue(value: unknown, schema: any): unknown {
  if (value == null) return value

  const schemaTypes = getSchemaTypes(schema?.type)

  if ((schemaTypes.has('number') || schemaTypes.has('integer')) && typeof value === 'string') {
    const trimmed = value.trim()
    if (trimmed.length > 0) {
      const parsedNumber = Number(trimmed)
      if (!Number.isNaN(parsedNumber) && Number.isFinite(parsedNumber)) {
        if (schemaTypes.has('integer') && !Number.isInteger(parsedNumber)) {
          return value
        }
        return parsedNumber
      }
    }
  }

  if (schemaTypes.has('boolean') && typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (normalized === 'true') return true
    if (normalized === 'false') return false
  }

  if (
    schemaTypes.has('object') &&
    schema?.properties &&
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  ) {
    const nested: Record<string, unknown> = { ...(value as Record<string, unknown>) }
    for (const [nestedKey, nestedSchema] of Object.entries(schema.properties)) {
      if (!(nestedKey in nested)) continue
      nested[nestedKey] = coerceToolArgValue(nested[nestedKey], nestedSchema)
    }
    return nested
  }

  if (schemaTypes.has('array') && Array.isArray(value) && schema?.items) {
    return value.map((item) => coerceToolArgValue(item, schema.items))
  }

  return value
}

function getSchemaTypes(typeDefinition: unknown): Set<string> {
  if (typeof typeDefinition === 'string') {
    return new Set([typeDefinition])
  }
  if (Array.isArray(typeDefinition)) {
    return new Set(typeDefinition.filter((t): t is string => typeof t === 'string'))
  }
  return new Set()
}

export function buildRawData(
  toolCallId: string,
  content: string,
  isError: boolean,
  metadata?: Record<string, any>
): MCPToolResponse {
  const rawData: MCPToolResponse = {
    toolCallId,
    content,
    isError
  }

  if (metadata && Object.keys(metadata).length > 0) {
    rawData._meta = metadata
  }

  return rawData
}
