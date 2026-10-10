import { describe, expect, it, vi } from 'vitest'
import { AirixVideoClient } from '../src/client.js'
import { AirixApiError } from '../src/errors.js'

describe('AIRIX API contract', () => {
  it('encodes room IDs and leaves omitted mode for the project to decide', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ token: 'participant-token', roomId: 'support', livekitUrl: 'wss://media.example', participantId: 'u1', expiresAt: '2026-10-11T00:00:00Z' })))
    const client = new AirixVideoClient({ apiBaseUrl: 'https://developer-meet.theairix.com/api/', token: async () => 'server-key', fetch: fetcher })
    await client.createToken({ roomId: 'support/a?b', displayName: 'User' })
    expect(fetcher.mock.calls[0][0]).toBe('https://developer-meet.theairix.com/api/v1/rooms/support%2Fa%3Fb/tokens')
    const init = fetcher.mock.calls[0][1]!
    expect(new Headers(init.headers).get('authorization')).toBe('Bearer server-key')
    expect(JSON.parse(String(init.body))).not.toHaveProperty('mode')
  })
  it('reports HTTP permission failures as typed errors', async () => {
    const client = new AirixVideoClient({ apiBaseUrl: 'https://api.example', fetch: async () => new Response(JSON.stringify({ code: 'insufficient_scope' }), { status: 403 }) })
    await expect(client.startRecording('support')).rejects.toBeInstanceOf(AirixApiError)
    await expect(client.startRecording('support')).rejects.toMatchObject({ status: 403 })
  })
  it('aborts a stalled API request instead of leaving a join pending forever', async () => {
    const client = new AirixVideoClient({ apiBaseUrl:'https://api.example',requestTimeoutMs:20,fetch: (_url, init) => new Promise((_resolve,reject) => init?.signal?.addEventListener('abort',() => reject(new DOMException('Timed out','AbortError')))) })
    await expect(client.createToken({ roomId:'support',displayName:'User' })).rejects.toThrow('timed out')
  })
})
