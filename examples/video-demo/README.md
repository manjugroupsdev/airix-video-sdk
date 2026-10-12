# AIRIX SDK Browser Example

This Vite example contains only browser code. The backend was extracted into
`manjugroupsdev/airix-video-api`; there is no API server or credential generator here.

Run `npm ci`, `npm run build`, then `npm run dev`. The local Vite proxy forwards
`/api` to a separately started Video API at `http://localhost:8080`.
Use disposable local test services, not production credentials.

The legacy `/api/token` demo endpoint is for the explicitly enabled demo only.
Production integrations must authenticate users in their own backend and request
short-lived room tokens using server-side API keys. Never add a key to Vite env.

This source was imported from airix-apps commit
`13cc20afa583c8e1979e2416104d2f4ba9ee39bc`. Moving the example does not change the
currently deployed demo hostname or publish SDK packages.
