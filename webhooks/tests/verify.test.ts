import { describe, expect, it } from 'vitest'
import { signAirixWebhookPayload, verifyAirixWebhook } from '../src/index.js'
import type { AirixWebhookPayloads } from '../src/index.js'

describe('webhook authentication', () => {
  const secret = 'test-only-signing-secret'
  const payload = JSON.stringify({ id: 'evt_test', event: 'recording.ready', data: {} })
  it('accepts a current signature over the exact raw body', () => {
    expect(verifyAirixWebhook({ payload, secret, signature: signAirixWebhookPayload({ payload, secret }) }).id).toBe('evt_test')
  })
  it('rejects modified bodies, wrong secrets, expired signatures, and missing signatures', () => {
    const signature = signAirixWebhookPayload({ payload, secret })
    for (const input of [
      { payload: `${payload} `, secret, signature },
      { payload, secret: 'wrong', signature },
      { payload, secret, signature: signAirixWebhookPayload({ payload, secret, timestamp: 1 }) },
      { payload, secret, signature: undefined },
    ]) expect(() => verifyAirixWebhook(input)).toThrow()
  })
  it('parses a server-shaped envelope (airix-video-api server/webhooks.js enqueue)', () => {
    const body = JSON.stringify({
      apiVersion: '2026-08-12', id: 'evt_0b1c', event: 'recording.ready', createdAt: '2026-10-21T10:00:00.000Z',
      data: { recording: { id: 'r1', roomId: 'room', status: 'ready', createdAt: '2026-10-21T09:00:00.000Z', publicUrlExpiresAt: '2026-10-22T10:00:00.000Z', mp4Url: 'https://x/mp4', transcript: null, consumerId: 'prj_1' } },
    })
    const event = verifyAirixWebhook<AirixWebhookPayloads['recording.ready']>({ payload: body, secret, signature: signAirixWebhookPayload({ payload: body, secret }) })
    expect(event.apiVersion).toBe('2026-08-12')
    expect(event.event).toBe('recording.ready')
    expect(event.data.recording.roomId).toBe('room')
  })
  it('accepts the t=,v1= header the server sends in x-airix-signature', () => {
    const header = signAirixWebhookPayload({ payload, secret, timestamp: Math.floor(Date.now() / 1000) })
    expect(header).toMatch(/^t=\d+,v1=[0-9a-f]{64}$/)
    expect(verifyAirixWebhook({ payload, secret, signature: [header] }).id).toBe('evt_test')
  })
})
