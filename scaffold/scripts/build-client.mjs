import { build } from 'esbuild'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PACKAGE_ID = 'my-plugin'
const ENTRY = path.join(repo, 'src/client/index.ts')
const OUTFILE = path.join(repo, 'lib/client.js')
const PLATFORM_REQUIRES = ['react', 'react/jsx-runtime']

function indent(text) {
  return text.split('\n').map((line) => (line.length === 0 ? line : `    ${line}`)).join('\n')
}

function wrap(body) {
  return `window.__ModuleLoader__.load({
  id: ${JSON.stringify(PACKAGE_ID)},
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
${indent(body)}
    return module.exports;
  }
});
`
}

const result = await build({
  absWorkingDir: repo,
  entryPoints: [ENTRY],
  bundle: true,
  format: 'cjs',
  platform: 'browser',
  target: 'es2022',
  jsx: 'automatic',
  external: PLATFORM_REQUIRES,
  write: false,
  logLevel: 'warning',
  legalComments: 'none',
  charset: 'utf8',
  sourcemap: false,
  metafile: true,
})

const output = result.outputFiles?.[0]
if (!output) {
  console.error('[build:client] esbuild produced no output')
  process.exit(1)
}

const cssInputs = Object.keys(result.metafile.inputs).filter((file) => file.endsWith('.css'))
if (cssInputs.length > 0) {
  console.error(`[build:client] client bundle must not import CSS: ${cssInputs.join(', ')}`)
  process.exit(1)
}

await mkdir(path.dirname(OUTFILE), { recursive: true })
const wrapped = wrap(output.text.trimEnd())
await writeFile(OUTFILE, wrapped)
console.log(`[build:client] wrote ${OUTFILE} (${wrapped.length} bytes)`)
