import {
  subscribeAirixTranscript,
  type AirixCallAnalysis,
  type AirixTranscriptPartial,
  type AirixTranscriptSegment,
} from 'airix-video-core'
import type { Room } from 'livekit-client'
import { useEffect, useState } from 'react'

type State = {
  segments: AirixTranscriptSegment[]
  partials: Record<string, AirixTranscriptPartial>
  analysis: AirixCallAnalysis | undefined
}

const empty: State = { segments: [], partials: {}, analysis: undefined }

/** Live captions (`segments`, `partials`) and, for host tokens only, `analysis`. */
export const useAirixTranscript = (room: Pick<Room, 'on' | 'off'> | undefined): State => {
  const [state, setState] = useState<State>(empty)

  useEffect(() => {
    setState(empty)
    if (!room) return
    return subscribeAirixTranscript(room, (event) => {
      setState((prev) => {
        if (event.type === 'analysis') return { ...prev, analysis: event.analysis }
        if (event.type === 'partial') {
          const { type: _type, ...partial } = event
          return { ...prev, partials: { ...prev.partials, [event.identity]: partial } }
        }
        const { segment } = event
        const segments = [...prev.segments.filter((s) => s.id !== segment.id), segment]
          .sort((a, b) => a.startMs - b.startMs || a.endMs - b.endMs)
        const identity = segment.speaker.identity
        const { [identity ?? '']: _done, ...partials } = prev.partials
        return { ...prev, segments, partials }
      })
    })
  }, [room])

  return state
}
