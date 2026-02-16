import { WatakiClient } from '@wataki/wataki-sdk'

// Get your API key via POST /v1/auth/signup (see auth_example.ts)
// Tip: Visit /dashboard in your browser for visual monitoring (see observability.ts)
const client = new WatakiClient({
  baseUrl: 'https://api.wataki.cloud',
  apiKey: process.env.WATAKI_API_KEY
})

const instanceId = process.env.WATAKI_INSTANCE_ID!
const chatId = process.argv[2]

if (!chatId) {
  console.error('Usage: npx tsx fetch_messages.ts <chat_id>')
  console.error('Example: npx tsx fetch_messages.ts 5511999999999@s.whatsapp.net')
  process.exit(1)
}

// Fetch last 10 messages from a chat
const result = await client.listMessages(instanceId, {
  chat_id: chatId,
  limit: 10
})

for (const msg of result.data) {
  const dir = msg.direction === 'inbound' ? '<-' : '->'
  const text = (msg.content as { text?: string }).text || `[${msg.type}]`
  console.log(`${dir} ${msg.timestamp} | ${text}`)
}

console.log(`\nShowing ${result.data.length} messages`)
if (result.page.next_cursor) {
  console.log('More messages available (cursor:', result.page.next_cursor + ')')
}
