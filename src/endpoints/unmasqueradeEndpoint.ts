import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { type Endpoint, generatePayloadCookie } from 'payload'
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

    const user = await payload.findByID({
      collection: authCollectionSlug,
      id: routeParams.id as string,
    })

    if (!user) {
      return new Response('User not found', { status: 404 })
    }

    const fieldsToSign = {
      id: user.id,
      collection: authCollectionSlug,
      email: user.email,
    }

    const token = jwt.sign(fieldsToSign, req.payload.secret, {
      expiresIn: payload.collections.users.config.auth.tokenExpiration,
    })

    const cookie = generatePayloadCookie({
      collectionAuthConfig: payload.collections.users.config.auth,
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
