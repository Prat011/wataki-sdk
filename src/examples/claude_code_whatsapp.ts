/**
 * Claude Code × WhatsApp (streaming)
 *
 * Run this script, scan the QR code with your phone, then text on WhatsApp.
 * Every incoming message is streamed through the Claude Agent SDK and
 * partial responses are sent back to WhatsApp in real-time.
 *
 * Usage:
 *   WATAKI_API_KEY=wk_... npx tsx src/examples/claude_code_whatsapp.ts
 *
 * Optional env vars:
 *   WATAKI_INSTANCE_ID  – reuse an existing instance (skips creation)
 *   WATAKI_BASE_URL     – defaults to https://api.wataki.cloud
 */

import { query } from '@anthropic-ai/claude-agent-sdk'
import { WatakiClient } from '@wataki/wataki-sdk'

const client = new WatakiClient({
  baseUrl: process.env.WATAKI_BASE_URL || 'https://api.wataki.cloud',
  apiKey: process.env.WATAKI_API_KEY,
})

// ── 1. Get or create an instance ────────────────────────────────────────────

let instanceId = process.env.WATAKI_INSTANCE_ID

if (!instanceId) {
  const instance = await client.createInstance({
    name: 'claude-code-bot',
    config: { allowed_dms: ['*'], allowed_groups: [] },
  })
  instanceId = instance.id
  console.log(`Created instance: ${instanceId}`)
  console.log(`(Tip: re-run with WATAKI_INSTANCE_ID=${instanceId} to skip creation next time)\n`)
}

// ── 2. Open stream first, then connect ──────────────────────────────────────

const stream = client.subscribe(instanceId)

await new Promise<void>((resolve, reject) => {
  stream.on('open', resolve)
  stream.on('error', reject)
})

console.log('Stream connected.')

await client.connectInstance(instanceId)

const connected = await new Promise<boolean>((resolve) => {
  let resolved = false
  const done = (val: boolean) => {
    if (!resolved) { resolved = true; resolve(val) }
  }

  stream.on('connection.update', (status) => {
    if (status.state === 'connected') {
      console.log('Connected to WhatsApp!\n')
      done(true)
    }
  })

  stream.on('qr.updated', async ({ qr }) => {
    const qrTerminal = await import('qrcode-terminal').then((m: any) => m.default ?? m)
    qrTerminal.generate(qr, { small: true })
    console.log('\nScan the QR code above with WhatsApp on your phone.\n')
  })

  setTimeout(() => {
    console.error('Timed out waiting for WhatsApp connection.')
    done(false)
  }, 120_000)
})

if (!connected) {
  stream.close()
  process.exit(1)
}

// ── 3. Listen for messages ──────────────────────────────────────────────────

console.log('Listening for WhatsApp messages... (Ctrl+C to stop)\n')

stream.on('message.received', async (message) => {
  const text = (message.content as Record<string, string>).text
  if (!text) return

  const sender = message.from.replace('@s.whatsapp.net', '').replace('@lid', '')
  console.log(`← [${sender}]: ${text}`)

  // Show typing indicator
  await client.sendPresence(instanceId, {
    chat_id: message.chat_id,
    state: 'composing',
  }).catch(() => {})

  // Stream Claude's response using the Agent SDK
  let accumulated = ''

  try {
    const conversation = query({
      prompt: text,
      options: {
        includePartialMessages: true,
        permissionMode: 'bypassPermissions',
        allowDangerouslySkipPermissions: true,
      },
    })

    for await (const msg of conversation) {
      if (msg.type === 'stream_event') {
        const event = msg.event as any
        if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
          accumulated += event.delta.text
          process.stdout.write(event.delta.text)
        }
      }
    }
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err)
    console.error(`\nClaude error: ${errMsg}`)
  }

  // Stop typing indicator
  await client.sendPresence(instanceId, {
    chat_id: message.chat_id,
    state: 'paused',
  }).catch(() => {})

  const reply = accumulated.trim()
  if (!reply) {
    console.error('\nClaude returned no output')
    return
  }

  // Send once
  try {
    await client.sendMessage(instanceId, {
      chat_id: message.chat_id,
      type: 'text',
      content: { text: reply },
    })
    console.log(`\n→ [claude]: ${reply}\n`)
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err)
    console.error(`\nSend error: ${errMsg}`)
  }
})

stream.on('error', (err) => {
  console.error('Stream error:', err.message)
})

stream.on('close', (code, reason) => {
  console.log(`Stream closed (${code}): ${reason}`)
})

process.on('SIGINT', () => {
  console.log('\nShutting down...')
  stream.close()
  process.exit(0)
})
