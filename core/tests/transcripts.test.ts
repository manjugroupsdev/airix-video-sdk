import { EventEmitter } from 'node:events'
import { expect, it, vi } from 'vitest'
import { subscribeAirixTranscript } from '../src/transcripts.js'

const send = (room: EventEmitter, topic: string | undefined, data: unknown) =>
  room.emit('dataReceived', new TextEncoder().encode(typeof data === 'string' ? data : JSON.stringify(data)), undefined, undefined, topic)
const segment = { id: 's1', speaker: { identity: 'dr', name: 'Dr', label: null }, text: 'hello', startMs: 0, endMs: 900 }

it('delivers valid transcript and analysis packets, ignores malformed and other-topic ones, and unsubscribes', () => {
  const room = new EventEmitter()
  const onEvent = vi.fn()
  const off = subscribeAirixTranscript(room as never, onEvent)
  send(room, 'airix.transcript', { type: 'segment', segment })
  send(room, 'airix.transcript', { type: 'partial', identity: 'dr', name: 'Dr', text: 'hel' })
  send(room, 'airix.analysis', { type: 'analysis', analysis: { id: 'a1' } })
  expect(onEvent).toHaveBeenCalledTimes(3)
  onEvent.mockClear()
  send(room, 'airix.transcript', '{not json')
  send(room, 'airix.transcript', 'null')
  send(room, 'airix.transcript', { type: 'segment', segment: { text: 'no id' } })
  send(room, 'airix.transcript', { type: 'analysis', analysis: { id: 'a1' } })
  send(room, 'airix.analysis', { type: 'segment', segment })
  send(room, 'other.topic', { type: 'segment', segment })
  send(room, undefined, { type: 'segment', segment })
  expect(onEvent).not.toHaveBeenCalled()
  off()
  send(room, 'airix.transcript', { type: 'segment', segment })
  expect(onEvent).not.toHaveBeenCalled()
})

it('a throwing listener does not throw into the room', () => {
  const room = new EventEmitter()
  subscribeAirixTranscript(room as never, () => { throw new Error('boom') })
  expect(() => send(room, 'airix.transcript', { type: 'segment', segment })).not.toThrow()
})
