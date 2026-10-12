import {
  AirixVideoClient,
  createAirixRoomOptions,
  type AirixJoinRoomInput,
  type AirixJoinToken,
  type AirixVideoClientOptions,
} from 'airix-video-core'
import { LiveKitRoom, VideoConference } from '@livekit/components-react'
import { useEffect, useMemo, useState } from 'react'

export type AirixVideoConferenceProps = AirixVideoClientOptions &
  AirixJoinRoomInput & {
    audio?: boolean
    fallback?: React.ReactNode
    video?: boolean
  }

export const AirixVideoConference = ({
  audio,
  fallback = 'Connecting...',
  video,
  ...options
}: AirixVideoConferenceProps) => {
  const client = useMemo(
    () =>
      new AirixVideoClient({
        apiBaseUrl: options.apiBaseUrl,
        fetch: options.fetch,
        requestTimeoutMs: options.requestTimeoutMs,
        joinTokenProvider: options.joinTokenProvider,
        livekit: options.livekit,
        token: options.token,
      }),
    [
      options.apiBaseUrl,
      options.fetch,
      options.requestTimeoutMs,
      options.joinTokenProvider,
      options.livekit,
      options.token,
    ],
  )
  const [joinToken, setJoinToken] = useState<AirixJoinToken>()
  const [error, setError] = useState<Error>()

  useEffect(() => {
    let isMounted = true
    setJoinToken(undefined)
    setError(undefined)

    client
      .createToken({
        displayName: options.displayName,
        metadata: options.metadata,
        mode: options.mode,
        participantId: options.participantId,
        role: options.role,
        recording: options.recording,
        roomId: options.roomId,
      })
      .then((token) => {
        if (isMounted) {
          setJoinToken(token)
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error(String(err)))
        }
      })

    return () => {
      isMounted = false
    }
  }, [
    client,
    options.displayName,
    options.metadata,
    options.mode,
    options.participantId,
    options.role,
    options.recording,
    options.roomId,
  ])

  if (error) {
    return <div data-airix-error>{error.message}</div>
  }

  if (!joinToken) {
    return <>{fallback}</>
  }

  const canPublish = (joinToken.role ?? options.role) !== 'viewer'
  return (
    <LiveKitRoom
      audio={canPublish && (audio ?? joinToken.settings?.microphoneEnabled ?? true)}
      connect
      options={createAirixRoomOptions(
        options.livekit?.qualityProfile ?? joinToken.settings?.qualityProfile,
        options.livekit?.roomOptions,
      )}
      serverUrl={joinToken.livekitUrl}
      token={joinToken.token}
      video={canPublish && (joinToken.settings?.mode ?? options.mode) !== 'audio-only' && (video ?? joinToken.settings?.cameraEnabled ?? true)}
    >
      <VideoConference />
    </LiveKitRoom>
  )
}
