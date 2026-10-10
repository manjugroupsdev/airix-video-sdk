# AIRIX Video Webhooks

Verify signed AIRIX webhook payloads.

```ts
import { verifyAirixWebhook } from "airix-video-webhooks";

const event = verifyAirixWebhook({
  payload: rawBody,
  secret: process.env.AIRIX_WEBHOOK_SECRET!,
  signature: request.headers["airix-signature"],
});
```

The signature format is:

```http
Airix-Signature: t=1723370000,v1=<hmac-sha256>
```
