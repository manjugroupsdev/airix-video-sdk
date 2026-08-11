import { createHmac, timingSafeEqual } from 'node:crypto'
import type { AirixWebhookEvent, VerifyAirixWebhookInput } from './types.js'

const DEFAULT_TOLERANCE_SECONDS = 300

export class AirixWebhookSignatureError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AirixWebhookSignatureError'
  }
}

export const verifyAirixWebhook = <Payload = Record<string, unknown>>({
  payload,
  secret,
  signature,
  toleranceSeconds = DEFAULT_TOLERANCE_SECONDS,
}: VerifyAirixWebhookInput): AirixWebhookEvent<Payload> => {
  const header = Array.isArray(signature) ? signature[0] : signature

  if (!header) {
    throw new AirixWebhookSignatureError('Missing AIRIX webhook signature.')
  }

  const values = parseSignatureHeader(header)
  const timestamp = Number(values.t)
  const expected = values.v1

  if (!timestamp || !expected) {
    throw new AirixWebhookSignatureError('Invalid AIRIX webhook signature.')
  }

  const ageSeconds = Math.abs(Date.now() / 1000 - timestamp)
  if (ageSeconds > toleranceSeconds) {
    throw new AirixWebhookSignatureError('AIRIX webhook signature expired.')
  }

  const rawPayload = Buffer.isBuffer(payload) ? payload : Buffer.from(payload)
  const signedPayload = `${timestamp}.${rawPayload.toString('utf8')}`
  const actual = createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex')

  if (!safeEqual(actual, expected)) {
    throw new AirixWebhookSignatureError('Invalid AIRIX webhook signature.')
  }

  return JSON.parse(rawPayload.toString('utf8')) as AirixWebhookEvent<Payload>
}

export const signAirixWebhookPayload = ({
  payload,
  secret,
  timestamp = Math.floor(Date.now() / 1000),
}: {
  payload: string | Buffer
  secret: string
  timestamp?: number
}) => {
  const rawPayload = Buffer.isBuffer(payload) ? payload : Buffer.from(payload)
  const digest = createHmac('sha256', secret)
    .update(`${timestamp}.${rawPayload.toString('utf8')}`)
    .digest('hex')

  return `t=${timestamp},v1=${digest}`
}

const parseSignatureHeader = (header: string) =>
  header.split(',').reduce<Record<string, string>>((values, part) => {
    const [key, value] = part.split('=')

    if (key && value) {
      values[key.trim()] = value.trim()
    }

    return values
  }, {})

const safeEqual = (actual: string, expected: string) => {
  const actualBuffer = Buffer.from(actual)
  const expectedBuffer = Buffer.from(expected)

  return (
    actualBuffer.length === expectedBuffer.length &&
    timingSafeEqual(actualBuffer, expectedBuffer)
  )
}
