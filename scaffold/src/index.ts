/**
 * Host half: register tools here.
 * This module is bundled to lib/index.js and imported by the dsh host.
 */
import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'

export const name = 'my-plugin'
export const inject = { tools: { required: true } }

const render = (_args: unknown, value: unknown) => [
  { type: 'text' as const, text: JSON.stringify(value, null, 2) },
]

export function apply(ctx: Context) {
  console.log('[my-plugin] loaded')

  ctx.tools.register(defineTool({
    name: 'my_echo',
    description: 'Echo the input text. Use it to verify that the plugin is loaded.',
    parameters: {
      text: { type: 'string', description: 'Text to echo back.' },
    },
    output: { schema: { type: 'object', additionalProperties: true }, render },
    async execute(args) {
      return { ok: true, echo: String(args.text ?? '') }
    },
  }))
}
