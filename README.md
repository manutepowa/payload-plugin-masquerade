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

## Example Usage

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

## Enable masquerade form block


![MasqueradeForm](https://raw.githubusercontent.com/manutepowa/payload-plugin-masquerade/main/screenshots/masquerade-form.webm)

Enable the masquerade form block to allow select a user and switch to their account directly from the admin panel. The selection form appears before the navigation links, making it easy to access and use the Masquerade feature.

Block is enable by default, to disable set to false

```ts
export default buildConfig({
  // ...
  plugins: [
    masqueradePlugin({
      enableBlockForm: false,
    }),
  ],
  // ...
});
```


## Contributing

Contributions and feedback are very welcome.

To get it running:

1. Clone the project.
2. `pnpm install`
3. Add .env file in dev folder to start payload project
4. `pnpm dev`

## License

The MIT License (MIT). Please see [License File](LICENSE) for more information.

## Credits
- This package was inspired by a drupal module [Masquerade](https://www.drupal.org/project/masquerade)
