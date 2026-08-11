import "@livekit/components-styles";
import { AirixVideoConference } from "@airix/video-react";
import { useMemo, useState } from "react";
import "./App.css";

function App() {
  const [apiBaseUrl, setApiBaseUrl] = useState("https://meet.theairix.com");
  const [roomId, setRoomId] = useState("demo-support-room");
  const [displayName, setDisplayName] = useState("AIRIX Developer");
  const [accessToken, setAccessToken] = useState("");
  const [showConference, setShowConference] = useState(false);

  const code = useMemo(
    () => `import { AirixVideoConference } from "@airix/video-react";

export function Call() {
  return (
    <AirixVideoConference
      apiBaseUrl="${apiBaseUrl}"
      roomId="${roomId}"
      displayName="${displayName}"
      token={userAccessToken}
    />
  );
}`,
    [apiBaseUrl, displayName, roomId],
  );

  return (
    <main className="shell">
      <section className="hero">
        <div className="heroCopy">
          <span className="eyebrow">AIRIX Realtime SDK</span>
          <h1>Video calls that feel native to your product.</h1>
          <p>
            Add one-to-one, group, webinar, and broadcast rooms with a tiny
            TypeScript SDK backed by LiveKit and AIRIX token infrastructure.
          </p>
          <div className="metrics">
            <span>&lt;100ms token API target</span>
            <span>Adaptive HD media</span>
            <span>Signed webhooks</span>
          </div>
        </div>
        <pre className="code">{code}</pre>
      </section>

      <section className="panel">
        <div className="form">
          <label>
            API base URL
            <input
              onChange={(event) => setApiBaseUrl(event.target.value)}
              value={apiBaseUrl}
            />
          </label>
          <label>
            Room ID
            <input
              onChange={(event) => setRoomId(event.target.value)}
              value={roomId}
            />
          </label>
          <label>
            Display name
            <input
              onChange={(event) => setDisplayName(event.target.value)}
              value={displayName}
            />
          </label>
          <label>
            User access token
            <input
              onChange={(event) => setAccessToken(event.target.value)}
              placeholder="Paste a user/project token"
              type="password"
              value={accessToken}
            />
          </label>
          <button
            disabled={!accessToken}
            onClick={() => setShowConference(true)}
            type="button"
          >
            Join room
          </button>
        </div>

        <div className="preview">
          {showConference ? (
            <AirixVideoConference
              apiBaseUrl={apiBaseUrl}
              displayName={displayName}
              fallback={<div className="loading">Preparing room...</div>}
              roomId={roomId}
              token={accessToken}
            />
          ) : (
            <div className="emptyState">
              <strong>Ready to connect</strong>
              <span>
                Paste a token from your app backend to start a real AIRIX room.
              </span>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

export default App;
