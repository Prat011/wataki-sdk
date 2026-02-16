import { WatakiClient } from '../index'

// Get your API key via POST /v1/auth/signup (see auth_example.ts)
// Tip: Visit /dashboard in your browser for visual monitoring (see observability.ts)
const client = new WatakiClient({
  baseUrl: 'https://api.wataki.cloud',
  apiKey: process.env.WATAKI_API_KEY
})

// Create an instance configured for DMs only
const instance = await client.createInstance({
  name: 'support-bot',
  description: 'Customer support WhatsApp bot',
  config: {
    allowed_dms: ['*'],
    allowed_groups: [],
    auto_reconnect: true,
    download_media: true
  }
})
console.log('Created instance:', instance.id)

// Connect it (will return QR code on first run)
const connect = await client.connectInstance(instance.id)
console.log('Status:', connect.status.state)
if (connect.qr) {
  console.log('QR code available — scan to authenticate')
}

// Check status
const status = await client.getInstanceStatus(instance.id)
console.log('Current state:', status.state)

// Update config to also allow a specific group
await client.updateInstance(instance.id, {
  config: {
    allowed_dms: ['*'],
    allowed_groups: ['120363123456789012@g.us'],
    respond_to_mentions_only: true,
    auto_reconnect: true,
    download_media: true
  }
})
console.log('Updated config to allow group')

// List your tenant's instances (only shows instances you own)
const list = await client.listInstances()
console.log('Your instances:', list.data.length)
for (const inst of list.data) {
  console.log(`  ${inst.id} — ${inst.name} (${inst.status.state})`)
}
