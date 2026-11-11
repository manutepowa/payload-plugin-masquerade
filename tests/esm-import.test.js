import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'
import { expect, test } from 'vitest'

const require = createRequire(import.meta.url)
const swcRequire = createRequire(require.resolve('@swc/cli/package.json'))
const { transformSync } = swcRequire('@swc/core')

// Compile to disposable scratch space using the package's SWC settings, without touching dist.
test('published entry imports in native Node ESM and preserves plugin configuration', () => {
  const root = process.cwd()
  const scratch = mkdtempSync(path.join(tmpdir(), 'masquerade-esm-'))
  try {
    const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'))
    const swc = JSON.parse(readFileSync(path.join(root, '.swcrc'), 'utf8'))
    writeFileSync(path.join(scratch, 'package.json'), JSON.stringify({
      name: pkg.name, type: 'module', exports: pkg.exports,
    }))
    symlinkSync(path.join(root, 'node_modules'), path.join(scratch, 'node_modules'), 'dir')
    const compile = (dir) => {
      for (const entry of readdirSync(path.join(root, 'src', dir), { withFileTypes: true })) {
        const relative = path.join(dir, entry.name)
        if (entry.isDirectory()) {
          compile(relative)
        } else if (/\.tsx?$/.test(entry.name)) {
          const output = path.join(scratch, 'dist', relative.replace(/\.tsx?$/, '.js'))
          mkdirSync(path.dirname(output), { recursive: true })
          const source = readFileSync(path.join(root, 'src', relative), 'utf8')
          writeFileSync(output, transformSync(source, { ...swc, filename: entry.name }).code)
        }
      }
    }
    compile('')
    const script = `
      import { masqueradePlugin } from 'payload-plugin-masquerade';
      import assert from 'node:assert/strict';
      const config = { collections: [{ slug: 'users', fields: [] }] };
      assert.deepEqual(masqueradePlugin({ enabled: false })(config), config);
      const result = masqueradePlugin({})(config);
      assert.equal(result.collections[0].endpoints.length, 3);
      assert.equal(result.collections[0].fields[0].name, 'masquerade');
      console.log('ok');
    `
    expect(execFileSync(process.execPath, ['--input-type=module', '-e', script], {
      cwd: scratch, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
    })).toBe('ok\n')
  } finally {
    rmSync(scratch, { recursive: true, force: true })
  }
})
