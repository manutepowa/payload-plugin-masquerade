import { type Endpoint, type Where } from 'payload'

import type { PluginTypes } from '../index'

export const searchUsersEndpoint = ({
  authCollectionSlug,
  targetUserWhere,
  userLabelField,
}: {
  authCollectionSlug: string
  targetUserWhere?: PluginTypes['targetUserWhere']
  userLabelField: string
}): Endpoint => ({
  method: 'get',
  path: '/masquerade-search',
  handler: async (req) => {
    const { payload, query } = req

    if (!req.user) {
      return new Response('Unauthorized', { status: 401 })
    }

    const search = (query?.search as string) || ''
    const page = Math.max(1, parseInt(String(query?.page ?? '1'), 10) || 1)
    const limit = Math.max(1, parseInt(String(query?.limit ?? '10'), 10) || 10)

    const conditions: Where[] = []
    if (targetUserWhere) conditions.push(targetUserWhere)
    if (search) {
      conditions.push({ [userLabelField]: { contains: search } })
    }

    const where: Where | undefined =
      conditions.length === 0
        ? undefined
        : conditions.length === 1
          ? conditions[0]
          : { and: conditions }

    const result = await payload.find({
      collection: authCollectionSlug,
      depth: 0,
      limit,
      page,
      where,
    })

    return Response.json({
      docs: result.docs,
      page: result.page,
      totalPages: result.totalPages,
      totalDocs: result.totalDocs,
    })
  },
})
