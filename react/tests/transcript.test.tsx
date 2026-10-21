// @vitest-environment jsdom
import { EventEmitter } from 'node:events'
import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import { useAirixTranscript } from '../src/useAirixTranscript.js'
afterEach(cleanup)

const send = (room: EventEmitter, topic: string, data: unknown) =>
  act(() => { room.emit('dataReceived', new TextEncoder().encode(JSON.stringify(data)), undefined, undefined, topic) })
const seg = (id: string, identity: string, startMs: number, text = id) =>
  ({ type: 'segment', segment: { id, speaker: { identity, name: identity, label: null }, text, startMs, endMs: startMs + 500 } })

it('merges partial into committed segment, orders and de-duplicates by id', () => {
  const room = new EventEmitter()
  const { result } = renderHook(() => useAirixTranscript(room as never))
  send(room, 'airix.transcript', { type: 'partial', identity: 'dr', name: 'Dr', text: 'hel' })
  send(room, 'airix.transcript', { type: 'partial', identity: 'pt', name: 'Pt', text: 'hi' })
  expect(result.current.partials).toEqual({ dr: { identity: 'dr', name: 'Dr', text: 'hel' }, pt: { identity: 'pt', name: 'Pt', text: 'hi' } })
  send(room, 'airix.transcript', seg('b', 'dr', 2000))
  expect(Object.keys(result.current.partials)).toEqual(['pt'])
  send(room, 'airix.transcript', seg('a', 'pt', 1000))
  send(room, 'airix.transcript', seg('b', 'dr', 2000, 'edited'))
  expect(result.current.segments.map((s) => [s.id, s.text])).toEqual([['a', 'a'], ['b', 'edited']])
  expect(result.current.partials).toEqual({})
  expect(result.current.analysis).toBeUndefined()
  send(room, 'airix.analysis', { type: 'analysis', analysis: { id: 'x', status: 'live' } })
  expect(result.current.analysis?.id).toBe('x')
})
