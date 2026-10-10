# Platform repositories

This repository owns Web/React and the Node webhook helper. React Native is moving
to `manjugroupsdev/airix-video-react-native-sdk`; Android and iOS have their own
repositories. The historical `react-native/` directory is retained temporarily,
but is no longer a workspace or a release target here.

The server remains in `manjugroupsdev/airix-apps`. Tokens, authorization, project
configuration, recording orchestration, and webhook delivery belong to that
server, not to four copied client implementations.

## Development

Use Node 22. Run `npm ci`, `npm run build`, `npm run check`, `npm test`, and
`npm run test:artifacts`. Vite builds ESM/CJS; TypeScript emits declarations;
Vitest tests the public interfaces and external media failures.

The consumer example expects your authenticated `POST /video/session` backend.
Never paste an AIRIX project/server key into the browser. Use `joinTokenProvider`.
The planned SDK endpoint is `https://developer-meet.theairix.com/api`; it is not
available merely because this branch exists.

## Release gate

These changes are unreleased. Package publication is a separate approved action.
React Native depends on the new core connection controller and must not be
published against the old registry core. Prepare coordinated versions, test the
packed packages together, publish core first, then its adapters. Do not overwrite
an existing version.

CI uses the isolated server runner labelled `airix-sdk-ci`. The runner accepts
only owner-authored pushes to `main` or `codex/*`, never fork pull requests.
Queued checks do not mean a runner is online. Native device calls, real media
reconnection, recording delivery, and browser compatibility remain release gates.
