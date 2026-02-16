import { WatakiClient } from '../index'

// Get your API key via POST /v1/auth/signup (see auth_example.ts)
// Tip: Visit /dashboard in your browser for visual monitoring (see observability.ts)
const client = new WatakiClient({
  baseUrl: 'https://api.wataki.cloud',
  apiKey: process.env.WATAKI_API_KEY
})

const instanceId = process.env.WATAKI_INSTANCE_ID!
const webhookUrl = process.argv[2]

if (!webhookUrl) {
  console.error('Usage: npx tsx setup_webhook.ts <webhook_url>')
  console.error('Example: npx tsx setup_webhook.ts https://example.com/webhook')
  process.exit(1)
}

// Create a webhook that listens to all message events
const webhook = await client.createWebhook(instanceId, {
  url: webhookUrl,
  events: [
    'message.received',
    'message.status',
    'message.reaction',
    'message.read',
    'connection.update'
  ],
  secret: 'my-webhook-secret',
  active: true
})

console.log('Webhook created:', webhook.id)
console.log('URL:', webhook.url)
console.log('Events:', webhook.events.join(', '))
