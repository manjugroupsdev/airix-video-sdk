import type { AirixVideoClient } from './client.js'
import type { AirixConnectedRoom, AirixJoinRoomInput } from './types.js'

/** Owns one connection, including joins which finish after disconnect. */
export class AirixConnectionController {
  private pending?: Promise<AirixConnectedRoom>
  private connected?: AirixConnectedRoom
  private generation = 0

  constructor(private readonly client: Pick<AirixVideoClient, 'join'>) {}

  connect(input: AirixJoinRoomInput): Promise<AirixConnectedRoom> {
    if (this.connected) return Promise.resolve(this.connected)
    if (this.pending) return this.pending
    const generation = this.generation
    const pending = this.client.join(input).then(room => {
      if (generation !== this.generation) {
        room.disconnect()
        throw new Error('Connection cancelled')
      }
      this.connected = room
      return room
    }).finally(() => { if (this.pending === pending) this.pending = undefined })
    this.pending = pending
    return pending
  }

  disconnect(): void {
    this.generation++
    this.connected?.disconnect()
    this.connected = undefined
    this.pending = undefined
  }
}
