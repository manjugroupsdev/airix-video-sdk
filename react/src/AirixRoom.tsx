import type { AirixConnectedRoom } from '@airix/video-core'
import { useEffect } from 'react'
import { useAirixRoom, type UseAirixRoomOptions } from './useAirixRoom.js'

export type AirixRoomProps = UseAirixRoomOptions & {
  autoConnect?: boolean
  children?: (state: {
    connect: () => Promise<AirixConnectedRoom>
    disconnect: () => void
    error?: Error
    room?: AirixConnectedRoom
    status: string
  }) => React.ReactNode
}

export const AirixRoom = ({
  autoConnect = true,
  children,
  ...options
}: AirixRoomProps) => {
  const state = useAirixRoom(options)

  useEffect(() => {
    if (!autoConnect || state.status !== 'idle') {
      return
    }

    void state.connect()
  }, [autoConnect, state])

  if (children) {
    return <>{children(state)}</>
  }

  return (
    <div data-airix-room-status={state.status}>
      {state.status === 'connected'
        ? 'Connected'
        : state.error?.message ?? state.status}
    </div>
  )
}
