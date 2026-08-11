# AIRIX Video SDK

Headless and React SDK packages for AIRIX realtime video.

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

## Local Development

```bash
npm install
npm run build
npm run pack:release
npm run dev --workspace consumer
```

Release tarballs are generated into `releases/`.
