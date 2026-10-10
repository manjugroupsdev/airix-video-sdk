import {
  AirixVideoClient,
  AirixConnectionController,
  type AirixConnectedRoom,
  type AirixJoinRoomInput,
  type AirixVideoClientOptions,
} from 'airix-video-core'
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
  const controller = useMemo(() => new AirixConnectionController(client), [client])
  const mounted = useRef(true)
  const [room, setRoom] = useState<AirixConnectedRoom>()
  const [status, setStatus] = useState<AirixRoomStatus>('idle')
  const [error, setError] = useState<Error>()

  const connect = useCallback(async () => {
    setError(undefined)
    setStatus('connecting')

    try {
      const connectedRoom = await controller.connect({
        displayName: options.displayName,
        metadata: options.metadata,
        mode: options.mode,
        participantId: options.participantId,
        role: options.role,
        recording: options.recording,
        roomId: options.roomId,
      })

      if (mounted.current) { setRoom(connectedRoom); setStatus('connected') }

      return connectedRoom
    } catch (err) {
      const nextError = err instanceof Error ? err : new Error(String(err))
      if (mounted.current) { setError(nextError); setStatus('error') }
      throw nextError
    }
  }, [
    controller,
    options.displayName,
    options.metadata,
    options.mode,
    options.participantId,
    options.role,
    options.recording,
    options.roomId,
  ])

  const disconnect = useCallback(() => {
    controller.disconnect()
    setRoom(undefined)
    setStatus('disconnected')
  }, [controller])

  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false; controller.disconnect() }
  }, [controller])

  return {
    client,
    connect,
    disconnect,
    error,
    room,
    status,
  }
}
