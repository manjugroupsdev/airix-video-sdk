# AIRIX Video React

React hooks and optional UI for AIRIX realtime video.

```tsx
import { AirixRoom } from "@airix/video-react";

export function Call() {
  return (
    <AirixRoom
      apiBaseUrl="https://meet.theairix.com"
      roomId="support-call-123"
      displayName="Manoj"
      token={userAccessToken}
    >
      {({ connect, disconnect, room, status }) => (
        <main>
          <p>{status}</p>
          <button onClick={() => void connect()}>Join</button>
          <button onClick={disconnect}>Leave</button>
          <button onClick={() => void room?.microphone.mute()}>Mute</button>
        </main>
      )}
    </AirixRoom>
  );
}
```
