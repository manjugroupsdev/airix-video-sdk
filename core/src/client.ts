import { AirixApiError } from './errors.js'
import { AirixEventEmitter } from './events.js'
import { ConnectionState, Room, RoomEvent } from 'livekit-client'
import type {
  AirixConnectedRoom,
  AirixApiErrorBody,
  AirixJoinRoomInput,
  AirixJoinToken,
  AirixRoomEventMap,
  AirixRoomMode,
  AirixRoomSession,
  AirixTokenProvider,
  AirixVideoClientOptions,
} from './types.js'

const DEFAULT_ROOM_MODE: AirixRoomMode = 'group-call'

export class AirixVideoClient {
  private readonly apiBaseUrl: string
  private readonly events = new AirixEventEmitter<AirixRoomEventMap>()
  private readonly fetcher: typeof fetch
  private readonly joinTokenProvider?: AirixVideoClientOptions['joinTokenProvider']
  private readonly roomOptions?: ConstructorParameters<typeof Room>[0]
  private readonly token?: string | AirixTokenProvider

  constructor(options: AirixVideoClientOptions) {
    if (!options.apiBaseUrl) {
      throw new Error('apiBaseUrl is required')
    }

    this.apiBaseUrl = options.apiBaseUrl.replace(/\/+$/, '')
    this.fetcher = options.fetch ?? fetch
    this.joinTokenProvider = options.joinTokenProvider
    this.roomOptions = options.livekit?.roomOptions
    this.token = options.token
  }

  on = this.events.on.bind(this.events)
  off = this.events.off.bind(this.events)

  async join(input: AirixJoinRoomInput): Promise<AirixConnectedRoom> {
    const mode = input.mode ?? DEFAULT_ROOM_MODE
    const joinToken = await this.createJoinToken({ ...input, mode })
    const livekitRoom = new Room({
      adaptiveStream: true,
      dynacast: true,
      ...this.roomOptions,
    })

    this.bindRoomEvents(livekitRoom)

    await livekitRoom.connect(joinToken.livekitUrl, joinToken.token)

    const session = createConnectedRoom({
      livekitRoom,
      mode,
      session: joinToken,
      onLeave: () => this.events.emit('room.left', { roomId: joinToken.roomId }),
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
      mode: input.mode ?? DEFAULT_ROOM_MODE,
    })
  }

  private async createJoinToken(input: RequiredRoomMode<AirixJoinRoomInput>) {
    if (this.joinTokenProvider) {
      return this.joinTokenProvider(input)
    }

    return this.request<AirixJoinToken>(`/v1/rooms/${input.roomId}/tokens`, {
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

    const response = await this.fetcher(`${this.apiBaseUrl}${path}`, {
      ...init,
      headers,
    })

    if (!response.ok) {
      throw new AirixApiError(response.status, await readErrorBody(response))
    }

    return response.json() as Promise<ResponseBody>
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

type RequiredRoomMode<Input extends AirixJoinRoomInput> = Input & {
  mode: AirixRoomMode
}

const readErrorBody = async (response: Response): Promise<AirixApiErrorBody> => {
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
