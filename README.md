# Payload plugin Masquerade

Description

# Features

- ✅ Compatible with Payload v3
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
export default buildConfig({
  // ...
  plugins: [
    MasqueradePlugin({
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
3. `pnpm dev`

# License

The MIT License (MIT). Please see [License File](LICENSE) for more information.

# Credits
This package and plugin template was inspired by [Payload OAuth2 Plugin](https://github.com/WilsonLe/payload-oauth2)
