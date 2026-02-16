import { WatakiClient } from '../index'

// Get your API key via POST /v1/auth/signup (see auth_example.ts)
// Tip: Visit /dashboard in your browser for visual monitoring (see observability.ts)
const client = new WatakiClient({
  baseUrl: 'https://api.wataki.cloud',
  apiKey: process.env.WATAKI_API_KEY
})

const instanceId = process.env.WATAKI_INSTANCE_ID!
const chatId = process.argv[2]
const messageId = process.argv[3]

if (!chatId || !messageId) {
  console.error('Usage: npx tsx react_and_presence.ts <chat_id> <message_id>')
  process.exit(1)
}

// Show typing indicator
await client.sendPresence(instanceId, { chat_id: chatId, state: 'composing' })
console.log('Typing indicator sent')

// Simulate thinking for 2 seconds
await new Promise(r => setTimeout(r, 2000))

// Stop typing
await client.sendPresence(instanceId, { chat_id: chatId, state: 'paused' })

// React to the message
const reaction = await client.reactToMessage(instanceId, messageId, '\u{1F44D}')
console.log('Reacted to message:', reaction.id)

// Mark as read
const read = await client.markMessageRead(instanceId, messageId)
console.log('Marked as read:', read.status)
