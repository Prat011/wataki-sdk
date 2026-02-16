import { WatakiClient } from '../index'

// Get your API key via POST /v1/auth/signup (see auth_example.ts)
// Tip: Visit /dashboard in your browser for visual monitoring (see observability.ts)
const client = new WatakiClient({
  baseUrl: 'https://api.wataki.cloud',
  apiKey: process.env.WATAKI_API_KEY
})

// Use your instance ID (from createInstance or listInstances)
const instanceId = process.env.WATAKI_INSTANCE_ID || 'your-instance-id'

// Phone number in WhatsApp JID format: <country_code><number>@s.whatsapp.net
const phoneNumber = process.argv[2]
if (!phoneNumber) {
  console.error('Usage: npx tsx send_message.ts <phone_number> [message]')
  console.error('Example: npx tsx send_message.ts 5511999999999 "Hello from Wataki!"')
  process.exit(1)
}

const chatId = phoneNumber.includes('@') ? phoneNumber : `${phoneNumber}@s.whatsapp.net`
const text = process.argv[3] || 'Hello from Wataki!'

const message = await client.sendMessage(instanceId, {
  chat_id: chatId,
  type: 'text',
  content: { text }
})

console.log('Message sent:', message.id)
