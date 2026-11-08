# 03 · Host 工具与生命周期

> 适用 dsh `0.2.2-rc.1`。

## 插件骨架

```ts
import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'

export const name = 'my-plugin'
export const inject = { tools: { required: true } }   // 或 ['tools']

export function apply(ctx: Context) {
  ctx.tools.register(defineTool({
    name: 'my_status',
    description: '报告插件与外部依赖是否可用。',
    parameters: {},
    output: { schema: { type: 'object', additionalProperties: true }, render },
    async execute() { return { ok: true } },
  }))
}

const render = (_args: unknown, value: unknown) => [
  { type: 'text' as const, text: JSON.stringify(value, null, 2) },
]
```

`parameters` 是 JSON Schema 子集；`output.render` 把返回值变成文本。

## inject：弱依赖与强依赖

| 写法 | 含义 | 适用 |
| --- | --- | --- |
| `['tools']` | 有就注入，没有也能加载 | 锦上添花的能力 |
| `{ tools: { required: true } }` | 缺失则拒绝加载 | 缺了插件就没意义 |

原则：核心能力用 `required`；凭据、账号、标题等可选服务用弱依赖 + 运行时判空。

## 条件注入：需要什么就声明什么

注册 HTTP 路由需要 `connection` + `webServer`。必须把属性访问放进声明了依赖的子作用域：

```ts
ctx.inject(['connection', 'webServer'], (web) => {
  web.effect(() => registerRoutes(web, handlers), 'my-plugin: route')
})
```

直接 `ctx.webServer` 会报 `cannot get property "webServer" without inject`。这时插件看起来加载成功，但路由 404。

## 工具描述就是提示词

模型只看得到 `name`、`description`、`parameters`。把关键约束写进去：

- 使用顺序（先读后写、写前确认）；
- 数据来源与禁区（“不要直接改数据库，走这个工具”）；
- 失败时给可执行的下一步（“服务未启动，先运行 `npm run engine`”）。

描述里不要放内部实现细节，模型会照做。

## 返回错误，不要抛异常

抛异常通常只留一行栈，模型拿不到上下文。约定统一结构：

```ts
return { ok: false, error: { code: 'ENGINE_DOWN', message: '...', hint: '...' } }
```

`ok`、`error.code`、`hint` 保持稳定，前端和其他工具才能统一处理。

## 可选服务的安全访问

```ts
function service(ctx: Context, name: string): any {
  try {
    const get = (ctx as any).get
    return typeof get === 'function' ? get.call(ctx, name) : null
  } catch { return null }
}

const credentials = service(ctx, 'credentials')
if (credentials?.resolve) { /* 用 */ }
```

不要假设服务存在；可选服务失败不应拖垮插件。

## 生命周期与清理

- 注册可回收资源：`ctx.effect(() => disposer, 'label')`；
- 定时器 `setTimeout(...).unref()`，否则拖住进程退出；
- 卸载时 flush 数据、清 timer：

```ts
ctx.effect(() => () => {
  if (timer) clearTimeout(timer)
  flush()
}, 'my-plugin: flush on unload')
```

## 并发、缓存与超时

- 同一时刻只发一个请求：用 `inflight` Promise 合并；
- 外部查询加短 TTL 缓存（如 25s），并提供 `fresh` 参数绕过；
- 所有外部请求带超时：`AbortSignal.timeout(ms)`；
- 只对 5xx/网络错误重试，4xx 不重试。

## 日志

统一前缀，例如 `[my-plugin]`；启动时打一行“已加载 + 版本/入口”。排错时第一件事就是确认加载的是哪份产物。
