import { WatakiClient } from '../index'

// Get your API key via POST /v1/auth/signup (see auth_example.ts)
// Tip: Visit /dashboard in your browser for visual monitoring (see observability.ts)
const client = new WatakiClient({
  baseUrl: 'https://api.wataki.cloud',
  apiKey: process.env.WATAKI_API_KEY
})

const instanceId = process.env.WATAKI_INSTANCE_ID!
const phoneNumber = process.argv[2]

if (!phoneNumber) {
  console.error('Usage: npx tsx send_location.ts <phone_number>')
  process.exit(1)
}

const chatId = phoneNumber.includes('@') ? phoneNumber : `${phoneNumber}@s.whatsapp.net`

const message = await client.sendMessage(instanceId, {
  chat_id: chatId,
  type: 'location',
  content: {
    latitude: 37.7749,
    longitude: -122.4194,
    name: 'San Francisco',
    address: 'San Francisco, CA, USA'
  }
})

console.log('Location sent:', message.id)
