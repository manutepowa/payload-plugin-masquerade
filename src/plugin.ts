import type { CollectionConfig, Config, Plugin } from "payload";
import type { PluginTypes } from "./types";
import { masqueradeEndpoint } from "./endpoints/masqueradeEndpoint";
import { unmasqueradeEndpoint } from "./endpoints/unmasqueradeEndpoint";

export const masqueradePlugin =
  (pluginOptions: PluginTypes): Plugin =>
  (incomingConfig: Config): Config => {
    const config = { ...incomingConfig };

    if (pluginOptions.enabled === false) {
      return config;
    }

    config.admin = {
      ...(config.admin || {}),
      components: {
        ...(config.admin?.components || {}),
        actions: [
          ...(config.admin?.components?.actions || []),
          "payload-plugin-masquerade/ui#Unmasquerade",
        ],
      },
    }

     // Add authCollection field ui masquerade
     // Add authCollection endpoints to masquerade and unmasquerade

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
       ],
       fields: [
         ...(authCollection.fields || []),
         {
           type: "ui",
           name: "masquerade",
           label: "Masquerade",
           admin: {
             components: {
               Field: "payload-plugin-masquerade/ui#NullField",
               Cell: "payload-plugin-masquerade/ui#MasqueradeCell",
             },
           },
         },
       ],
     }

     config.collections = (config.collections || []).map((collection) =>
       collection.slug === authCollectionSlug ? modifiedCollection : collection,
     )

    return config;
  };