import { EventEmitter } from 'events'
import WebSocket from 'ws'
import type {
  StreamOptions,
  StreamEvent,
  Message,
  MessageStatus,
  InstanceStatus,
} from './types.js'

export interface WatakiStreamEvents {
  open: []
  close: [code: number, reason: string]
  error: [err: Error]
  'message.received': [data: Message]
  'message.status': [data: { message_id: string; status: MessageStatus }]
  'connection.update': [data: InstanceStatus]
  'qr.updated': [data: { qr: string }]
}

export declare interface WatakiStream {
  on<K extends keyof WatakiStreamEvents>(event: K, listener: (...args: WatakiStreamEvents[K]) => void): this
  emit<K extends keyof WatakiStreamEvents>(event: K, ...args: WatakiStreamEvents[K]): boolean
}

export class WatakiStream extends EventEmitter {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private closed = false
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null

  private readonly reconnect: boolean
  private readonly reconnectIntervalMs: number
  private readonly maxReconnectAttempts: number

  constructor(
    private readonly url: string,
    options?: StreamOptions,
  ) {
    super()
    this.reconnect = options?.reconnect ?? true
    this.reconnectIntervalMs = options?.reconnectIntervalMs ?? 3000
    this.maxReconnectAttempts = options?.maxReconnectAttempts ?? 10
    this.connect()
  }

  private connect() {
    this.ws = new WebSocket(this.url)

    this.ws.on('open', () => {
      this.reconnectAttempts = 0
      this.emit('open')
    })

    this.ws.on('message', (raw) => {
      try {
        const event: StreamEvent = JSON.parse(raw.toString())
        this.emit(event.event as keyof WatakiStreamEvents, event.data as never)
      } catch {
        this.emit('error', new Error(`Invalid stream message: ${raw}`))
      }
    })

    this.ws.on('close', (code, reason) => {
      this.emit('close', code, reason.toString())
      if (!this.closed && this.reconnect) {
        this.tryReconnect()
      }
    })

    this.ws.on('error', (err) => {
      this.emit('error', err)
    })
  }

  private tryReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.emit('error', new Error(`Max reconnect attempts (${this.maxReconnectAttempts}) reached`))
      return
    }
    this.reconnectAttempts++
    this.reconnectTimer = setTimeout(() => this.connect(), this.reconnectIntervalMs)
  }

  close() {
    this.closed = true
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    this.ws?.close()
  }
}