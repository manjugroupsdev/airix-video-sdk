# AIRIX Video React Native

React Native hooks for AIRIX realtime video.

Install the native LiveKit package in the host app and initialize it according
to the LiveKit React Native documentation. AIRIX keeps token issuance and room
permissions in the same headless core SDK used by the web package.

```tsx
import { useAirixNativeRoom } from "@airix/video-react-native";

export function CallScreen() {
  const { connect, disconnect, isConnecting, room } = useAirixNativeRoom({
    apiBaseUrl: "https://meet.theairix.com",
    roomId: "support-call-123",
    displayName: "Manoj",
    token: userAccessToken,
  });

  return null;
}
```
