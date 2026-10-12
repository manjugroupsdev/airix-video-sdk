# SDK Releases

Prepared: Core/React 0.1.4 and Webhooks 0.1.2. Prepared does not mean published.
Verify the successful main publish job and npm registry versions before adoption.

Update package versions, lockfile and `release-plan.json` in a reviewed PR.
Owner-authored main pushes changing that plan automatically publish after all
custom-runner tests, builds, artifact checks and security audits pass. Other
pushes do not publish. The publisher downloads the exact CI tarballs, checks
their SHA and SHA-512 integrity, rejects stale main commits and never rebuilds.
Core publishes first. Retries accept existing versions only with identical
registry integrity. A registry-only ESM/CommonJS consumer test follows publication.
Approved publisher fixes also resume the current plan after all checks pass.
An accepted upload is not reported published until public registry integrity
matches; visibility polling is bounded to three minutes per package.

Store the granular publishing credential as GitHub Actions secret `NPM_TOKEN`.
Restrict it to the release packages with a short expiry. It is injected only into
the publish step, not dependency installation or builds. Rotate exposed tokens.
Publication cannot be reversed with Git: fix faulty packages with a new version.

```bash
npm install airix-video-react@0.1.4
# Headless client / trusted backend:
npm install airix-video-core@0.1.4
# Trusted backend webhook verification:
npm install airix-video-webhooks@0.1.2
```

Use imports from `airix-video-core`, `airix-video-react`, or
`airix-video-webhooks`, not the historical `@airix/*` names. LiveKit peer packages
are installed automatically by modern npm; use AIRIX APIs in your application.
React conference styling currently requires `import '@livekit/components-styles'`.

Browser/mobile clients use `joinTokenProvider` to call their own authenticated
backend. That backend validates caller/room permissions and calls
`POST /api/v1/rooms/:roomId/tokens` with a server-only project key. Never place
project keys in browser bundles. Use `https://developer-meet.theairix.com/api`
as the AIRIX API base URL. Recording operations belong on trusted backends;
MP4/MP3 links become available after processing and expire after 24 hours.

Package tests do not prove real media or recording infrastructure. Native-device,
multi-browser media and recording playback checks remain separate acceptance.
