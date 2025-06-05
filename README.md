# Payload plugin Masquerade

The Masquerade module allows to switch users and surf the site as that user (no password required). That person can switch back to their own user account at any time.

Two links to switch user (Masquerade) and go back (Unmasquerade)

![Masquerade](https://raw.githubusercontent.com/manutepowa/payload-plugin-masquerade/main/screenshots/masquerade.png)

# Features

- ✅ Compatible with Payload v3 beta.102
- ✨ Zero dependencies
- ⚙ Highly customizable

# Installation

```
npm install payload-plugin-masquerade
yarn install payload-plugin-masquerade
```

# Example Usage

Integrating to `users` collection.

```ts
import { masqueradePlugin } from 'payload-plugin-masquerade'

export default buildConfig({
  // ...
  plugins: [
    masqueradePlugin({
      enabled: true,
    }),
  ],
  // ...
});
```

# Contributing

Contributions and feedback are very welcome.

To get it running:

1. Clone the project.
2. `pnpm install`
3. Add .env file in dev folder to start payload project
4. `pnpm dev`

# License

The MIT License (MIT). Please see [License File](LICENSE) for more information.

# Credits
- This package was inspired by a drupal module [Masquerade](https://www.drupal.org/project/masquerade)
- This plugin template was inspired by [payload-enchants](https://github.com/r1tsuu/payload-enchants)
