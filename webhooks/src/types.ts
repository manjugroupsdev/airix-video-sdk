export type AirixWebhookEventName =
  | 'call.started'
  | 'call.ended'
  | 'participant.joined'
  | 'participant.left'
  | 'participant.muted'
  | 'participant.unmuted'
  | 'recording.started'
  | 'recording.completed'
  | 'recording.failed'
  | 'transcription.completed'
  | 'summary.completed'
  | 'transcript.segment'
  | 'transcript.completed'
  | 'transcript.failed'
  | 'analysis.updated'
  | 'analysis.completed'
  | 'analysis.failed'

export type AirixWebhookEvent<Payload = Record<string, unknown>> = {
  apiVersion: '2026-08-11'
  createdAt: string
  event: AirixWebhookEventName
  id: string
  payload: Payload
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
  model: string
  result: Record<string, unknown> | null
  error: string | null
  updatedAt: string
}

/** Payloads by event; use as `AirixWebhookEvent<AirixWebhookPayloads['analysis.updated']>`. */
export type AirixWebhookPayloads = {
  'transcript.segment': { roomId: string; transcriptId: string; segment: AirixTranscriptWebhookSegment }
  'transcript.completed': { roomId: string; transcript: AirixTranscriptWebhook }
  'transcript.failed': { roomId: string; transcript: AirixTranscriptWebhook }
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
