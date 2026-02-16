import { WatakiClient } from '../index'

// Get your API key via POST /v1/auth/signup (see auth_example.ts)
// Tip: Visit /dashboard in your browser for visual monitoring (see observability.ts)
const client = new WatakiClient({
  baseUrl: 'https://api.wataki.cloud',
  apiKey: process.env.WATAKI_API_KEY
})

const instanceId = process.env.WATAKI_INSTANCE_ID!

// List all chats with pagination
let cursor: string | undefined
do {
  const result = await client.listChats(instanceId, { limit: 20, cursor })
  for (const chat of result.data) {
    const tag = chat.is_group ? '[GROUP]' : '[DM]'
    console.log(`${tag} ${chat.name} (${chat.id})`)
  }
  cursor = result.page.next_cursor ?? undefined
} while (cursor)
