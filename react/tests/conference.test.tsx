// @vitest-environment jsdom
import { cleanup, render, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({ createToken: vi.fn(), props: {} as Record<string, unknown> }))
vi.mock('airix-video-core', async importOriginal => ({ ...await importOriginal<typeof import('airix-video-core')>(), AirixVideoClient: class { createToken = mocks.createToken } }))
vi.mock('@livekit/components-react', () => ({ LiveKitRoom: (props: Record<string, unknown>) => { mocks.props = props; return <div>Media connected</div> }, VideoConference: () => null }))
import { AirixVideoConference } from '../src/AirixVideoConference.js'
afterEach(() => { cleanup(); mocks.createToken.mockReset() })
it('respects server media settings and a viewer role in the ready-made React UI', async () => {
  mocks.createToken.mockResolvedValue({ token: 'viewer', livekitUrl: 'wss://media.example', roomId: 'support', participantId: 'staff', role: 'viewer', settings: { mode: 'webinar', qualityProfile: 'data-saver', cameraEnabled: true, microphoneEnabled: true } })
  render(<AirixVideoConference apiBaseUrl="https://api.example" roomId="support" displayName="Staff" />)
  await waitFor(() => expect(mocks.props.token).toBe('viewer'))
  expect(mocks.props.audio).toBe(false)
  expect(mocks.props.video).toBe(false)
  expect(mocks.props.options).toMatchObject({ videoCaptureDefaults: { resolution: { height: 360 } } })
})
