# AIRIX Video Core

Recording support: `createToken({ ..., recording: { autoStart: true } })` starts
capture when the first participant joins. A trusted product backend can call
`startRecording(roomId)`, `stopRecording(recordingId)`, and
`getRecording(recordingId)`; a ready recording includes temporary `mp4Url` and
`mp3Url`. See [the integration guide](../../../docs/airix-video/recording.md).

Headless TypeScript SDK for AIRIX realtime video.

This package owns the public developer contract. It intentionally has no React,
React Native, DOM UI, or bundled meeting shell.

```ts
import { AirixVideoClient } from "airix-video-core";

const airix = new AirixVideoClient({
  apiBaseUrl: "https://demo.theairix.com/api",
  livekit: { qualityProfile: "auto" },
  token: async () => getProductUserSessionToken(),
});

const room = await airix.join({
  roomId: "support-call-123",
  displayName: "Manoj",
  mode: "one-to-one",
});
```

Quality profiles keep capture and publishing consistent across web and React
Native:

- `auto` (default): 720p at up to 2.5 Mbps.
- `hd`: 1080p at up to 4 Mbps for strong networks and small rooms.
- `data-saver`: 360p at up to 600 Kbps.

All profiles retain adaptive receiving, simulcast, and dynacast. Advanced apps
can override individual LiveKit room options through `livekit.roomOptions`.

The first implementation focuses on the fast join contract:

1. Your product backend asks AIRIX API for a short-lived LiveKit token using its server-side `ak_live_...` API key.
2. Let app-specific adapters connect directly to the LiveKit SFU.
3. Keep recording, webhooks, analytics, and notifications out of the join path.

Do not put AIRIX product API keys in browser, React Native, iOS, or Android
apps. Client apps should call your own backend, and your backend should call
`POST /api/v1/rooms/:roomId/tokens`.
