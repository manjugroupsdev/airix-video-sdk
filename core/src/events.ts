export type AirixEventHandler<Payload> = (payload: Payload) => void

export class AirixEventEmitter<EventMap extends Record<string, unknown>> {
  private readonly handlers = new Map<keyof EventMap, Set<AirixEventHandler<any>>>()

  on<EventName extends keyof EventMap>(
    eventName: EventName,
    handler: AirixEventHandler<EventMap[EventName]>,
  ) {
    const handlers = this.handlers.get(eventName) ?? new Set()
    handlers.add(handler)
    this.handlers.set(eventName, handlers)

    return () => this.off(eventName, handler)
  }

  off<EventName extends keyof EventMap>(
    eventName: EventName,
    handler: AirixEventHandler<EventMap[EventName]>,
  ) {
    this.handlers.get(eventName)?.delete(handler)
  }

  emit<EventName extends keyof EventMap>(
    eventName: EventName,
    payload: EventMap[EventName],
  ) {
    this.handlers.get(eventName)?.forEach((handler) => handler(payload))
  }

  clear() {
    this.handlers.clear()
  }
}
