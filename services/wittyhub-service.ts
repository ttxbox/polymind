import { WittyHubAgent, WittyHubAgentListResponse, WittyHubDownloadResponse } from '@/lib/types'

class WittyHubService {
  private getBaseUrl(): string {
    return '/api/wittyhub'
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const baseUrl = this.getBaseUrl()

    const normalizedBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
    const url = `${normalizedBase}${normalizedEndpoint}`
    const defaultHeaders = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options?.headers,
      },
    })

    if (!response.ok) {
      throw new Error(`WittyHub API Error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  public async listAgents(
    skip: number = 0,
    limit: number = 20,
    category?: string,
    tags?: string
  ): Promise<WittyHubAgentListResponse> {
    const params = new URLSearchParams({
      skip: String(skip),
      limit: String(limit),
    })
    if (category) {
      params.append('category', category)
    }
    if (tags) {
      params.append('tags', tags)
    }
    return this.request<WittyHubAgentListResponse>(`/api/v1/agents/?${params.toString()}`)
  }

  public async getAgent(agentId: string): Promise<WittyHubAgent> {
    const response = await this.request<{ data?: WittyHubAgent }>(
      `/api/v1/agents/${encodeURIComponent(agentId)}`
    )
    return response.data || (response as unknown as WittyHubAgent)
  }

  public async getDownloadUrl(agentId: string): Promise<string> {
    const response = await this.request<WittyHubDownloadResponse>(
      `/api/v1/agents/${encodeURIComponent(agentId)}/download`
    )
    return response.download_url
  }
}

export const wittyHubService = new WittyHubService()
