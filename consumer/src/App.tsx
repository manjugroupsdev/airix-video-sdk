import '@livekit/components-styles';
import { AirixVideoConference } from 'airix-video-react';
import { useCallback, useState } from 'react';
import './App.css';

export default function App() {
  const [roomId, setRoomId] = useState('support-test');
  const [displayName, setDisplayName] = useState('AIRIX Developer');
  const [joined, setJoined] = useState(false);
  const joinTokenProvider = useCallback(async () => {
    const response = await fetch('/video/session', {
      method: 'POST', credentials: 'same-origin',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ roomId, displayName }),
    });
    if (!response.ok) throw new Error('Call access denied');
    return response.json();
  }, [roomId, displayName]);
  return <main className="shell"><h1>AIRIX SDK call test</h1>{joined ? <><button onClick={() => setJoined(false)}>Leave call</button><AirixVideoConference apiBaseUrl="/api" roomId={roomId} displayName={displayName} joinTokenProvider={joinTokenProvider} /></> : <form className="form" onSubmit={event => { event.preventDefault(); setJoined(true); }}><label>Room ID<input required value={roomId} onChange={event => setRoomId(event.target.value)} /></label><label>Display name<input required value={displayName} onChange={event => setDisplayName(event.target.value)} /></label><button>Join call</button></form>}</main>;
}
