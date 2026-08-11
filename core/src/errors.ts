import type { AirixApiErrorBody } from './types.js'

export class AirixApiError extends Error {
  readonly code?: string
  readonly requestId?: string
  readonly status: number

  constructor(status: number, body: AirixApiErrorBody = {}) {
    super(body.message ?? `AIRIX API request failed with status ${status}`)
    this.name = 'AirixApiError'
    this.status = status
    this.code = body.code
    this.requestId = body.requestId
  }
}
