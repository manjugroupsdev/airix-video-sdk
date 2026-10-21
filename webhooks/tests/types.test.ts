import { expectTypeOf, it } from 'vitest'
import type { AirixWebhookEvent, AirixWebhookEventName, AirixWebhookPayloads } from '../src/index.js'

it('exposes transcript and analysis events with typed payloads', () => {
  expectTypeOf<keyof AirixWebhookPayloads>().toEqualTypeOf<
    'transcript.segment' | 'transcript.completed' | 'transcript.failed' | 'analysis.updated' | 'analysis.completed' | 'analysis.failed'
  >()
  expectTypeOf<keyof AirixWebhookPayloads>().toExtend<AirixWebhookEventName>()
  const event: AirixWebhookEvent<AirixWebhookPayloads['analysis.updated']> = {
    apiVersion: '2026-08-11', createdAt: '2026-10-21T00:00:00Z', event: 'analysis.updated', id: 'evt_1',
    payload: { roomId: 'r', analysis: { id: 'a', transcriptId: 't', status: 'live', version: 1, model: 'm', result: null, error: null, updatedAt: '2026-10-21T00:00:00Z' } },
  }
  expectTypeOf(event.payload.analysis.status).toEqualTypeOf<'pending' | 'live' | 'completed' | 'failed'>()
})
