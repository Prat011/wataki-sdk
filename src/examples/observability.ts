import { WatakiClient } from '../index'

// Get your API key via POST /v1/auth/signup (see auth_example.ts)
const client = new WatakiClient({
  baseUrl: 'https://api.wataki.cloud',
  apiKey: process.env.WATAKI_API_KEY
})

// 1. Overview snapshot (last 24 hours)
const overview = await client.getObservabilityOverview({ since: new Date(Date.now() - 86400000).toISOString() })
console.log('--- Overview ---')
console.log(`Messages: ${overview.messages.total}`)
console.log(`Instances: ${overview.instances.connected}/${overview.instances.total} connected`)
console.log(`Webhook success rate: ${overview.webhooks.success_rate}%`)
console.log(`API requests: ${overview.api.total_requests}`)

// 2. Message stats (last 7 days, daily buckets)
const messages = await client.getMessageStats({
  since: new Date(Date.now() - 7 * 86400000).toISOString(),
  bucket: 'day'
})
console.log('\n--- Message Stats ---')
for (const row of messages.stats) {
  console.log(`  ${row.direction} ${row.type} [${row.status}]: ${row.count}`)
}

// 3. Error summary
const errors = await client.getErrorSummary({ since: new Date(Date.now() - 86400000).toISOString() })
console.log('\n--- Errors (24h) ---')
console.log(`Failed messages: ${errors.failed_messages}`)
console.log(`Failed webhooks: ${errors.failed_webhooks}`)
console.log(`API 5xx: ${errors.api_5xx}`)
console.log(`Errored instances: ${errors.errored_instances}`)

// 4. Dashboard URL
console.log(`\nDashboard: ${client.getDashboardUrl()}`)
