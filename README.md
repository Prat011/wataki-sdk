# @wataki/wataki-sdk

TypeScript SDK for the [Wataki](https://wataki.cloud) WhatsApp API. Fully typed, ESM-only, zero config.

## AI Agent Examples

Turn any WhatsApp number into an AI coding assistant in under a minute.

All examples read config from a `.env` file. Create one in the project root:

```bash
# .env
WATAKI_API_KEY=wk_...
WATAKI_INSTANCE_ID=        # fill in after first run to skip QR scan
```

Then run any example with:

```bash
npx tsx --env-file=.env src/examples/<example>.ts
```

---

### Claude Code × WhatsApp

Streams responses from [Claude Code](https://claude.ai/code) back to WhatsApp in real-time.

**Prerequisites**

```bash
npm install -g @anthropic-ai/claude-agent-sdk
npm install @wataki/wataki-sdk
```

**`.env`**

```bash
WATAKI_API_KEY=wk_...
WATAKI_INSTANCE_ID=        # optional — fill in after first run
```

**Run**

```bash
npx tsx --env-file=.env src/examples/claude_code_whatsapp.ts
```

Scan the QR code that appears with WhatsApp on your phone. Copy the printed instance ID into `WATAKI_INSTANCE_ID` to skip the QR scan on future runs.

---

### OpenCode × WhatsApp

Streams responses from [OpenCode](https://opencode.ai) back to WhatsApp. Supports free models via [OpenCode Zen](https://opencode.ai/zen) — no credit card needed for the free tier.

**Prerequisites**

```bash
npm install -g opencode-ai
npm install @wataki/wataki-sdk @opencode-ai/sdk
```

Get a free API key at [opencode.ai/auth](https://opencode.ai/auth).

**`.env`**

```bash
WATAKI_API_KEY=wk_...
WATAKI_INSTANCE_ID=           # optional — fill in after first run

OPENCODE_API_KEY=<key>        # from opencode.ai/auth
OPENCODE_MODEL=opencode/big-pickle   # see model options below
```

**Run**

```bash
npx tsx --env-file=.env src/examples/opencode_whatsapp.ts
```

**Free models (OpenCode Zen)**

| Model | `OPENCODE_MODEL` value |
|---|---|
| Big Pickle *(default)* | `opencode/big-pickle` |
| GLM 5 | `opencode/glm-5-free` |
| Kimi K2.5 | `opencode/kimi-k2.5-free` |
| MiniMax M2.5 | `opencode/minimax-m2.5-free` |

**Other providers** — set the matching API key alongside `OPENCODE_MODEL`:

```bash
# Anthropic
OPENCODE_MODEL=anthropic/claude-sonnet-4-6
ANTHROPIC_API_KEY=sk-ant-...

# OpenAI
OPENCODE_MODEL=openai/gpt-5
OPENAI_API_KEY=sk-...

# Groq (free tier)
OPENCODE_MODEL=groq/llama-3.3-70b-versatile
GROQ_API_KEY=...

# Ollama (local, no API key)
OPENCODE_MODEL=ollama/qwen2.5-coder
```

Set `DEBUG=1` in `.env` to print raw SSE events for troubleshooting.

---

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
