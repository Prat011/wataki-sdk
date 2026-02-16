# @wataki/wataki-sdk

TypeScript SDK for the [Wataki](https://wataki.cloud) WhatsApp API. Fully typed, ESM-only, zero config.

## Install

```bash
npm install @wataki/wataki-sdk
```

## Quick Start

```ts
import { WatakiClient } from '@wataki/wataki-sdk'

const wataki = new WatakiClient({
  baseUrl: 'https://api.wataki.cloud',
  apiKey: process.env.WATAKI_API_KEY,
})

// Create and connect a WhatsApp instance
const instance = await wataki.createInstance({ name: 'support-bot' })
const { qr } = await wataki.connectInstance(instance.id)
// Scan the QR code with WhatsApp to link

// Send a message
await wataki.sendMessage(instance.id, {
  chat_id: '919876543210@s.whatsapp.net',
  type: 'text',
  content: { body: 'Hello from Wataki!' },
})
```

## Configuration

```ts
const wataki = new WatakiClient({
  baseUrl: 'https://api.wataki.cloud', // required
  apiKey: 'wk_....',                 // optional, can set later with setApiKey()
  timeoutMs: 15000,                  // default: 10000
  axiosConfig: { /* any AxiosRequestConfig overrides */ },
})
```

## API Reference

### Instances

```ts
await wataki.listInstances({ limit: 10 })
await wataki.createInstance({ name: 'bot', config: { download_media: true } })
await wataki.getInstance(instanceId)
await wataki.updateInstance(instanceId, { name: 'renamed' })
await wataki.deleteInstance(instanceId)

await wataki.connectInstance(instanceId)    // returns QR code if needed
await wataki.getInstanceStatus(instanceId)
await wataki.disconnectInstance(instanceId)
```

### Messages

```ts
await wataki.sendMessage(instanceId, {
  chat_id: '919876543210@s.whatsapp.net',
  type: 'text',
  content: { body: 'Hello!' },
})

// With idempotency
await wataki.sendMessage(instanceId, payload, 'unique-key-123')

await wataki.listMessages(instanceId, { chat_id: '...' })
await wataki.getMessage(instanceId, messageId)
await wataki.reactToMessage(instanceId, messageId, '👍')
await wataki.markMessageRead(instanceId, messageId)
await wataki.sendPresence(instanceId, { chat_id: '...', state: 'composing' })
```

### Chats & Groups

```ts
await wataki.listChats(instanceId)
await wataki.getChat(instanceId, chatId)
await wataki.listGroups(instanceId)
```

### Media

```ts
await wataki.uploadMedia(instanceId, file, 'photo.jpg')
await wataki.getMedia(instanceId, mediaId)
const buffer = await wataki.downloadMedia(instanceId, mediaId)
```

### Webhooks

```ts
await wataki.listWebhooks(instanceId)
await wataki.createWebhook(instanceId, {
  url: 'https://example.com/hook',
  events: ['message.received', 'instance.connected'],
})
await wataki.updateWebhook(instanceId, webhookId, { active: false })
await wataki.deleteWebhook(instanceId, webhookId)
```

### Auth & API Keys

```ts
await wataki.signup({ name: 'Acme', email: 'dev@acme.com' })
await wataki.getMe()
await wataki.listApiKeys()
await wataki.createApiKey({ name: 'production' })
await wataki.deleteApiKey(keyId)
```

### Observability

```ts
await wataki.getObservabilityOverview({ since: '2025-01-01', bucket: 'day' })
await wataki.getMessageStats()
await wataki.getWebhookStats()
await wataki.getApiUsageStats()
await wataki.getInstanceHealth()
await wataki.getErrorSummary()
```

## Requirements

- Node.js >= 18
- ESM (`"type": "module"` in your package.json)

## License

MIT
