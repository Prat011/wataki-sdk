import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import type {
  ApiKeyCreateResponse,
  ApiKeyList,
  Chat,
  ChatList,
  ConnectResponse,
  GroupList,
  HealthStatus,
  Instance,
  InstanceConfig,
  InstanceList,
  InstanceStatus,
  MediaObject,
  Message,
  MessageList,
  ObservabilityApiUsage,
  ObservabilityErrors,
  ObservabilityInstanceHealth,
  ObservabilityMessageStats,
  ObservabilityOverview,
  ObservabilityParams,
  ObservabilityWebhookStats,
  BillingPlans,
  BillingUpgradeResponse,
  BillingUsage,
  SignupResponse,
  StreamOptions,
  Tenant,
  Webhook,
  WebhookList
} from './types.js'
import { WatakiStream } from './stream.js'

export interface WatakiClientOptions {
  baseUrl: string
  apiKey?: string
  timeoutMs?: number
  axiosConfig?: AxiosRequestConfig
}

export interface ListParams {
  limit?: number
  cursor?: string
}

export class WatakiClient {
  private client: AxiosInstance

  constructor(options: WatakiClientOptions) {
    this.client = axios.create({
      baseURL: options.baseUrl.replace(/\/$/, ''),
      timeout: options.timeoutMs ?? 10000,
      ...options.axiosConfig
    })

    if (options.apiKey) {
      this.client.defaults.headers.common['X-API-Key'] = options.apiKey
    }
  }

  setApiKey(apiKey: string) {
    this.client.defaults.headers.common['X-API-Key'] = apiKey
  }

  async health(): Promise<HealthStatus> {
    return this.get('/health')
  }

  async signup(payload: { name: string; email: string }): Promise<SignupResponse> {
    return this.post('/v1/auth/signup', payload)
  }

  async getMe(): Promise<Tenant> {
    return this.get('/v1/auth/me')
  }

  async listApiKeys(): Promise<ApiKeyList> {
    return this.get('/v1/auth/api-keys')
  }

  async createApiKey(payload?: { name?: string }): Promise<ApiKeyCreateResponse> {
    return this.post('/v1/auth/api-keys', payload)
  }

  async deleteApiKey(keyId: string): Promise<void> {
    await this.delete(`/v1/auth/api-keys/${keyId}`)
  }

  async listInstances(params?: ListParams): Promise<InstanceList> {
    return this.get('/v1/instances', { params })
  }

  async createInstance(payload: { name: string; description?: string; config?: InstanceConfig }): Promise<Instance> {
    return this.post('/v1/instances', payload)
  }

  async getInstance(instanceId: string): Promise<Instance> {
    return this.get(`/v1/instances/${instanceId}`)
  }

  async updateInstance(instanceId: string, payload: { name?: string; description?: string; config?: InstanceConfig }): Promise<Instance> {
    return this.patch(`/v1/instances/${instanceId}`, payload)
  }

  async deleteInstance(instanceId: string): Promise<void> {
    await this.delete(`/v1/instances/${instanceId}`)
  }

  async connectInstance(instanceId: string): Promise<ConnectResponse> {
    return this.post(`/v1/instances/${instanceId}/connect`)
  }

  async getInstanceStatus(instanceId: string): Promise<InstanceStatus> {
    return this.get(`/v1/instances/${instanceId}/status`)
  }

  async disconnectInstance(instanceId: string): Promise<InstanceStatus> {
    return this.post(`/v1/instances/${instanceId}/disconnect`)
  }

  async listChats(instanceId: string, params?: ListParams): Promise<ChatList> {
    return this.get(`/v1/instances/${instanceId}/chats`, { params })
  }

  async getChat(instanceId: string, chatId: string): Promise<Chat> {
    return this.get(`/v1/instances/${instanceId}/chats/${encodeURIComponent(chatId)}`)
  }

  async listGroups(instanceId: string, params?: ListParams): Promise<GroupList> {
    return this.get(`/v1/instances/${instanceId}/groups`, { params })
  }

  async listMessages(instanceId: string, params: { chat_id: string } & ListParams): Promise<MessageList> {
    return this.get(`/v1/instances/${instanceId}/messages`, { params })
  }

  async sendMessage(
    instanceId: string,
    payload: { chat_id: string; type: string; content: Record<string, unknown>; metadata?: Record<string, unknown> },
    idempotencyKey?: string
  ): Promise<Message> {
    const config: AxiosRequestConfig = {}
    if (idempotencyKey) config.headers = { 'Idempotency-Key': idempotencyKey }
    return this.post(`/v1/instances/${instanceId}/messages`, payload, config)
  }

  async getMessage(instanceId: string, messageId: string): Promise<Message> {
    return this.get(`/v1/instances/${instanceId}/messages/${messageId}`)
  }

  async reactToMessage(instanceId: string, messageId: string, emoji: string): Promise<Message> {
    return this.post(`/v1/instances/${instanceId}/messages/${messageId}/react`, { emoji })
  }

  async markMessageRead(instanceId: string, messageId: string): Promise<{ message_id: string; status: string; timestamp: string }> {
    return this.post(`/v1/instances/${instanceId}/messages/${messageId}/read`)
  }

  async sendPresence(instanceId: string, payload: { chat_id: string; state: 'composing' | 'paused' | 'recording' }): Promise<{ chat_id: string; state: string; timestamp: string }> {
    return this.post(`/v1/instances/${instanceId}/presence`, payload)
  }

  async uploadMedia(instanceId: string, file: Blob | File, filename?: string): Promise<MediaObject> {
    const formData = new FormData()
    const name = filename || (file instanceof File ? file.name : 'upload')
    formData.append('file', file, name)
    return this.post(`/v1/instances/${instanceId}/media`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  }

  async getMedia(instanceId: string, mediaId: string): Promise<MediaObject> {
    return this.get(`/v1/instances/${instanceId}/media/${mediaId}`)
  }

  async downloadMedia(instanceId: string, mediaId: string): Promise<ArrayBuffer> {
    const res = await this.client.get(`/v1/instances/${instanceId}/media/${mediaId}/content`, {
      responseType: 'arraybuffer'
    })
    return res.data
  }

  async listWebhooks(instanceId: string): Promise<WebhookList> {
    return this.get(`/v1/instances/${instanceId}/webhooks`)
  }

  async createWebhook(
    instanceId: string,
    payload: { url: string; events: string[]; secret?: string; active?: boolean }
  ): Promise<Webhook> {
    return this.post(`/v1/instances/${instanceId}/webhooks`, payload)
  }

  async updateWebhook(
    instanceId: string,
    webhookId: string,
    payload: { url?: string; events?: string[]; secret?: string | null; active?: boolean }
  ): Promise<Webhook> {
    return this.patch(`/v1/instances/${instanceId}/webhooks/${webhookId}`, payload)
  }

  async deleteWebhook(instanceId: string, webhookId: string): Promise<void> {
    await this.delete(`/v1/instances/${instanceId}/webhooks/${webhookId}`)
  }

  // --- Billing ---

  async getBillingPlans(): Promise<BillingPlans> {
    return this.get('/v1/billing/plans')
  }

  async getBillingUsage(): Promise<BillingUsage> {
    return this.get('/v1/billing/usage')
  }

  async upgradePlan(plan: 'growth' | 'scale'): Promise<BillingUpgradeResponse> {
    return this.post('/v1/billing/upgrade', { plan })
  }

  // --- Observability ---

  async getObservabilityOverview(params?: ObservabilityParams): Promise<ObservabilityOverview> {
    return this.get('/v1/observability/overview', { params })
  }

  async getMessageStats(params?: ObservabilityParams): Promise<ObservabilityMessageStats> {
    return this.get('/v1/observability/messages', { params })
  }

  async getWebhookStats(params?: ObservabilityParams): Promise<ObservabilityWebhookStats> {
    return this.get('/v1/observability/webhooks', { params })
  }

  async getApiUsageStats(params?: ObservabilityParams): Promise<ObservabilityApiUsage> {
    return this.get('/v1/observability/api-usage', { params })
  }

  async getInstanceHealth(): Promise<{ data: ObservabilityInstanceHealth[] }> {
    return this.get('/v1/observability/instances')
  }

  async getErrorSummary(params?: ObservabilityParams): Promise<ObservabilityErrors> {
    return this.get('/v1/observability/errors', { params })
  }

  getDashboardUrl(): string {
    return `${this.client.defaults.baseURL}/dashboard`
  }

  /**
   * Open a WebSocket stream for real-time events on an instance.
   * No webhook server required — events are pushed directly over the socket.
   *
   * ```ts
   * const stream = client.subscribe(instanceId)
   * stream.on('message.received', ({ message }) => { ... })
   * ```
   */
  subscribe(instanceId: string, options?: StreamOptions): WatakiStream {
    const base = this.client.defaults.baseURL!.replace(/^http/, 'ws')
    const apiKey = this.client.defaults.headers.common['X-API-Key'] as string
    const url = `${base}/v1/instances/${instanceId}/stream?api_key=${encodeURIComponent(apiKey)}`
    return new WatakiStream(url, options)
  }

  private async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const res: AxiosResponse<T> = await this.client.get(url, config)
    return res.data
  }

  private async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const res: AxiosResponse<T> = await this.client.post(url, data, config)
    return res.data
  }

  private async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const res: AxiosResponse<T> = await this.client.patch(url, data, config)
    return res.data
  }

  private async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const res: AxiosResponse<T> = await this.client.delete(url, config)
    return res.data
  }
}
