import type { Room, RoomOptions } from 'livekit-client'

export type AirixRoomMode =
  | 'one-to-one'
  | 'group-call'
  | 'webinar'
  | 'broadcast'
  | 'audio-only'

export type AirixParticipantRole = 'host' | 'speaker' | 'viewer'

export type AirixVideoQualityProfile = 'auto' | 'hd' | 'data-saver'

export type AirixTokenProvider = () => string | Promise<string>

export type AirixVideoClientOptions = {
  apiBaseUrl: string
  joinTokenProvider?: (
    input: AirixJoinRoomInput,
  ) => AirixJoinToken | Promise<AirixJoinToken>
  token?: string | AirixTokenProvider
  fetch?: typeof fetch
  requestTimeoutMs?: number
  livekit?: {
    qualityProfile?: AirixVideoQualityProfile
    roomOptions?: RoomOptions
  }
}

export type AirixJoinRoomInput = {
  roomId: string
  displayName: string
  mode?: AirixRoomMode
  participantId?: string
  role?: AirixParticipantRole
  metadata?: Record<string, unknown>
  recording?: { autoStart: true }
}

export type AirixRecording = {
  id: string
  roomId: string
  status: 'pending' | 'starting' | 'recording' | 'stopping' | 'processing' | 'ready' | 'failed'
  createdAt: string
  publicUrlExpiresAt: string | null
  mp4Url?: string
  mp3Url?: string
}

export type AirixJoinToken = {
  role?: AirixParticipantRole
  token: string
  livekitUrl: string
  roomId: string
  participantId: string
  expiresAt: string
  recording?: AirixRecording
  settings?: {
    mode: AirixRoomMode
    qualityProfile: AirixVideoQualityProfile
    cameraEnabled: boolean
    microphoneEnabled: boolean
    screenSharing: boolean
  }
}

export type AirixRoomSession = AirixJoinToken & {
  mode: AirixRoomMode
}

export type AirixConnectedRoom = AirixRoomSession & {
  livekitRoom: Room
  camera: {
    enable: () => Promise<void>
    disable: () => Promise<void>
  }
  microphone: {
    enable: () => Promise<void>
    mute: () => Promise<void>
    unmute: () => Promise<void>
  }
  screenShare: {
    start: () => Promise<void>
    stop: () => Promise<void>
  }
  disconnect: () => void
}

export type AirixApiErrorBody = {
  code?: string
  message?: string
  requestId?: string
}

export type AirixRoomEventMap = {
  'room.joined': AirixConnectedRoom
  'room.left': { roomId: string }
  'participant.joined': { participantId: string; displayName?: string }
  'participant.left': { participantId: string }
  'network.quality.changed': { score: number }
  'connection.changed': { state: string }
  error: { error: Error }
}

export type AirixEventName = keyof AirixRoomEventMap
