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

export type AirixWebhookEvent<Payload = Record<string, unknown>> = {
  apiVersion: '2026-08-11'
  createdAt: string
  event: AirixWebhookEventName
  id: string
  payload: Payload
}

export type VerifyAirixWebhookInput = {
  payload: string | Buffer
  secret: string
  signature: string | string[] | undefined
  toleranceSeconds?: number
}
