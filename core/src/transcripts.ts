import { RoomEvent } from 'livekit-client'
import type { Room } from 'livekit-client'

export type AirixTranscriptSegment = {
  id: string
  speaker: { identity: string | null; name: string | null; label: string | null }
  text: string
  startMs: number
  endMs: number
}

/** Live, uncommitted text for one participant. Replaced until their segment arrives. */
export type AirixTranscriptPartial = {
  identity: string
  name: string | null
  text: string
}

export type AirixCallAnalysis = {
  id: string
  transcriptId: string
  status: 'pending' | 'live' | 'completed' | 'failed'
  version: number
  model: string
  result: Record<string, unknown> | null
  error: string | null
  updatedAt: string
}

export type AirixTranscriptEvent =
  | { type: 'segment'; segment: AirixTranscriptSegment }
  | ({ type: 'partial' } & AirixTranscriptPartial)
  | { type: 'analysis'; analysis: AirixCallAnalysis }

export const AIRIX_TRANSCRIPT_TOPIC = 'airix.transcript'
export const AIRIX_ANALYSIS_TOPIC = 'airix.analysis'

const isObject = (value: unknown): value is Record<string, any> =>
  typeof value === 'object' && value !== null
const isString = (value: unknown) => typeof value === 'string'

const parse = (payload: Uint8Array, topic: string): AirixTranscriptEvent | undefined => {
  try {
    const data = JSON.parse(new TextDecoder().decode(payload))
    if (!isObject(data)) return
    if (topic === AIRIX_TRANSCRIPT_TOPIC) {
      if (data.type === 'segment' && isObject(data.segment) && isString(data.segment.id) && isString(data.segment.text)) return data as AirixTranscriptEvent
      if (data.type === 'partial' && isString(data.identity) && isString(data.text)) return data as AirixTranscriptEvent
    } else if (data.type === 'analysis' && isObject(data.analysis) && isString(data.analysis.id)) {
      return data as AirixTranscriptEvent
    }
  } catch {
    // Malformed packet: ignore, never throw into LiveKit's event loop.
  }
}

/**
 * Listens for `airix.transcript` and `airix.analysis` data packets on a LiveKit
 * room. Analysis packets are only delivered to participants whose token role is `host`.
 */
export const subscribeAirixTranscript = (
  room: Pick<Room, 'on' | 'off'>,
  onEvent: (event: AirixTranscriptEvent) => void,
) => {
  const handler = (payload: Uint8Array, _participant?: unknown, _kind?: unknown, topic?: string) => {
    if (topic !== AIRIX_TRANSCRIPT_TOPIC && topic !== AIRIX_ANALYSIS_TOPIC) return
    const event = parse(payload, topic)
    if (!event) return
    try {
      onEvent(event)
    } catch {
      // A throwing listener must not break LiveKit either.
    }
  }
  room.on(RoomEvent.DataReceived, handler)
  return () => { room.off(RoomEvent.DataReceived, handler) }
}
