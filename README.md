# AIRIX Video SDK

Headless and React SDK packages for AIRIX realtime video.

For current npm package names, installation and controlled automatic publication,
read [SDK Releases](RELEASE.md). The scoped names and GitHub asset examples below
are historical installation instructions.

## Packages

```text
@airix/video-core
@airix/video-react
@airix/video-react-native
@airix/video-webhooks
```

## Install From GitHub Release

Until the npm scope is ready, install from this repo's release assets:

```bash
npm install \
  https://github.com/manjugroupsdev/airix-video-sdk/releases/download/v0.1.1/airix-video-core-0.1.1.tgz \
  https://github.com/manjugroupsdev/airix-video-sdk/releases/download/v0.1.1/airix-video-react-0.1.1.tgz
```

For React Native:

```bash
npm install \
  https://github.com/manjugroupsdev/airix-video-sdk/releases/download/v0.1.1/airix-video-core-0.1.1.tgz \
  https://github.com/manjugroupsdev/airix-video-sdk/releases/download/v0.1.1/airix-video-react-native-0.1.1.tgz
```

For webhook verification:

```bash
npm install https://github.com/manjugroupsdev/airix-video-sdk/releases/download/v0.1.1/airix-video-webhooks-0.1.1.tgz
```

## React Usage

```tsx
import { AirixVideoConference } from "@airix/video-react";

export function Call() {
  return (
    <AirixVideoConference
      apiBaseUrl="https://meet.theairix.com"
      roomId="support-call-123"
      displayName="Manoj"
      token={userAccessToken}
    />
  );
}
```

## Live Transcripts And Call Analysis

Enable `transcription: "realtime"` (and optionally `analysis`) on the project or
per call. `useAirixTranscript(room)` returns `{ segments, partials, analysis }`:
`segments` are committed, ordered and de-duplicated by id; `partials` are the
in-progress text keyed by participant identity and cleared when that
participant's committed segment arrives.

Patient view (live captions):

```tsx
import type { Room } from "livekit-client";
import { useAirixTranscript } from "airix-video-react";

export function Captions({ room }: { room?: Room }) {
  const { segments, partials } = useAirixTranscript(room);
  return (
    <div aria-live="polite">
      {segments.slice(-5).map((s) => (
        <p key={s.id}>{s.speaker.name}: {s.text}</p>
      ))}
      {Object.values(partials).map((p) => (
        <p key={p.identity}><i>{p.name}: {p.text}</i></p>
      ))}
    </div>
  );
}
```

Doctor view (live analysis, shaped by your JSON Schema):

```tsx
export function AnalysisPanel({ room }: { room?: Room }) {
  const { analysis } = useAirixTranscript(room);
  if (!analysis?.result) return <p>Listening...</p>;
  const { summary, diagnosis } = analysis.result as { summary: string; diagnosis: string[] };
  return <section><p>{summary}</p><ul>{diagnosis.map((d) => <li key={d}>{d}</li>)}</ul></section>;
}
```

`room` is `connected.livekitRoom` from `useAirixRoom().room`. Headless clients use
`subscribeAirixTranscript(room, onEvent)` from `airix-video-core`, which returns an
unsubscribe function and ignores malformed packets.

The `airix.analysis` topic is only delivered to participants whose token role is
`host`; `analysis` stays `undefined` for `speaker` and `viewer` tokens. Captions
(`airix.transcript`) go to everyone. Webhooks `transcript.segment`,
`transcript.completed`, `transcript.failed`, `analysis.updated`,
`analysis.completed` and `analysis.failed` are typed in `airix-video-webhooks`
(`AirixWebhookPayloads`).

## Local Development

```bash
npm install
npm run build
npm run pack:release
npm run dev --workspace consumer
```

Release tarballs are generated into `releases/`.
