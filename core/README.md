# AIRIX Video Core

Headless TypeScript SDK for AIRIX realtime video.

This package owns the public developer contract. It intentionally has no React,
React Native, DOM UI, or bundled meeting shell.

```ts
import { AirixVideoClient } from "@airix/video-core";

const airix = new AirixVideoClient({
  apiBaseUrl: "https://meet.theairix.com",
  token: async () => getUserAccessToken(),
});

const room = await airix.join({
  roomId: "support-call-123",
  displayName: "Manoj",
  mode: "one-to-one",
});
```

The first implementation focuses on the fast join contract:

1. Ask AIRIX API for a short-lived LiveKit token.
2. Let app-specific adapters connect directly to the LiveKit SFU.
3. Keep recording, webhooks, analytics, and notifications out of the join path.
