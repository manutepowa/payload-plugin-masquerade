# Payload Plugin Masquerade

[![npm version](https://badge.fury.io/js/payload-plugin-masquerade.svg)](https://www.npmjs.com/package/payload-plugin-masquerade)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

The Masquerade plugin allows administrators to switch users and surf the site as that user (no password required). Administrators can switch back to their own user account at any time.

![Masquerade Demo](https://raw.githubusercontent.com/manutepowa/payload-plugin-masquerade/main/screenshots/masquerade.png)

## Table of Contents

- [Features](#features)
- [Requirements](#requirements)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Configuration Options](#configuration-options)
- [Admin UI](#admin-ui)
- [API Endpoints](#api-endpoints)
- [Callbacks](#callbacks)
- [Security & Best Practices](#security--best-practices)
- [Development](#development)
- [Troubleshooting](#troubleshooting)
- [Known Issues](#known-issues)
- [License](#license)
- [Credits](#credits)

## Features

- ✅ Compatible with Payload v3 (^3.44.0)
- ✨ Zero external dependencies (only uses `uuid`)
- ⚙ Highly customizable with callbacks
- 🔒 Secure cookie-based authentication
- 🎯 Admin UI integration with user selection
- 📝 Audit trail support via callbacks

## Requirements

- **Node.js**: >= 18
- **Payload CMS**: >= 3.44.0

## Installation

Choose your package manager:

```bash
# pnpm
pnpm add payload-plugin-masquerade

# npm
npm install payload-plugin-masquerade

# yarn
yarn add payload-plugin-masquerade
```

## Quick Start

Add the plugin to your Payload configuration:

```ts
import { masqueradePlugin } from 'payload-plugin-masquerade'
import { buildConfig } from 'payload'

export default buildConfig({
  // ... your other config
  plugins: [
    masqueradePlugin({
      // Optional: specify auth collection (defaults to 'users')
      authCollection: 'users',
      // Optional: enable/disable admin form (defaults to true)
      enableBlockForm: true,
      // Optional: enable/disable plugin (defaults to true)
      enabled: true,
    }),
  ],
})
```

## Configuration Options

| Option            | Type       | Default     | Description                                            |
| ----------------- | ---------- | ----------- | ------------------------------------------------------ |
| `authCollection`  | `string`   | `'users'`   | Slug of the collection used for authentication         |
| `enableBlockForm` | `boolean`  | `true`      | Adds user selection block in Admin UI (beforeNavLinks) |
| `enabled`         | `boolean`  | `true`      | Enables/disables the entire plugin                     |
| `onMasquerade`    | `function` | `undefined` | Async callback called when starting masquerade         |
| `onUnmasquerade`  | `function` | `undefined` | Async callback called when ending masquerade           |

### Full Configuration Example

```ts
import { masqueradePlugin } from 'payload-plugin-masquerade'

export default buildConfig({
  plugins: [
    masqueradePlugin({
      authCollection: 'users',
      enableBlockForm: true,
      enabled: true,
      onMasquerade: async ({ req, masqueradeUserId }) => {
        // req.user contains the original admin user
        console.log(`Admin ${req.user?.email} started masquerading as user ${masqueradeUserId}`)

        // Example: Log to audit collection
        await req.payload.create({
          collection: 'auditLogs',
          data: {
            action: 'masquerade_start',
            adminId: req.user?.id,
            targetUserId: masqueradeUserId,
            timestamp: new Date(),
          },
        })
      },
      onUnmasquerade: async ({ req, originalUserId }) => {
        // req.user contains the user we were masquerading as
        console.log(`Ending masquerade, returning to user ${originalUserId}`)

        // Example: Log audit trail
        await req.payload.create({
          collection: 'auditLogs',
          data: {
            action: 'masquerade_end',
            adminId: originalUserId,
            masqueradeUserId: req.user?.id,
            timestamp: new Date(),
          },
        })
      },
    }),
  ],
})
```

## Admin UI

The plugin adds a user selection form to the admin interface that appears before the navigation links:

![Masquerade Form](https://raw.githubusercontent.com/manutepowa/payload-plugin-masquerade/main/screenshots/masquerade-form.gif)

To disable the admin form:

```ts
masqueradePlugin({
  enableBlockForm: false,
})
```

## API Endpoints

The plugin automatically adds these endpoints to your API:

### Start Masquerade

```
GET /api/<authCollection>/:id/masquerade
```

**Behavior:**

- Creates a JWT token for the target user
- Sets Payload authentication cookie
- Sets `masquerade` cookie with original user ID
- Redirects to `/admin`

**Example:**

```bash
curl -i "http://localhost:3000/api/users/USER_ID/masquerade"
```

### End Masquerade

```
GET /api/<authCollection>/unmasquerade/:id
```

**Behavior:**

- Restores authentication to original user (ID from route)
- Clears `masquerade` cookie
- Redirects to `/admin`

**Example:**

```bash
curl -i "http://localhost:3000/api/users/unmasquerade/ORIGINAL_USER_ID"
```

## Callbacks

### onMasquerade

Called when masquerade session starts:

```ts
onMasquerade: async ({ req, masqueradeUserId }) => {
  // req: PayloadRequest (req.user is the original admin)
  // masqueradeUserId: ID of user being masqueraded
}
```

### onUnmasquerade

Called when masquerade session ends:

```ts
onUnmasquerade: async ({ req, originalUserId }) => {
  // req: PayloadRequest (req.user is the masqueraded user)
  // originalUserId: ID of the original admin user
}
```

## Security & Best Practices

⚠️ **Security Warning**: Masquerade functionality allows administrators to access user accounts without passwords. Follow these best practices:

1. **Restrict Access**: Only grant masquerade permissions to trusted administrators
2. **Audit Trail**: Use callbacks to log all masquerade activities:
   ```ts
   onMasquerade: async ({ req, masqueradeUserId }) => {
     await req.payload.create({
       collection: 'securityLogs',
       data: {
         action: 'masquerade',
         adminId: req.user?.id,
         targetId: masqueradeUserId,
         ipAddress: req.ip,
         userAgent: req.headers['user-agent'],
         timestamp: new Date(),
       },
     })
   }
   ```
3. **Monitor Usage**: Regularly review masquerade logs for suspicious activity
4. **Session Management**: Masquerade sessions use the same timeout as regular sessions

## Development

To contribute or run the plugin locally:

1. **Clone the repository**

   ```bash
   git clone https://github.com/manutepowa/payload-plugin-masquerade.git
   cd payload-plugin-masquerade
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up development environment**

   ```bash
   cp dev/.env.example dev/.env
   # Edit dev/.env with your database configuration
   ```

4. **Start development servers**

   ```bash
   pnpm dev
   ```

5. **Visit the admin**
   Open http://localhost:3000/admin

### Testing

```bash
# Run all tests
pnpm test

# Run integration tests only
pnpm test:int

# Run E2E tests only
pnpm test:e2e
```

## Troubleshooting

### "The collection with the slug '...' was not found"

**Cause**: The `authCollection` option doesn't match any registered collection.

**Solutions:**

- Verify the collection slug matches exactly
- Ensure the collection is registered in `buildConfig.collections`
- Check that the plugin is loaded after the collection is defined

### Masquerade UI not appearing

**Cause**: The `enableBlockForm` option might be disabled.

**Solution:**

```ts
masqueradePlugin({
  enableBlockForm: true, // Make sure this is true
})
```

### Authentication issues after masquerade

**Cause**: Session conflicts or cookie issues.

**Solutions:**

- Clear browser cookies and try again
- Check that your auth collection uses the same session configuration
- Verify JWT signing key consistency

## License

The MIT License (MIT). Please see [License File](LICENSE) for more information.

## Credits

- This package was inspired by the Drupal [Masquerade](https://www.drupal.org/project/masquerade) module
- Maintained by [manutepowa](https://github.com/manutepowa)
