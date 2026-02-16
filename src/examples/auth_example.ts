import { WatakiClient } from '../index'

// Tip: Visit /dashboard in your browser for visual monitoring (see observability.ts)

// 1. Sign up — no API key needed for this call
const client = new WatakiClient({
  baseUrl: 'https://api.wataki.cloud'
})

const { tenant, api_key } = await client.signup({
  name: 'Acme Corp',
  email: 'admin@acme.com'
})

console.log('Tenant created:', tenant.id, tenant.name)
console.log('API key (save this!):', api_key)

// 2. Use the key for all subsequent requests
client.setApiKey(api_key)

const me = await client.getMe()
console.log('Authenticated as:', me.email, '| plan:', me.plan)

// 3. Create an additional API key
const extra = await client.createApiKey({ name: 'ci-bot' })
console.log('Extra key created:', extra.key_prefix + '...', '| name:', extra.name)

// 4. List all keys (only prefixes shown)
const keys = await client.listApiKeys()
for (const k of keys.data) {
  console.log(`  [${k.id}] ${k.key_prefix}... — ${k.name} (last used: ${k.last_used_at || 'never'})`)
}

// 5. Revoke the extra key
await client.deleteApiKey(extra.id)
console.log('Revoked key:', extra.id)
