import { createOpencode } from '@opencode-ai/sdk'
import { WatakiClient } from '@wataki/wataki-sdk'

const MODEL = process.env.OPENCODE_MODEL ?? 'opencode/big-pickle'
const DEBUG = process.env.DEBUG === '1'

const client = new WatakiClient({
  baseUrl: 'https://api.wataki.cloud',
  apiKey: process.env.WATAKI_API_KEY,
})

// ── 1. Start the OpenCode server ─────────────────────────────────────────────
 
console.log('Starting OpenCode server...')
const { client: opencode } = await createOpencode()
console.log(`OpenCode ready. Using model: ${MODEL}\n`)

// ── 2. Get or create a Wataki instance ───────────────────────────────────────

let instanceId = process.env.WATAKI_INSTANCE_ID

if (!instanceId) {
  const instance = await client.createInstance({
    name: 'opencode-bot',
    config: { allowed_dms: ['*'], allowed_groups: [] },
  })
  instanceId = instance.id
  console.log(`Created instance: ${instanceId}`)
  console.log(`(Tip: re-run with WATAKI_INSTANCE_ID=${instanceId} to skip creation next time)\n`)
}

// ── 3. Open stream, then connect ─────────────────────────────────────────────

const stream = client.subscribe(instanceId)

await new Promise<void>((resolve, reject) => {
  stream.on('open', resolve)
  stream.on('error', reject)
})

console.log('Stream connected.')

const currentStatus = await client.getInstanceStatus(instanceId)

const connected = currentStatus.state === 'connected'
  ? (() => { console.log('Already connected to WhatsApp!\n'); return true })()
  : await (async () => {
      await client.connectInstance(instanceId)

      return new Promise<boolean>((resolve) => {
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
    })()

if (!connected) {
  stream.close()
  process.exit(1)
}

// ── 4. Listen for messages ────────────────────────────────────────────────────

console.log('Listening for WhatsApp messages... (Ctrl+C to stop)\n')

stream.on('message.received', async (message) => {
  const text = (message.content as Record<string, string>).text
  if (!text) return

  const sender = message.from.replace('@s.whatsapp.net', '').replace('@lid', '')
  console.log(`← [${sender}]: ${text}`)

  await client.sendPresence(instanceId, {
    chat_id: message.chat_id,
    state: 'composing',
  }).catch(() => {})

  let accumulated = ''

  try {
    const { data: session } = await opencode.session.create({ body: { title: sender } })
    if (!session) throw new Error('Failed to create session')

    const events = await opencode.event.subscribe()

    const [providerID, ...rest] = MODEL.split('/')
    await opencode.session.promptAsync({
      path: { id: session.id },
      body: {
        model: { providerID, modelID: rest.join('/') },
        parts: [{ type: 'text', text }],
      } as any,
    })

    for await (const event of events.stream) {
      const { type, properties } = event as any

      if (DEBUG) console.debug('[debug]', type, JSON.stringify(properties))

      if (type === 'message.part.delta' && properties?.sessionID === session.id) {
        const delta = properties?.delta
        if (delta) {
          accumulated += delta
          process.stdout.write(delta)
        }
      }

      if (
        (type === 'session.idle' || type === 'session.error') &&
        properties?.sessionID === session.id
      ) {
        break
      }
    }
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err)
    console.error(`\nOpenCode error: ${errMsg}`)
  }

  await client.sendPresence(instanceId, {
    chat_id: message.chat_id,
    state: 'paused',
  }).catch(() => {})

  const reply = accumulated.trim()
  if (!reply) {
    console.error('\nOpenCode returned no output')
    return
  }

  try {
    await client.sendMessage(instanceId, {
      chat_id: message.chat_id,
      type: 'text',
      content: { text: reply },
    })
    console.log(`\n→ [opencode]: ${reply}\n`)
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