import { execFileSync } from 'node:child_process'
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { expect, test } from 'vitest'

const require = createRequire(import.meta.url)
const { transformSync } = createRequire(require.resolve('@swc/cli/package.json'))('@swc/core')
const vitestRequire = createRequire(require.resolve('vitest/package.json'))
const { buildSync } = createRequire(vitestRequire.resolve('vite/package.json'))('esbuild')

test('npm tarball exposes usable root and UI entries and declarations', () => {
  const root = process.cwd()
  const scratch = mkdtempSync(path.join(tmpdir(), 'masquerade-npm-'))
  try {
    const packageDir = path.join(scratch, 'package-source')
    const consumer = path.join(scratch, 'consumer')
    mkdirSync(packageDir)
    mkdirSync(path.join(consumer, 'node_modules'), { recursive: true })
    copyFileSync(path.join(root, 'package.json'), path.join(packageDir, 'package.json'))
    const swc = JSON.parse(readFileSync(path.join(root, '.swcrc'), 'utf8'))
    const compile = (dir) => {
      for (const entry of readdirSync(path.join(root, 'src', dir), { withFileTypes: true })) {
        const relative = path.join(dir, entry.name)
        if (entry.isDirectory()) compile(relative)
        else if (/\.tsx?$/.test(entry.name)) {
          const output = path.join(packageDir, 'dist', relative.replace(/\.tsx?$/, '.js'))
          mkdirSync(path.dirname(output), { recursive: true })
          writeFileSync(output, transformSync(readFileSync(path.join(root, 'src', relative), 'utf8'), {
            ...swc, filename: entry.name,
          }).code)
        }
      }
    }
    compile('')
    execFileSync(process.execPath, [path.join(root, 'node_modules/typescript/bin/tsc'), '--outDir', path.join(packageDir, 'dist'), '--rootDir', './src', '--incremental', 'false', '--composite', 'false', '--declaration'], { cwd: root, stdio: 'inherit' })
    const npmEnv = { ...process.env, npm_config_userconfig: '/dev/null', npm_config_globalconfig: path.join(scratch, 'empty-global-config'), npm_config_cache: path.join(scratch, 'npm-cache') }
    const packed = JSON.parse(execFileSync('npm', ['pack', '--ignore-scripts', '--offline', '--json', '--pack-destination', scratch], { cwd: packageDir, env: npmEnv, encoding: 'utf8' }))
    const installed = path.join(consumer, 'node_modules', 'payload-plugin-masquerade')
    mkdirSync(installed)
    execFileSync('tar', ['-xzf', path.join(scratch, packed[0].filename), '-C', installed, '--strip-components=1'])
    symlinkSync(path.join(root, 'node_modules'), path.join(installed, 'node_modules'), 'dir')
    const script = `
      import { masqueradePlugin } from 'payload-plugin-masquerade';
      import { accessSync } from 'node:fs';
      import { fileURLToPath } from 'node:url';
      import assert from 'node:assert/strict';
      accessSync(fileURLToPath(import.meta.resolve('payload-plugin-masquerade/ui')));
      assert.equal(typeof masqueradePlugin, 'function');
      console.log('ok');
    `
    expect(execFileSync(process.execPath, ['--input-type=module', '-e', script], { cwd: consumer, encoding: 'utf8', stdio: 'pipe' })).toBe('ok\n')
    writeFileSync(path.join(consumer, 'check.mts'), "import { masqueradePlugin } from 'payload-plugin-masquerade'\nimport { MasqueradeForm } from 'payload-plugin-masquerade/ui'\nvoid masqueradePlugin; void MasqueradeForm\n")
    execFileSync(process.execPath, [path.join(root, 'node_modules/typescript/bin/tsc'), '--noEmit', '--skipLibCheck', '--module', 'nodenext', '--moduleResolution', 'nodenext', '--target', 'es2022', 'check.mts'], { cwd: consumer, stdio: 'pipe' })
    const ui = buildSync({
      stdin: { contents: "export * from 'payload-plugin-masquerade/ui'", resolveDir: consumer },
      bundle: true, format: 'esm', platform: 'node', write: false, metafile: true,
      external: ['next/*', 'react', 'react/*', '@payloadcms/*', 'payload'],
    })
    expect(Object.values(ui.metafile.outputs)[0].exports.sort()).toEqual([
      'MasqueradeCell', 'MasqueradeForm', 'NullField', 'Unmasquerade',
    ])
  } finally {
    rmSync(scratch, { recursive: true, force: true })
  }
}, 30000)
