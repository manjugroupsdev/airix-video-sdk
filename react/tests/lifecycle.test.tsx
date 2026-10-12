// @vitest-environment jsdom
import { act, renderHook, cleanup } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({ join: vi.fn() }))
vi.mock('airix-video-core', async importOriginal => ({ ...await importOriginal<typeof import('airix-video-core')>(), AirixVideoClient: class { join = mocks.join } }))
import { useAirixRoom } from '../src/useAirixRoom.js'
afterEach(() => { cleanup(); mocks.join.mockReset() })

it('concurrent connect clicks share one pending join and unmount cleans a late connection', async () => {
  let resolve!: (value: { disconnect: ReturnType<typeof vi.fn> }) => void
  const pending = new Promise(value => { resolve = value })
  mocks.join.mockReturnValue(pending)
  const { result, unmount } = renderHook(() => useAirixRoom({ apiBaseUrl:'https://api.example',roomId:'support',displayName:'User' }))
  let first!: Promise<unknown>, second!: Promise<unknown>
  act(() => { first = result.current.connect(); second = result.current.connect() })
  expect(mocks.join).toHaveBeenCalledOnce()
  unmount()
  const session = { disconnect:vi.fn() }
  await act(async () => { resolve(session); const results = await Promise.allSettled([first,second]); expect(results.every(result => result.status === 'rejected')).toBe(true) })
  expect(session.disconnect).toHaveBeenCalledOnce()
})
