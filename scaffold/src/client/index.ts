/**
 * Client half: register the panel page and its sidebar entry.
 * Bundled to lib/client.js as a classic script wrapped in __ModuleLoader__.
 */
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
import { Page } from './page.tsx'
import { Icon } from './icon.tsx'

export const inject = ['slots']

/** Shared by the main page and the sidebar entry. They must stay identical. */
export const PANEL_ID = 'my-plugin-panel'

export function apply(ctx: Context) {
  ctx.effect(() => ctx.slots.inject('main', () => ctx.slots.register({
    name: 'main',
    key: PANEL_ID,
  }, Page)), 'my-plugin: main')

  ctx.effect(() => ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
    name: 'sidebar.panellist',
    id: PANEL_ID,
    order: 60,
    label: '我的插件',
  }, Icon)), 'my-plugin: sidebar')
}
