import { createHmac, timingSafeEqual } from 'node:crypto'

const cookieName = 'payload-masquerade'

export type MasqueradeState = {
  originalUserId: string | number
  targetUserId: string | number
  startedAt: string
  nonce: string
}

const base64URLDecode = (value: string): string => {
  return Buffer.from(value, 'base64url').toString('utf8')
}

const base64URLEncode = (value: string): string => {
  return Buffer.from(value, 'utf8').toString('base64url')
}

const sign = (payload: string, secret: string): string => {
  return createHmac('sha256', secret).update(payload).digest('base64url')
}

export const getMasqueradeCookieName = (): string => cookieName

export const createMasqueradeCookieValue = ({
  secret,
  state,
}: {
  secret: string
  state: MasqueradeState
}): string => {
  const payload = base64URLEncode(JSON.stringify(state))
  const signature = sign(payload, secret)

  return `${payload}.${signature}`
}

export const parseMasqueradeCookieValue = ({
  secret,
  value,
}: {
  secret: string
  value?: string
}): MasqueradeState | null => {
  if (!value) {
    return null
  }

  const [payload, signature] = value.split('.')

  if (!payload || !signature) {
    return null
  }

  const expectedSignature = sign(payload, secret)
  const signatureBuffer = Buffer.from(signature)
  const expectedSignatureBuffer = Buffer.from(expectedSignature)

  if (
    signatureBuffer.length !== expectedSignatureBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedSignatureBuffer)
  ) {
    return null
  }

  try {
    const parsed = JSON.parse(base64URLDecode(payload)) as Partial<MasqueradeState>

    if (
      parsed.originalUserId == null ||
      parsed.targetUserId == null ||
      !parsed.startedAt ||
      !parsed.nonce
    ) {
      return null
    }

    return parsed as MasqueradeState
  } catch {
    return null
  }
}
