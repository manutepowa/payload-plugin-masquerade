import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { type Endpoint, generatePayloadCookie } from 'payload'
import { PluginTypes } from 'src'

export const masqueradeEndpoint = (
  authCollectionSlug: string,
  onMasquerade: PluginTypes['onMasquerade'] | undefined,
): Endpoint => ({
  method: 'get',
  path: '/:id/masquerade',
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
