import { describe, expect, it } from 'vitest'
import { signAirixWebhookPayload, verifyAirixWebhook } from '../src/index.js'

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
})
