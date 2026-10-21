import { expectTypeOf, it } from 'vitest'
import type { AirixWebhookEvent, AirixWebhookEventName, AirixWebhookPayloads } from '../src/index.js'

it('covers every event the API emits, including livekit.<event>', () => {
  expectTypeOf<'room.created'>().toExtend<AirixWebhookEventName>()
  expectTypeOf<'participant.token_created'>().toExtend<AirixWebhookEventName>()
  expectTypeOf<'recording.ready'>().toExtend<AirixWebhookEventName>()
  expectTypeOf<'webhook.test'>().toExtend<AirixWebhookEventName>()
  expectTypeOf<'livekit.egress_ended'>().toExtend<AirixWebhookEventName>()
  expectTypeOf<'transcript.segment' | 'analysis.failed'>().toExtend<AirixWebhookEventName>()
  expectTypeOf<'call.started'>().not.toExtend<AirixWebhookEventName>()
  expectTypeOf<AirixWebhookPayloads['livekit.room_finished']>().toEqualTypeOf<{ livekit: Record<string, unknown> }>()
})

it('uses the server envelope: data (not payload), apiVersion 2026-08-12', () => {
  const event: AirixWebhookEvent<AirixWebhookPayloads['analysis.updated'], 'analysis.updated'> = {
    apiVersion: '2026-08-12', createdAt: '2026-10-21T00:00:00.000Z', event: 'analysis.updated', id: 'evt_1',
    data: { roomId: 'r', analysis: { id: 'a', transcriptId: 't', status: 'live', version: 1, model: null, result: null, error: null, updatedAt: '2026-10-21T00:00:00.000Z' } },
  }
  expectTypeOf(event.data.analysis.status).toEqualTypeOf<'pending' | 'live' | 'completed' | 'failed'>()
  expectTypeOf(event.data.analysis.model).toEqualTypeOf<string | null>()
  expectTypeOf(event.apiVersion).toEqualTypeOf<'2026-08-12'>()
  // @ts-expect-error the envelope has no `payload` field
  event.payload
})

it('carries the transcript.failed error code', () => {
  expectTypeOf<AirixWebhookPayloads['transcript.failed']['error']>().toEqualTypeOf<string>()
  expectTypeOf<AirixWebhookPayloads['transcript.completed']>().not.toHaveProperty('error')
})
