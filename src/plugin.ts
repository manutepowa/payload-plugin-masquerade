import type { Plugin } from "payload";
import type { PluginTypes } from "./types";

export const MasqueradePlugin =
  (pluginOptions: PluginTypes): Plugin =>
  (incomingConfig) => {
    let config = { ...incomingConfig };

    console.log("MasqueradePlugin enabled:", pluginOptions.enabled);
    if (pluginOptions.enabled === false) {
      return config;
    }

    return config;
  };
