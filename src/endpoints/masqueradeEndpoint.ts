import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers.js'
import { type Endpoint, generatePayloadCookie } from 'payload'

export const masqueradeEndpoint = (authCollectionSlug: string): Endpoint => ({
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
