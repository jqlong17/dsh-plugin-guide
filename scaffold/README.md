# my-plugin

Minimal DeepSeek Harness (dsh) plugin template: one host tool and one panel.

> Copy this directory, rename the package, and start building. See the
> [guide](../README.md) for the full walkthrough.

## Build

```bash
npm install
npm run build
npm run check:client
```

## Install into a dsh profile

```bash
dsh plugin --profile web add "link:$PWD"
# restart dsh
```

Verify:

```bash
readlink ~/.dsh/profiles/web/node_modules/my-plugin
dsh --profile web --dump-config | grep -A2 my-plugin
```

## What to change

- `package.json` — rename `name`, update `dsh.hub.summary`, version; remove
  `"private": true` before publishing.
- `cordis.patch.yml` / `cordis.yml` — replace the entry id.
- `src/index.ts` — register your tools.
- `src/client/` — panel page, sidebar icon, slot registrations.
- `scripts/build-client.mjs` — `PACKAGE_ID` must match `package.json`.

## Layout

```
src/index.ts           host: tools
src/client/index.ts    client: slots
src/client/page.tsx    panel UI
scripts/               build + contract check
lib/                   build output (git-ignored, published)
```

## License

MIT.
