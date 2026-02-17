export type InstanceStatusState =
  | 'disconnected'
  | 'connecting'
  | 'qr_required'
  | 'connected'
  | 'reconnecting'
  | 'logged_out'
  | 'error'

export type MessageType =
  | 'text'
  | 'image'
  | 'video'
  | 'audio'
  | 'document'
  | 'sticker'
  | 'location'
  | 'contacts'
  | 'buttons'
  | 'list'
  | 'template'
  | 'reaction'

export type MessageStatus = 'queued' | 'sent' | 'delivered' | 'read' | 'failed'

export interface PageInfo {
  next_cursor?: string | null
}

export interface InstanceConfig {
  allowed_groups?: string[]
  allowed_dms?: string[]
  respond_to_mentions_only?: boolean
  auto_reconnect?: boolean
  download_media?: boolean
  emit_raw?: boolean
}

export interface InstanceStatus {
  state: InstanceStatusState
  last_error?: string | null
  updated_at?: string
}

export interface Instance {
  id: string
  name: string
  description?: string
  status: InstanceStatus
  config?: InstanceConfig
  phone_number?: string | null
  jid?: string | null
  created_at?: string
  updated_at?: string
}

export interface InstanceList {
  data: Instance[]
  page: PageInfo
}

export interface ConnectResponse {
  status: InstanceStatus
  qr?: string | null
  qr_image_data_url?: string | null
}

export interface Chat {
  id: string
  name: string
  is_group: boolean
  participant_count?: number | null
  last_message_id?: string | null
}

export interface ChatList {
  data: Chat[]
  page: PageInfo
}

export interface Group {
  id: string
  name: string
  description?: string | null
  participant_count?: number | null
}

export interface GroupList {
  data: Group[]
  page: PageInfo
}

export interface Message {
  id: string
  chat_id: string
  from: string
  to: string
  direction: 'inbound' | 'outbound'
  type: MessageType
  content: Record<string, unknown>
  status?: MessageStatus
  timestamp: string
  raw?: Record<string, unknown>
}

export interface MessageList {
  data: Message[]
  page: PageInfo
}

export interface Webhook {
  id: string
  url: string
  events: string[]
  active: boolean
  secret?: string | null
  created_at?: string
  updated_at?: string
}

export interface WebhookList {
  data: Webhook[]
}

export interface MediaObject {
  id: string
  mime_type: string
  size_bytes: number
  url?: string | null
  created_at?: string
}

export interface HealthStatus {
  status: 'ok' | 'degraded'
  uptime_s: number
  checks: Record<string, unknown>
}

export interface Tenant {
  id: string
  name: string
  email: string
  plan: string
  status: string
  dodo_customer_id?: string | null
  created_at?: string
  updated_at?: string
}

export interface SignupResponse {
  tenant: Tenant
  api_key: string
}

export interface ApiKeySummary {
  id: string
  key_prefix: string
  name: string
  created_at?: string
  last_used_at?: string | null
}

export interface ApiKeyList {
  data: ApiKeySummary[]
}

export interface ApiKeyCreateResponse {
  id: string
  api_key: string
  key_prefix: string
  name: string
  created_at?: string
}

export interface ErrorResponse {
  error: {
    code: string
    message: string
    details?: Record<string, unknown>
  }
}

// --- Observability Types ---

export interface ObservabilityParams {
  since?: string
  until?: string
  instance_id?: string
  bucket?: 'hour' | 'day'
  limit?: number
}

export interface ObservabilityOverview {
  messages: {
    total: number
    breakdown: Array<{ direction: string; type: string; status: string; count: number }>
  }
  instances: {
    total: number
    connected: number
    health: ObservabilityInstanceHealth[]
  }
  webhooks: {
    success_rate: number
    total: number
    success_count: number
    failure_count: number
    avg_latency_ms: number
  }
  api: {
    total_requests: number
    breakdown: Array<{ method: string; path: string; status_bucket: string; count: number; avg_latency_ms: number }>
  }
}

export interface ObservabilityMessageStats {
  stats: Array<{ direction: string; type: string; status: string; count: number }>
  time_series: Array<{ bucket: string; direction: string; count: number }>
}

export interface ObservabilityWebhookStats {
  stats: {
    total: number
    success_count: number
    failure_count: number
    avg_latency_ms: number
  }
  time_series: Array<{ bucket: string; success: number; failed: number; avg_latency_ms: number }>
  recent_failures: Array<{
    id: string
    webhook_id: string
    instance_id: string
    event: string
    url: string
    status_code: number | null
    success: boolean
    latency_ms: number | null
    error: string | null
    attempt: number
    created_at: string
  }>
}

export interface ObservabilityApiUsage {
  stats: Array<{ method: string; path: string; status_bucket: string; count: number; avg_latency_ms: number }>
  time_series: Array<{ bucket: string; count: number; avg_latency_ms: number }>
}

export interface ObservabilityInstanceHealth {
  id: string
  name: string
  status: InstanceStatus
  phone_number: string | null
  jid: string | null
  created_at: string
  updated_at: string
  message_count: number
  inbound_count: number
  outbound_count: number
  media_count: number
}

export interface ObservabilityErrors {
  failed_messages: number
  failed_webhooks: number
  api_5xx: number
  errored_instances: number
}

// --- Billing Types ---

export interface BillingPlan {
  id: string
  name: string
  price_cents: number
  included_messages: number
}

export interface BillingPlans {
  data: BillingPlan[]
}

export interface BillingUsage {
  plan: {
    id: string
    name: string
    price_cents: number
    included_messages: number
    cancels_at_cycle_end: boolean
  }
  billing_cycle: {
    start: string | null
    end: string | null
    days_remaining: number
  }
  usage: {
    sent: number
    included: number
    remaining: number
  }
}

export interface BillingUpgradeResponse {
  plan: string
  checkout_url: string | null
  session_id: string
}


export interface StreamOptions {
  /** Auto-reconnect on disconnect (default: true) */
  reconnect?: boolean
  /** Ms between reconnect attempts (default: 3000) */
  reconnectIntervalMs?: number
  /** Give up after N attempts (default: 10) */
  maxReconnectAttempts?: number
}

export interface StreamEvent<T = unknown> {
  event: string
  data: T
}

export interface MessageReceivedData {
  instance_id: string
  message: Message
}

export interface MessageStatusData {
  instance_id: string
  message_id: string
  status: MessageStatus
  timestamp: string
}

export interface ConnectionUpdateData {
  instance_id: string
  status: InstanceStatus
}
