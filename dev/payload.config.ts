import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { MongoMemoryReplSet } from 'mongodb-memory-server'
import path from 'path'
import { buildConfig } from 'payload'
import { masqueradePlugin } from 'payload-plugin-masquerade'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { Users } from './collections/User'
import { testEmailAdapter } from './helpers/testEmailAdapter'
import { seed } from './seed'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

if (!process.env.ROOT_DIR) {
  process.env.ROOT_DIR = dirname
}

const buildConfigWithMemoryDB = async () => {
  if (process.env.NODE_ENV === 'test') {
    const memoryDB = await MongoMemoryReplSet.create({
      replSet: {
        count: 3,
        dbName: 'payloadmemory',
      },
    })

    process.env.DATABASE_URI = `${memoryDB.getUri()}&retryWrites=true`
  }

  return buildConfig({
    admin: {
      importMap: {
        baseDir: path.resolve(dirname),
      },
      user: Users.slug,
    },
    collections: [
      Users,
      {
        slug: 'posts',
        fields: [],
      },
      {
        slug: 'media',
        fields: [],
        upload: {
          staticDir: path.resolve(dirname, 'media'),
        },
      },
    ],
    db: mongooseAdapter({
      ensureIndexes: true,
      url: process.env.DATABASE_URI || '',
    }),
    editor: lexicalEditor(),
    email: testEmailAdapter,
    onInit: async (payload) => {
      await seed(payload)
    },
    plugins: [
      masqueradePlugin({
        authCollection: Users.slug,
        enableBlockForm: true,
        enabled: true,
        redirectPath: "/",
        onUnmasquerade: async ({ req, originalUserId }) => {
          console.log(Object.keys(req || {}))
          console.log(`You are: ${originalUserId || 'unknown'}`)
          console.log(`Your masquerade user is: ${req.user?.email || 'unknown'}`)
        },
        onMasquerade: async ({ req, masqueradeUserId }) => {
          const { user: originalUser } = req
          // Custom logic when masquerading
          const { docs } = await req.payload.find({
            collection: 'users',
            limit: 1,
            where: {
              id: { equals: masqueradeUserId },
            },
          })

          console.log(`You are: ${originalUser?.email || 'unknown'}`)
          console.log(`You are masquerading as user: ${docs[0]?.email || 'unknown'}`)
        },
      }),
    ],
    secret: process.env.PAYLOAD_SECRET || 'test-secret_key',
    sharp,
    typescript: {
      outputFile: path.resolve(dirname, 'payload-types.ts'),
    },
  })
}

export default buildConfigWithMemoryDB()
