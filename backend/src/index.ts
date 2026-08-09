import { Elysia } from 'elysia'
import { CloudflareAdapter } from 'elysia/adapter/cloudflare-worker'

export default new Elysia({ adapter: CloudflareAdapter })
  .get('/api/health', () => ({
    status: 'ok',
    runtime: 'cloudflare-worker'
  }))
  .compile()
