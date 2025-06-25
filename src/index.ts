import type { CollectionConfig, Config, Plugin } from 'payload'

import { cookies } from 'next/headers.js'

import { masqueradeEndpoint } from './endpoints/masqueradeEndpoint.js'
import { unmasqueradeEndpoint } from './endpoints/unmasqueradeEndpoint.js'

export interface PluginTypes {
  /**
   * Slug of the collection where user information will be stored
   * @default "users"
   */
  authCollection?: string
  /**
   * Enable block form
   * @default true
   */
  enableBlockForm?: boolean
  /**
   * Enable or disable plugin
   * @default false
   */
  enabled?: boolean
}

export const masqueradePlugin =
  (pluginOptions: PluginTypes): Plugin =>
  (incomingConfig: Config): Config => {
    const config = { ...incomingConfig }

    if (pluginOptions.enabled === false) {
      return config
    }

    config.admin = {
      ...(config.admin || {}),
      components: {
        ...(config.admin?.components || {}),
        ...(pluginOptions.enableBlockForm !== false && {
          beforeNavLinks: [
            ...(config.admin?.components?.beforeNavLinks || []),
            'payload-plugin-masquerade/ui#MasqueradeForm',
          ],
        }),
        header: [
          ...(config.admin?.components?.header || []),
          'payload-plugin-masquerade/ui#Unmasquerade',
        ],
      },
    }

    // Add authCollection field ui masquerade
    // Add authCollection endpoints to masquerade and unmasquerade

    const authCollectionSlug = pluginOptions.authCollection || 'users'
    const authCollection = config.collections?.find(
      (collection) => collection.slug === authCollectionSlug,
    )

    if (!authCollection) {
      throw new Error(`The collection with the slug "${authCollectionSlug}" was not found.`)
    }

    const modifiedCollection: CollectionConfig = {
      ...authCollection,
      endpoints: [
        ...(authCollection.endpoints || []),
        masqueradeEndpoint(authCollectionSlug),
        unmasqueradeEndpoint(authCollectionSlug),
      ],
      fields: [
        ...(authCollection.fields || []),
        {
          name: 'masquerade',
          type: 'ui',
          admin: {
            components: {
              Cell: 'payload-plugin-masquerade/ui#MasqueradeCell',
              Field: 'payload-plugin-masquerade/ui#NullField',
            },
          },
          label: 'Masquerade',
        },
      ],
      hooks: {
        ...(authCollection.hooks || []),
        afterLogout: [
          ...(authCollection.hooks?.afterLogout || []),
          async () => {
            const cooks = await cookies()
            cooks.delete('masquerade')
          },
        ],
      },
    }

    config.collections = (config.collections || []).map((collection) =>
      collection.slug === authCollectionSlug ? modifiedCollection : collection,
    )

    return config
  }
