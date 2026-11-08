import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(path.join(repo, 'package.json'))

function findEsbuild() {
  if (process.env.ESBUILD_BIN && existsSync(process.env.ESBUILD_BIN)) return process.env.ESBUILD_BIN
  try {
    const pkg = require.resolve('esbuild/package.json')
    const bin = path.join(path.dirname(pkg), 'bin', 'esbuild')
    if (existsSync(bin)) return bin
  } catch {
    // fall through
  }
  const local = path.join(repo, 'node_modules', '.bin', 'esbuild')
  return existsSync(local) ? local : null
}

const bin = findEsbuild()
if (!bin) {
  console.error('esbuild not found: run `npm install` or set ESBUILD_BIN')
  process.exit(1)
}

console.log('[build:host] using', bin)
const result = spawnSync(bin, [
  'src/index.ts',
  '--bundle',
  '--platform=node',
  '--format=esm',
  '--target=node20',
  '--outfile=lib/index.js',
  '--packages=external',
  '--log-level=warning',
], { cwd: repo, stdio: 'inherit' })

process.exit(result.status ?? 1)
