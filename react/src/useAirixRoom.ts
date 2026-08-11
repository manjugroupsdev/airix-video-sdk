import {
  AirixVideoClient,
  type AirixConnectedRoom,
  type AirixJoinRoomInput,
  type AirixVideoClientOptions,
} from '@airix/video-core'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

export type UseAirixRoomOptions = AirixVideoClientOptions & AirixJoinRoomInput

export type AirixRoomStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'error'

export const useAirixRoom = (options: UseAirixRoomOptions) => {
  const client = useMemo(
    () =>
      new AirixVideoClient({
        apiBaseUrl: options.apiBaseUrl,
        fetch: options.fetch,
        joinTokenProvider: options.joinTokenProvider,
        livekit: options.livekit,
        token: options.token,
      }),
    [
      options.apiBaseUrl,
      options.fetch,
      options.joinTokenProvider,
      options.livekit,
      options.token,
    ],
  )
  const roomRef = useRef<AirixConnectedRoom>()
  const [room, setRoom] = useState<AirixConnectedRoom>()
  const [status, setStatus] = useState<AirixRoomStatus>('idle')
  const [error, setError] = useState<Error>()

  const connect = useCallback(async () => {
    setError(undefined)
    setStatus('connecting')

    try {
      const connectedRoom = await client.join({
        displayName: options.displayName,
        metadata: options.metadata,
        mode: options.mode,
        participantId: options.participantId,
        role: options.role,
        roomId: options.roomId,
      })

      roomRef.current = connectedRoom
      setRoom(connectedRoom)
      setStatus('connected')

      return connectedRoom
    } catch (err) {
      const nextError = err instanceof Error ? err : new Error(String(err))
      setError(nextError)
      setStatus('error')
      throw nextError
    }
  }, [
    client,
    options.displayName,
    options.metadata,
    options.mode,
    options.participantId,
    options.role,
    options.roomId,
  ])

  const disconnect = useCallback(() => {
    roomRef.current?.disconnect()
    roomRef.current = undefined
    setRoom(undefined)
    setStatus('disconnected')
  }, [])

  useEffect(() => disconnect, [disconnect])

  return {
    client,
    connect,
    disconnect,
    error,
    room,
    status,
  }
}
