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

export const unmasqueradeEndpoint = (
  authCollectionSlug: string,
  onUnmasquerade: PluginTypes['onUnmasquerade'] | undefined,
): Endpoint => ({
  handler: async (req) => {
    const { payload, routeParams } = req
    const appCookies = await cookies()
    if (!routeParams?.id) {
      return new Response('No user ID provided', { status: 400 })
    }

    const authCollection = payload.config.collections?.find(
      (collection) => collection.slug === authCollectionSlug,
    )
    const isUseSessionsActive = authCollection?.auth?.useSessions === true

    const user = (await payload.findByID({
      collection: authCollectionSlug,
      id: routeParams.id as string,
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
      fieldsToSignArgs.sid = user.sessions![0].id // Use the first session ID
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
    appCookies.delete('masquerade')

    // Call onUnmasquerade callback if provided
    if (onUnmasquerade) {
      await onUnmasquerade({ req, originalUserId: user.id })
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
  method: 'get',
  path: '/unmasquerade/:id',
})
