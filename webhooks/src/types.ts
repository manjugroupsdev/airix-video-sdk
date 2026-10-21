/** Event names the AIRIX Video API emits. `livekit.<event>` forwards a raw LiveKit webhook event name. */
export type AirixWebhookEventName =
  | 'room.created'
  | 'participant.token_created'
  | 'recording.ready'
  | `livekit.${string}`
  | 'webhook.test'
  | 'transcript.segment'
  | 'transcript.completed'
  | 'transcript.failed'
  | 'analysis.updated'
  | 'analysis.completed'
  | 'analysis.failed'

/** Envelope POSTed to your endpoint (the raw body that is signed). */
export type AirixWebhookEvent<
  Payload = Record<string, unknown>,
  Name extends AirixWebhookEventName = AirixWebhookEventName,
> = {
  apiVersion: '2026-08-12'
  createdAt: string
  data: Payload
  event: Name
  id: string
}

export type AirixWebhookRoom = {
  roomId: string
  joinUrl: string
  mode: 'one-to-one' | 'group-call' | 'webinar' | 'broadcast' | 'audio-only'
  metadata: Record<string, unknown>
  createdAt: string
}

export type AirixRecordingWebhook = {
  id: string
  roomId: string
  status: string
  createdAt: string
  publicUrlExpiresAt: string | null
  mp4Url?: string
  mp3Url?: string
  transcript: { status: string; url: string } | null
  consumerId: string
}

export type AirixTranscriptWebhookSegment = {
  id: string
  speaker: { identity: string | null; name: string | null; label: string | null }
  text: string
  startMs: number
  endMs: number
}

export type AirixTranscriptWebhook = {
  id: string
  roomId: string
  recordingId: string | null
  source: 'realtime' | 'recording'
  status: 'pending' | 'processing' | 'live' | 'completed' | 'failed'
  language: string | null
  createdAt: string
  completedAt: string | null
}

export type AirixAnalysisWebhook = {
  id: string
  transcriptId: string
  status: 'pending' | 'live' | 'completed' | 'failed'
  version: number
  model: string | null
  result: Record<string, unknown> | null
  error: string | null
  updatedAt: string
}

/** Payload (`data`) by event; use as `AirixWebhookEvent<AirixWebhookPayloads['analysis.updated'], 'analysis.updated'>`. */
export type AirixWebhookPayloads = {
  'room.created': { consumerId: string; room: AirixWebhookRoom }
  'participant.token_created': {
    consumerId: string
    participant: { displayName: string; participantId: string; role: 'host' | 'speaker' | 'viewer' }
    room: Pick<AirixWebhookRoom, 'joinUrl' | 'mode' | 'roomId'>
  }
  'recording.ready': { recording: AirixRecordingWebhook }
  [event: `livekit.${string}`]: { livekit: Record<string, unknown> }
  'webhook.test': { projectId: string }
  'transcript.segment': { roomId: string; transcriptId: string; segment: AirixTranscriptWebhookSegment }
  'transcript.completed': { roomId: string; transcript: AirixTranscriptWebhook }
  'transcript.failed': { roomId: string; transcript: AirixTranscriptWebhook; error: string }
  'analysis.updated': { roomId: string; analysis: AirixAnalysisWebhook }
  'analysis.completed': { roomId: string; analysis: AirixAnalysisWebhook }
  'analysis.failed': { roomId: string; analysis: AirixAnalysisWebhook }
}

export type VerifyAirixWebhookInput = {
  payload: string | Buffer
  secret: string
  signature: string | string[] | undefined
  toleranceSeconds?: number
}
