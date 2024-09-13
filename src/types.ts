export interface PluginTypes {
  /**
   * Enable or disable plugin
   * @default false
   */
  enabled?: boolean;

  /**
   * Slug of the collection where user information will be stored
   * @default "users"
   */
  authCollection?: string;
}
