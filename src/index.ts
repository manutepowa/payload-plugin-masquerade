import type { CollectionConfig, Config, PayloadRequest, Plugin, User, Where } from 'payload'

import { cookies } from 'next/headers'

import { getMasqueradeCookieName } from './cookies/masqueradeCookie'
import { masqueradeEndpoint } from './endpoints/masqueradeEndpoint'
import { searchUsersEndpoint } from './endpoints/searchUsersEndpoint'
import { unmasqueradeEndpoint } from './endpoints/unmasqueradeEndpoint'

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
  /**
   * Optional callback that runs whenever an authorized user starts masquerading as another user.
   *
   * This function can be used to execute custom logic such as logging, notifications,
   * or audit logging. It receives both the original and target user IDs,
   * and can be asynchronous.
   * @req Original user is available in `req.user`
   */
  onMasquerade?: ({
    req,
    originalUserId,
    targetUser,
    targetUserId,
  }: {
    req: PayloadRequest
    originalUserId: string | number
    targetUser: User
    targetUserId: string | number
  }) => void | Promise<void>
  /**
   * Optional callback that runs whenever an admin stops masquerading and returns to their original user.
   *
   * This function enables you to execute custom logic, such as logging, notifications, or cleanup actions.
   * It receives the request object and the original user ID as arguments and can be asynchronous.
   * @req Masquerade user is available in `req.user`
   */
  onUnmasquerade?: ({
    req,
    originalUserId,
    targetUserId,
  }: {
    req: PayloadRequest
    originalUserId: string | number
    targetUserId: string | number
  }) => void | Promise<void>
  /**
   * Path to redirect to after masquerade or unmasquerade actions
   * @default "/admin"
   */
  redirectPath?: string
  /**
   * Field used by the admin selector to display users
   * @default "email"
   */
  userLabelField?: string
  /**
   * Restrict users shown in the admin selector
   */
  targetUserWhere?: Where
  /**
   * Decide whether the current user can start masquerading as the target user.
   * If omitted, the plugin falls back to a conservative `roles.includes('admin')` check.
   */
  canMasquerade?: ({
    req,
    targetUser,
  }: {
    req: PayloadRequest
    targetUser: User
  }) => boolean | Promise<boolean>
  /**
   * Decide whether the current masqueraded user can return to the original user.
   */
  canUnmasquerade?: ({
    req,
    originalUserId,
    targetUserId,
  }: {
    req: PayloadRequest
    originalUserId: string | number
    targetUserId: string | number
  }) => boolean | Promise<boolean>
}

export const masqueradePlugin =
  (pluginOptions: PluginTypes): Plugin =>
  (incomingConfig: Config): Config => {
    const config = { ...incomingConfig }

    if (pluginOptions.enabled === false) {
      return config
    }

    const authCollectionSlug = pluginOptions.authCollection || 'users'

    config.custom = {
      ...(config.custom || {}),
      masqueradePlugin: {
        authCollectionSlug,
        targetUserWhere: pluginOptions.targetUserWhere,
        userLabelField: pluginOptions.userLabelField || 'email',
      },
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
        masqueradeEndpoint({
          authCollectionSlug,
          canMasquerade: pluginOptions.canMasquerade,
          onMasquerade: pluginOptions.onMasquerade,
          redirectPath: pluginOptions.redirectPath,
        }),
        unmasqueradeEndpoint({
          authCollectionSlug,
          canUnmasquerade: pluginOptions.canUnmasquerade,
          onUnmasquerade: pluginOptions.onUnmasquerade,
          redirectPath: pluginOptions.redirectPath,
        }),
        searchUsersEndpoint({
          authCollectionSlug,
          targetUserWhere: pluginOptions.targetUserWhere,
          userLabelField: pluginOptions.userLabelField || 'email',
        }),
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
            cooks.delete(getMasqueradeCookieName())
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
