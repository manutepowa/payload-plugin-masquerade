import { v4 as uuid } from 'uuid'
import { cookies } from 'next/headers'
import {
  CollectionConfig,
  type Endpoint,
  generatePayloadCookie,
  getFieldsToSign,
  jwtSign,
  User,
} from 'payload'
import { PluginTypes } from 'src'

export const masqueradeEndpoint = (
  authCollectionSlug: string,
  onMasquerade: PluginTypes['onMasquerade'] | undefined,
): Endpoint => ({
  method: 'get',
  path: '/:id/masquerade',
  handler: async (req) => {
    const { payload, routeParams } = req

    const authCollection = payload.config.collections?.find(
      (collection) => collection.slug === authCollectionSlug,
    )
    const isUseSessionsActive = authCollection?.auth?.useSessions === true

    console.log({ isUseSessionsActive })

    const appCookies = await cookies()
    if (!routeParams?.id) {
      return new Response('No user ID provided', { status: 400 })
    }

    const user = await payload.findByID({
      collection: authCollectionSlug,
      id: routeParams.id as string,
    })

    if (!user) {
      return new Response('User not found', { status: 404 })
    }

    const fieldsToSignArgs: Parameters<typeof getFieldsToSign>[0] = {
      collectionConfig: authCollection as CollectionConfig,
      email: user.email!,
      user: user as User,
    }
    if (isUseSessionsActive) {
      // Add session to user
      const newSessionID = uuid()
      const now = new Date()
      const tokenExpInMs = authCollection.auth.tokenExpiration * 1000
      const expiresAt = new Date(now.getTime() + tokenExpInMs)

      const session = { id: newSessionID, createdAt: now, expiresAt }

      if (!user.sessions?.length) {
        user.sessions = [session]
      } else {
        user.sessions.push(session)
      }

      await payload.db.updateOne({
        id: user.id,
        collection: authCollectionSlug,
        data: user,
        req,
        returning: false,
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
    appCookies.set('masquerade', req.user?.id.toString() as string)

    // Call onMasquerade callback if provided
    if (onMasquerade) {
      await onMasquerade({ req, masqueradeUserId: user.id })
    }

    // success redirect
    return new Response(null, {
      headers: {
        'Set-Cookie': cookie,
        Location: '/admin',
      },
      status: 302,
    })
  },
})
