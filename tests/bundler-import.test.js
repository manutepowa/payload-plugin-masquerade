import { expect, test } from 'vitest'
import { masqueradePlugin } from '../src/index.ts'

test('bundler resolves the source entry and preserves plugin behavior', () => {
  const config = { collections: [{ slug: 'users', fields: [] }] }
  expect(masqueradePlugin({ enabled: false })(config)).toEqual(config)
  expect(masqueradePlugin({})(config).collections[0].endpoints).toHaveLength(3)
})
