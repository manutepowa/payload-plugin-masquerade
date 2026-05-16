import { randomUUID } from 'node:crypto'
import { cookies } from 'next/headers'
import {
  CollectionSlug,
  CollectionConfig,
  type Endpoint,
  generatePayloadCookie,
  getFieldsToSign,
  jwtSign,
  User,
} from 'payload'
import type { PluginTypes } from '../index'
import {
  getMasqueradeCookieName,
  parseMasqueradeCookieValue,
} from '../cookies/masqueradeCookie'

export const unmasqueradeEndpoint = ({
  authCollectionSlug,
  canUnmasquerade,
  onUnmasquerade,
  redirectPath,
}: {
  authCollectionSlug: string
  canUnmasquerade?: PluginTypes['canUnmasquerade']
  onUnmasquerade?: PluginTypes['onUnmasquerade']
  redirectPath?: string
}): Endpoint => ({
  handler: async (req) => {
    const { payload } = req
    const appCookies = await cookies()

    if (!req.user) {
      return new Response('Unauthorized', { status: 401 })
    }

    const masqueradeState = parseMasqueradeCookieValue({
      secret: payload.secret,
      value: appCookies.get(getMasqueradeCookieName())?.value,
    })

    if (!masqueradeState) {
      return new Response('Masquerade session not found', { status: 400 })
    }

    if (String(req.user.id) !== String(masqueradeState.targetUserId)) {
      return new Response('Invalid masquerade session', { status: 403 })
    }

    const isAllowed = canUnmasquerade
      ? await canUnmasquerade({
          originalUserId: masqueradeState.originalUserId,
          req,
          targetUserId: masqueradeState.targetUserId,
        })
      : true

    if (!isAllowed) {
      return new Response('Forbidden', { status: 403 })
    }

    const authCollection = payload.config.collections?.find(
      (collection) => collection.slug === authCollectionSlug,
    )
    const isUseSessionsActive = authCollection?.auth?.useSessions === true

    const user = (await payload.findByID({
      collection: authCollectionSlug,
      depth: 0,
      id: masqueradeState.originalUserId as string,
    })) as User

    if (!user) {
      return new Response('User not found', { status: 404 })
    }

    const fieldsToSignArgs: Parameters<typeof getFieldsToSign>[0] = {
      collectionConfig: authCollection as CollectionConfig,
      email: user.email!,
      user,
    }

    if (isUseSessionsActive) {
      const newSessionID = randomUUID()
      const now = new Date()
      const tokenExpInMs = authCollection.auth.tokenExpiration * 1000
      const expiresAt = new Date(now.getTime() + tokenExpInMs)
      const sessions = [
        ...(((user as { sessions?: unknown[] }).sessions || []) as unknown[]),
        { createdAt: now, expiresAt, id: newSessionID },
      ]

      await payload.update({
        collection: authCollectionSlug as CollectionSlug,
        data: { sessions },
        id: user.id,
        req,
      })

      fieldsToSignArgs.sid = newSessionID
    }

    const fieldsToSign = getFieldsToSign(fieldsToSignArgs)

    const { token } = await jwtSign({
      fieldsToSign,
      secret: payload.secret,
      tokenExpiration: authCollection?.auth.tokenExpiration!,
    })

    const cookie = generatePayloadCookie({
      collectionAuthConfig: authCollection?.auth!,
      cookiePrefix: payload.config.cookiePrefix,
      token,
    })

    // Set masquerade cookie with allow unmasquerade
    appCookies.delete(getMasqueradeCookieName())

    // Call onUnmasquerade callback if provided
    if (onUnmasquerade) {
      await onUnmasquerade({
        originalUserId: masqueradeState.originalUserId,
        req,
        targetUserId: masqueradeState.targetUserId,
      })
    }

    // success redirect
    return new Response(null, {
      headers: {
        'Set-Cookie': cookie,
        Location: redirectPath ?? '/admin',
      },
      status: 302,
    })
  },
  method: 'post',
  path: '/unmasquerade',
})
