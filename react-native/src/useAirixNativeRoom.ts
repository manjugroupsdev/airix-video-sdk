import {
  AirixVideoClient,
  type AirixConnectedRoom,
  type AirixJoinRoomInput,
  type AirixVideoClientOptions,
} from '@airix/video-core'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

export type UseAirixNativeRoomOptions = AirixVideoClientOptions & AirixJoinRoomInput

export const useAirixNativeRoom = (options: UseAirixNativeRoomOptions) => {
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
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<Error>()

  const connect = useCallback(async () => {
    setIsConnecting(true)
    setError(undefined)

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

      return connectedRoom
    } catch (err) {
      const nextError = err instanceof Error ? err : new Error(String(err))
      setError(nextError)
      throw nextError
    } finally {
      setIsConnecting(false)
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
  }, [])

  useEffect(() => disconnect, [disconnect])

  return {
    client,
    connect,
    disconnect,
    error,
    isConnecting,
    room,
  }
}
