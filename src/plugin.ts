import type { CollectionConfig, Plugin } from "payload";
import type { PluginTypes } from "./types";
import { masqueradeEndpoint } from "./endpoints/masqueradeEndpoint";
import { unmasqueradeEndpoint } from "./endpoints/unmasqueradeEndpoint";

export const MasqueradePlugin =
  (pluginOptions: PluginTypes): Plugin =>
  (incomingConfig) => {
    let config = { ...incomingConfig };

    if (pluginOptions.enabled === false) {
      return config;
    }

    // Add global action to unmasquerade
    config.admin = {
      ...config.admin,
      components: {
        ...(config.admin?.components || {}),
        actions: [
          ...(config.admin?.components?.actions || []),
          "@/../../src/actions/Unmasquerade",
        ],
      },
    }

    // Add field ui masquerade
    // Add endpoints to masquerade and unmasquerade

    const authCollectionSlug = pluginOptions.authCollection || "users"
    const authCollection = config.collections?.find(
      (collection) => collection.slug === authCollectionSlug,
    )

    if (!authCollection) {
      throw new Error(
        `The collection with the slug "${authCollectionSlug}" was not found.`,
      )
    }

    const modifiedCollection: CollectionConfig = {
      ...authCollection,
      endpoints: [
        ...(authCollection.endpoints || []),
        masqueradeEndpoint(authCollectionSlug),
        unmasqueradeEndpoint(authCollectionSlug),
      ]
    }

    config.collections = config.collections?.map((collection) =>
      collection.slug === authCollectionSlug ? modifiedCollection : collection,
    )

    return config;
  };
