# AIRIX Video Webhooks

Verify signed AIRIX webhook payloads. Pass the exact raw request body.

```ts
import { verifyAirixWebhook, type AirixWebhookPayloads } from "airix-video-webhooks";

const event = verifyAirixWebhook<AirixWebhookPayloads["recording.ready"]>({
  payload: rawBody,
  secret: process.env.AIRIX_WEBHOOK_SECRET!,
  signature: request.headers["x-airix-signature"],
});
event.data.recording.id;
```

## Request

Each delivery is a `POST` with these headers:

```http
content-type: application/json
idempotency-key: evt_<uuid>
x-airix-event: recording.ready
x-airix-signature: t=1723370000,v1=<hmac-sha256-hex>
```

`v1` is the hex HMAC-SHA256, keyed with your endpoint secret, of `` `${t}.${rawBody}` ``.
`verifyAirixWebhook` rejects signatures older than 300 seconds by default.

## Envelope

```json
{
  "apiVersion": "2026-08-12",
  "id": "evt_<uuid>",
  "event": "recording.ready",
  "createdAt": "2026-10-21T10:00:00.000Z",
  "data": {}
}
```

The event body is in `data` (not `payload`). Retries reuse the same `id`.

## Events

Types for `data` are in `AirixWebhookPayloads`, keyed by event name.

| Event | `data` |
| --- | --- |
| `room.created` | `{ consumerId, room }` |
| `participant.token_created` | `{ consumerId, participant, room }` |
| `recording.ready` | `{ recording }` |
| `livekit.<event>` (e.g. `livekit.room_finished`, `livekit.egress_ended`) | `{ livekit }` raw LiveKit webhook event |
| `webhook.test` | `{ projectId }` (console "send test") |
| `transcript.segment` | `{ roomId, transcriptId, segment }` |
| `transcript.completed` | `{ roomId, transcript }` |
| `transcript.failed` | `{ roomId, transcript, error }` |
| `analysis.updated` / `analysis.completed` / `analysis.failed` | `{ roomId, analysis }` (`analysis.model` may be `null`) |

`room.created`, `participant.token_created`, `recording.ready` and `livekit.*` are also sent to
legacy (non-project) consumers; the rest go to project endpoints only.
