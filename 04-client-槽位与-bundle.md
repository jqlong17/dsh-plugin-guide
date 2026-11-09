# 04 · Client 槽位与 bundle

> 适用 dsh `0.2.2-rc.1`。

## 产物是一段“注册脚本”

dsh 把多个插件的浏览器代码拼成 classic script 执行，所以 `lib/client.js` 必须是：

```js
window.__ModuleLoader__.load({
  id: "my-plugin",
  factory: (require) => {
    var module = { exports: {} }; var exports = module.exports;
    /* CJS bundle 本体 */
    return module.exports;
  }
});
```

硬约束：

1. 不能有顶层 `import` / `export`（拼接后语法错误）；
2. `factory` 里的 `require` 只认平台种子模块——目前是 `react`、`react/jsx-runtime`；
3. `id` 必须等于包名；
4. 不 import CSS，样式用内联。

## 对 dsh 前端包只做类型导入

```ts
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
```

这些包由 shell 的模块表提供。值导入会变成运行时 `require`，直接炸 bundle；`import type` 不留运行时引用。

## 注册界面

### 主区页面 + 侧边栏入口

两者共用一个 panel id，点击入口才能打开对应页面：

```ts
const PANEL_ID = 'my-panel'

export const inject = ['slots']

export function apply(ctx: Context) {
  ctx.effect(() => ctx.slots.inject('main', () => ctx.slots.register({
    name: 'main', key: PANEL_ID,
  }, Page)), 'my-plugin: main')

  ctx.effect(() => ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
    name: 'sidebar.panellist', id: PANEL_ID, order: 45, label: '我的面板',
  }, Icon)), 'my-plugin: sidebar')
}
```

### 右侧栏 tab

```ts
export const inject = ['slots', 'sidebarRightTabs', 'sidebarRight']

export function apply(ctx: Context) {
  ctx.effect(() => ctx.sidebarRightTabs.register(definition), 'my-plugin: tab')
  ctx.effect(
    () => ctx.slots.inject('sidebar.right.pane.tab', () =>
      ctx.slots.register({ name: 'sidebar.right.pane.tab', key: 'my-panel' }, Body)),
    'my-plugin: body',
  )
}
```

要点：

- 所有注册包在 `ctx.effect` 里，返回 disposer；
- `main.key` 与 `sidebar.panellist.id` 必须一致；
- `order` 只影响排序，不要依赖相邻插件的具体值；
- `inject` 要列出实际用到的服务。

## 数据从哪来

浏览器没有文件系统，三种通道：

| 通道 | 适用 | 做法 |
| --- | --- | --- |
| 宿主同源路由 | 读写本机文件、调用 host 能力 | host 注册 `/my-plugin/*`，前端 `POST` |
| 本机服务 | 已有独立引擎 | 前端直接 `fetch` 本地端口 |
| 纯前端 | 展示型面板 | 数据由 props/context 提供 |

同源路由要做：只接受 `POST`、限制 body 大小、校验前端传来的路径在允许目录内、依赖宿主的浏览器信任检查。

## 组件要求

- 函数组件 + React hooks；
- 加载中/空/错误三态齐全，文案具体；
- 大列表分页或截断；
- 不引入额外运行时依赖，图表优先手写 SVG；
- 关键中文文案放在组件或 `labels.ts`，不要散落。

## 自检

打包后用 `node:vm` 跑一遍：loader 记录恰好一条、`id` 正确、`factory` 是函数、`require` 集合只有平台种子、`apply` 注册了预期槽位。实现见 [05](05-构建产物与自检.md)。

## 一个能力，多个入口

成熟的插件往往不止一个入口：右侧栏 tab、主区页面、设置页、斜杠命令，可以指向同一份数据和同一个 RPC。做法是每个 surface 单独 `ctx.effect` 注册，共享组件与数据层：

```ts
ctx.effect(() => registerSidebarTab(ctx), 'my-plugin: sidebar')
ctx.effect(() => registerSettingsCard(ctx), 'my-plugin: settings')
```

注意：

- 每个入口都要有独立的三态（加载/空/错误），不要假设另一个入口已经加载过数据；
- 设置页写入后，其他入口要能感知变化（重新拉取或监听事件）；
- 入口越多，越要统一 panel id 与文案 key，避免同一个功能四个名字。

## 用宿主的 CSS 变量，不要硬编码颜色

面板会跟随亮/暗主题。直接写 `#fff`、`#333` 在暗色下会瞎。优先使用宿主设计 token：

```ts
const card = {
  background: 'var(--dsw-alias-bg-layer-1, #fff)',
  color: 'var(--dsw-alias-label-primary, inherit)',
  border: '1px solid var(--dsw-alias-border-l2, #e5e7eb)',
  borderRadius: 12,
}
```

变量名以当前 dsh 版本的设计系统为准；`var(--x, fallback)` 保证旧版本也有兜底。

## 经典 JSX 转换的坑

如果构建使用 classic JSX（`jsx: 'transform'`），产物里是 `React.createElement(...)`，但 bundle 的 `factory(require)` 不会自动注入 `React`。症状是面板渲染时 `ReferenceError: React is not defined`。两种修法：

- 推荐：`jsx: 'automatic'`，走 `react/jsx-runtime`；
- 或保留 classic，但在包装器里显式绑定：

```js
window.__ModuleLoader__.load({
  id: 'my-plugin',
  factory: (require) => {
    var module = { exports: {} }; var exports = module.exports;
    var React = require('react')   // classic JSX 需要
    /* bundle */
    return module.exports;
  }
})
```
