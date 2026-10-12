import { expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({ rejectNext: false, created: [] as { options: unknown; connect: ReturnType<typeof vi.fn>; disconnect: ReturnType<typeof vi.fn>; camera: ReturnType<typeof vi.fn>; microphone: ReturnType<typeof vi.fn> }[] }))
vi.mock('livekit-client', async importOriginal => {
  const original = await importOriginal<typeof import('livekit-client')>()
  return { ...original, Room: class {
    localParticipant
    connect = vi.fn(async () => {})
    disconnect = vi.fn()
    constructor(options: unknown) {
      if (mocks.rejectNext) { this.connect.mockRejectedValueOnce(new Error('Media unavailable')); mocks.rejectNext = false }
      const camera = vi.fn(async () => {}), microphone = vi.fn(async () => {})
      this.localParticipant = { setCameraEnabled: camera, setMicrophoneEnabled: microphone, setScreenShareEnabled: vi.fn() }
      mocks.created.push({ options, connect: this.connect, disconnect: this.disconnect, camera, microphone })
    }
    on() { return this }
  } }
})
import { AirixVideoClient } from '../src/client.js'

it('join inherits the returned project mode and media defaults', async () => {
  const client = new AirixVideoClient({ apiBaseUrl: 'https://api.example', joinTokenProvider: async () => ({ token: 'short-lived', livekitUrl: 'wss://media.example', participantId: 'user', roomId: 'support', expiresAt: '2026-10-11T00:00:00Z', settings: { mode: 'audio-only', qualityProfile: 'data-saver', cameraEnabled: false, microphoneEnabled: true, screenSharing: false } }) })
  const session = await client.join({ roomId: 'support', displayName: 'User' })
  expect(session.mode).toBe('audio-only')
  const room = mocks.created.at(-1)!
  expect(room.options).toMatchObject({ adaptiveStream: true, dynacast: true, videoCaptureDefaults: { resolution: { height: 360 } } })
  expect(room.microphone).toHaveBeenCalledWith(true)
  expect(room.camera).toHaveBeenCalledWith(false)
  session.disconnect()
  expect(room.disconnect).toHaveBeenCalledOnce()
})

it('failed connection disposes the created media room', async () => {
  mocks.rejectNext = true
  const client = new AirixVideoClient({ apiBaseUrl: 'https://api.example', joinTokenProvider: async () => {
    return { token: 'short-lived', livekitUrl: 'wss://media.example', participantId: 'user', roomId: 'support', expiresAt: '2026-10-11T00:00:00Z' }
  } })
  // Reject at the external media boundary, not through SDK internals.
  const provider = client.join({ roomId:'support',displayName:'User' })
  await expect(provider).rejects.toThrow('Media unavailable')
  expect(mocks.created.at(-1)!.disconnect).toHaveBeenCalledOnce()
})

it('a server-issued viewer role does not enable camera or microphone', async () => {
  const client = new AirixVideoClient({ apiBaseUrl: 'https://api.example', joinTokenProvider: async () => ({ token: 'viewer', livekitUrl: 'wss://media.example', participantId: 'user', roomId: 'support', expiresAt: '2026-10-11T00:00:00Z', role: 'viewer', settings: { mode: 'webinar', qualityProfile: 'auto', cameraEnabled: true, microphoneEnabled: true, screenSharing: false } }) })
  const session = await client.join({ roomId: 'support', displayName: 'User' })
  expect(mocks.created.at(-1)!.camera).not.toHaveBeenCalled()
  expect(mocks.created.at(-1)!.microphone).not.toHaveBeenCalled()
  session.disconnect()
})
