import { AirixApiError } from './errors.js'
import { AirixEventEmitter } from './events.js'
import { createAirixRoomOptions } from './quality.js'
import { ConnectionState, Room, RoomEvent } from 'livekit-client'
import type {
  AirixConnectedRoom,
  AirixApiErrorBody,
  AirixJoinRoomInput,
  AirixJoinToken,
  AirixRecording,
  AirixRoomEventMap,
  AirixRoomMode,
  AirixRoomSession,
  AirixTokenProvider,
  AirixVideoClientOptions,
  AirixVideoQualityProfile,
} from './types.js'

const DEFAULT_ROOM_MODE: AirixRoomMode = 'group-call'

export class AirixVideoClient {
  private readonly apiBaseUrl: string
  private readonly events = new AirixEventEmitter<AirixRoomEventMap>()
  private readonly fetcher: typeof fetch
  private readonly joinTokenProvider?: AirixVideoClientOptions['joinTokenProvider']
  private readonly roomOptions?: ConstructorParameters<typeof Room>[0]
  private readonly qualityProfile?: AirixVideoQualityProfile
  private readonly roomOverrides?: ConstructorParameters<typeof Room>[0]
  private readonly token?: string | AirixTokenProvider
  private readonly requestTimeoutMs: number

  constructor(options: AirixVideoClientOptions) {
    if (!options.apiBaseUrl) {
      throw new Error('apiBaseUrl is required')
    }

    this.apiBaseUrl = options.apiBaseUrl.replace(/\/+$/, '')
    this.fetcher = options.fetch ?? fetch
    this.joinTokenProvider = options.joinTokenProvider
    this.roomOptions = createAirixRoomOptions(
      options.livekit?.qualityProfile,
      options.livekit?.roomOptions,
    )
    this.token = options.token
    this.qualityProfile = options.livekit?.qualityProfile
    this.roomOverrides = options.livekit?.roomOptions
    this.requestTimeoutMs = options.requestTimeoutMs ?? 15000
    if (!Number.isFinite(this.requestTimeoutMs) || this.requestTimeoutMs <= 0) {
      throw new Error('requestTimeoutMs must be a positive finite number')
    }
  }

  on = this.events.on.bind(this.events)
  off = this.events.off.bind(this.events)

  async join(input: AirixJoinRoomInput): Promise<AirixConnectedRoom> {
    const joinToken = await this.createJoinToken(input)
    const mode = joinToken.settings?.mode ?? input.mode ?? DEFAULT_ROOM_MODE
    const livekitRoom = new Room(joinToken.settings ? createAirixRoomOptions(this.qualityProfile ?? joinToken.settings.qualityProfile, this.roomOverrides) : this.roomOptions)

    this.bindRoomEvents(livekitRoom)

    try {
      await livekitRoom.connect(joinToken.livekitUrl, joinToken.token)
      if (joinToken.settings && (joinToken.role ?? input.role) !== 'viewer') {
        await livekitRoom.localParticipant.setMicrophoneEnabled(joinToken.settings.microphoneEnabled)
        await livekitRoom.localParticipant.setCameraEnabled(mode !== 'audio-only' && joinToken.settings.cameraEnabled)
      }
    } catch (error) {
      livekitRoom.disconnect()
      throw error
    }

    const session = createConnectedRoom({
      livekitRoom,
      mode,
      session: joinToken,
      onLeave: () =>
        this.events.emit('room.left', { roomId: joinToken.roomId }),
    })

    this.events.emit('room.joined', session)

    return session
  }

  leave(roomId: string) {
    this.events.emit('room.left', { roomId })
  }

  async createToken(input: AirixJoinRoomInput): Promise<AirixJoinToken> {
    return this.createJoinToken({
      ...input,
    })
  }

  /** Call from a trusted product backend with its AIRIX API key. */
  async startRecording(roomId: string): Promise<AirixRecording> {
    return this.request<AirixRecording>(`/v1/rooms/${encodeURIComponent(roomId)}/recordings`, {
      method: 'POST',
    })
  }

  /** Call from a trusted product backend with its AIRIX API key. */
  async stopRecording(recordingId: string): Promise<AirixRecording> {
    return this.request<AirixRecording>(`/v1/recordings/${encodeURIComponent(recordingId)}/stop`, {
      method: 'POST',
    })
  }

  /** Returns MP4 and MP3 links once both outputs are ready. Links expire after 24 hours. */
  async getRecording(recordingId: string): Promise<AirixRecording> {
    return this.request<AirixRecording>(`/v1/recordings/${encodeURIComponent(recordingId)}`)
  }

  private async createJoinToken(input: AirixJoinRoomInput) {
    if (this.joinTokenProvider) {
      return this.joinTokenProvider(input)
    }

    return this.request<AirixJoinToken>(`/v1/rooms/${encodeURIComponent(input.roomId)}/tokens`, {
      body: JSON.stringify(input),
      method: 'POST',
    })
  }

  private async request<ResponseBody>(
    path: string,
    init: RequestInit = {},
  ): Promise<ResponseBody> {
    const headers = new Headers(init.headers)
    headers.set('accept', 'application/json')
    headers.set('content-type', 'application/json')

    const token = await this.resolveToken()
    if (token) {
      headers.set('authorization', `Bearer ${token}`)
    }

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.requestTimeoutMs)
    try {
      const response = await this.fetcher(`${this.apiBaseUrl}${path}`, {
        ...init,
        headers,
        signal: controller.signal,
      })
      if (!response.ok) {
        throw new AirixApiError(response.status, await readErrorBody(response))
      }
      return await response.json() as ResponseBody
    } catch (error) {
      if (controller.signal.aborted) {
        throw new AirixApiError(0, { code: 'request_timeout', message: 'AIRIX API request timed out' })
      }
      throw error
    } finally {
      clearTimeout(timer)
    }
  }

  private async resolveToken() {
    if (typeof this.token === 'function') {
      return this.token()
    }

    return this.token
  }

  private bindRoomEvents(room: Room) {
    room
      .on(RoomEvent.ConnectionStateChanged, (state: ConnectionState) => {
        this.events.emit('connection.changed', { state })
      })
      .on(RoomEvent.ParticipantConnected, (participant) => {
        this.events.emit('participant.joined', {
          displayName: participant.name,
          participantId: participant.identity,
        })
      })
      .on(RoomEvent.ParticipantDisconnected, (participant) => {
        this.events.emit('participant.left', {
          participantId: participant.identity,
        })
      })
      .on(RoomEvent.Disconnected, () => {
        this.events.emit('connection.changed', { state: 'disconnected' })
      })
  }
}

const readErrorBody = async (
  response: Response,
): Promise<AirixApiErrorBody> => {
  try {
    return (await response.json()) as AirixApiErrorBody
  } catch {
    return {}
  }
}

const createConnectedRoom = ({
  livekitRoom,
  mode,
  onLeave,
  session,
}: {
  livekitRoom: Room
  mode: AirixRoomMode
  onLeave: () => void
  session: AirixJoinToken
}): AirixConnectedRoom => ({
  ...session,
  mode,
  livekitRoom,
  camera: {
    disable: async () => {
      await livekitRoom.localParticipant.setCameraEnabled(false)
    },
    enable: async () => {
      await livekitRoom.localParticipant.setCameraEnabled(true)
    },
  },
  disconnect: () => {
    livekitRoom.disconnect()
    onLeave()
  },
  microphone: {
    enable: async () => {
      await livekitRoom.localParticipant.setMicrophoneEnabled(true)
    },
    mute: async () => {
      await livekitRoom.localParticipant.setMicrophoneEnabled(false)
    },
    unmute: async () => {
      await livekitRoom.localParticipant.setMicrophoneEnabled(true)
    },
  },
  screenShare: {
    start: async () => {
      await livekitRoom.localParticipant.setScreenShareEnabled(true)
    },
    stop: async () => {
      await livekitRoom.localParticipant.setScreenShareEnabled(false)
    },
  },
})
