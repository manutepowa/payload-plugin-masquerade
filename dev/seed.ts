import type { Payload } from 'payload'

import { devUsers } from './helpers/credentials'

export const seed = async (payload: Payload) => {
  const { totalDocs } = await payload.count({
    collection: 'users',
  })

  if (totalDocs > 0) return

  for (const user of devUsers) {
    await payload.create({
      collection: 'users',
      data: user,
    })
  }
}
