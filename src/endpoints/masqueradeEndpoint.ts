import { randomUUID } from 'node:crypto'
import { cookies } from 'next/headers'
import {
  CollectionConfig,
  type Endpoint,
  generatePayloadCookie,
  getFieldsToSign,
  jwtSign,
  User,
  CollectionSlug,
} from 'payload'
import type { PluginTypes } from '../index'
import {
  createMasqueradeCookieValue,
  getMasqueradeCookieName,
} from '../cookies/masqueradeCookie'

const hasAdminRole = (user: unknown): boolean => {
  const roles = (user as { roles?: unknown })?.roles

  return Array.isArray(roles) && roles.includes('admin')
}

export const masqueradeEndpoint = ({
  authCollectionSlug,
  canMasquerade,
  onMasquerade,
  redirectPath,
}: {
  authCollectionSlug: string
  canMasquerade?: PluginTypes['canMasquerade']
  onMasquerade?: PluginTypes['onMasquerade']
  redirectPath?: string
}): Endpoint => ({
  method: 'post',
  path: '/:id/masquerade',
  handler: async (req) => {
    const { payload, routeParams } = req

    const authCollection = payload.config.collections?.find(
      (collection) => collection.slug === authCollectionSlug,
    )
    const isUseSessionsActive = authCollection?.auth?.useSessions === true

    const appCookies = await cookies()
    if (!routeParams?.id) {
      return new Response('No user ID provided', { status: 400 })
    }

    if (!req.user) {
      return new Response('Unauthorized', { status: 401 })
    }

    const user = await payload.findByID({
      collection: authCollectionSlug,
      depth: 0,
      id: routeParams.id as string,
    })

    if (!user) {
      return new Response('User not found', { status: 404 })
    }

    if (String(user.id) === String(req.user.id)) {
      return new Response('Cannot masquerade as yourself', { status: 400 })
    }

    const isAllowed = canMasquerade
      ? await canMasquerade({ req, targetUser: user as User })
      : hasAdminRole(req.user)

    if (!isAllowed) {
      return new Response('Forbidden', { status: 403 })
    }

    const fieldsToSignArgs: Parameters<typeof getFieldsToSign>[0] = {
      collectionConfig: authCollection as CollectionConfig,
      email: user.email!,
      user: user as User,
    }
    if (isUseSessionsActive) {
      // Add session to user
      const newSessionID = randomUUID()
      const now = new Date()
      const tokenExpInMs = authCollection.auth.tokenExpiration * 1000
      const expiresAt = new Date(now.getTime() + tokenExpInMs)

      const session = { id: newSessionID, createdAt: now, expiresAt }

      if (!user.sessions?.length) {
        user.sessions = [session]
      } else {
        user.sessions.push(session)
      }

      await payload.update({
        collection: authCollectionSlug as CollectionSlug,
        id: user.id,
        data: { sessions: user.sessions },
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

    const masqueradeCookie = createMasqueradeCookieValue({
      secret: payload.secret,
      state: {
        nonce: randomUUID(),
        originalUserId: req.user.id,
        startedAt: new Date().toISOString(),
        targetUserId: user.id,
      },
    })

    appCookies.set(getMasqueradeCookieName(), masqueradeCookie, {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })

    // Call onMasquerade callback if provided
    if (onMasquerade) {
      await onMasquerade({
        originalUserId: req.user.id,
        req,
        targetUser: user as User,
        targetUserId: user.id,
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
})
