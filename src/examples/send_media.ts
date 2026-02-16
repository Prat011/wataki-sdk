import { WatakiClient } from '../index'
import { readFileSync } from 'node:fs'
import path from 'node:path'

// Get your API key via POST /v1/auth/signup (see auth_example.ts)
// Tip: Visit /dashboard in your browser for visual monitoring (see observability.ts)
const client = new WatakiClient({
  baseUrl: 'https://api.wataki.cloud',
  apiKey: process.env.WATAKI_API_KEY
})

const instanceId = process.env.WATAKI_INSTANCE_ID!
const phoneNumber = process.argv[2]
const filePath = process.argv[3]

if (!phoneNumber || !filePath) {
  console.error('Usage: npx tsx send_media.ts <phone_number> <file_path> [caption]')
  console.error('Example: npx tsx send_media.ts 5511999999999 ./photo.jpg "Check this out"')
  process.exit(1)
}

const chatId = phoneNumber.includes('@') ? phoneNumber : `${phoneNumber}@s.whatsapp.net`
const caption = process.argv[4] || undefined

// 1. Upload the file
const buffer = readFileSync(filePath)
const filename = path.basename(filePath)
const blob = new Blob([buffer])
const media = await client.uploadMedia(instanceId, blob, filename)
console.log('Uploaded media:', media.id)

// 2. Determine message type from MIME
let type = 'document'
if (media.mime_type.startsWith('image/')) type = 'image'
else if (media.mime_type.startsWith('video/')) type = 'video'
else if (media.mime_type.startsWith('audio/')) type = 'audio'

// 3. Send the message
const message = await client.sendMessage(instanceId, {
  chat_id: chatId,
  type,
  content: { media: { media_id: media.id }, caption, filename }
})

console.log('Message sent:', message.id)
