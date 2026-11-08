#!/usr/bin/env node
/**
 * Contract check for the built client bundle:
 * loader shape, allow-listed requires, and the slots it registers.
 * Dependency-free on purpose: it must keep working even if dev deps change.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const code = readFileSync(path.join(repo, 'lib/client.js'), 'utf8')
const PACKAGE_ID = 'my-plugin'
const PLATFORM_REQUIRES = ['react', 'react/jsx-runtime']

assert.ok(!/^\s*(?:import|export)\s/m.test(code), 'bundle must not contain top-level ESM')

const registrations = []
vm.runInNewContext(code, {
  window: { __ModuleLoader__: { load: (record) => registrations.push(record) } },
}, { filename: 'client.js' })

assert.equal(registrations.length, 1, 'bundle must register exactly one loader record')
const [record] = registrations
assert.equal(record.id, PACKAGE_ID, `loader id must be "${PACKAGE_ID}"`)
assert.equal(typeof record.factory, 'function', 'loader record must carry a factory')

const required = [...new Set([...code.matchAll(/require\(\s*(['"])([^'"]+)\1\s*\)/g)].map((m) => m[2]))]
const unexpected = required.filter((specifier) => !PLATFORM_REQUIRES.includes(specifier))
assert.deepEqual(unexpected, [], `unexpected runtime requires: ${unexpected.join(', ')}`)

const element = (type, props, ...children) => ({ type, props, children })
const stubs = {
  react: {
    createElement: element,
    useState: (initial) => [typeof initial === 'function' ? initial() : initial, () => {}],
    useEffect: () => {},
    useMemo: (factory) => factory(),
    useCallback: (callback) => callback,
    useRef: (value) => ({ current: value }),
    Fragment: Symbol.for('react.fragment'),
  },
  'react/jsx-runtime': {
    jsx: element,
    jsxs: element,
    Fragment: Symbol.for('react.fragment'),
  },
}
const requireStub = (specifier) => {
  assert.ok(stubs[specifier], `factory required "${specifier}" outside the platform seed table`)
  return stubs[specifier]
}

const plugin = record.factory(requireStub)
assert.equal(typeof plugin.apply, 'function', 'plugin exports must expose apply()')
assert.deepEqual([...plugin.inject], ['slots'], 'plugin must inject slots')

const slotRegistrations = []
const fakeCtx = {
  effect(execute) { return execute() },
  slots: {
    inject(_key, callback) { return callback() },
    register(options, component) {
      slotRegistrations.push({ options, component })
      return () => {}
    },
  },
}
plugin.apply(fakeCtx)

const main = slotRegistrations.find((entry) => entry.options.name === 'main')
const sidebar = slotRegistrations.find((entry) => entry.options.name === 'sidebar.panellist')
assert.ok(main, 'apply must register a "main" panel')
assert.ok(sidebar, 'apply must register a "sidebar.panellist" entry')
assert.equal(main.options.key, sidebar.options.id, 'main key and sidebar id must match')
assert.equal(typeof main.component, 'function', 'main panel must be a component')

console.log(`[check-client] ok: ${PACKAGE_ID} registers main + sidebar.panellist; requires [${required.join(', ') || 'none'}]`)
