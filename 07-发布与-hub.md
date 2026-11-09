# 07 · 发布与 Hub

> 适用 dsh `0.2.2-rc.1`。

## 发布前检查清单

- [ ] `npm run build` 通过，`lib/` 比 `src/` 新
- [ ] 单测、`check:client`、打包验收通过
- [ ] `version`、`engines.dsh`、`peerDependencies`、`files`、`license`、`repository` 齐全
- [ ] `locale/en.json` + `locale/zh.json` 存在，`exports["./locale/*.json"]` 存在
- [ ] `dsh.hub.summary` 是一行中文，讲清“是什么 + 干什么”
- [ ] README 有安装方式、截图、工具/界面说明
- [ ] 在干净 profile 里用 tgz 装过并重启验证

## 包内容验收

用户拿到的是 tarball，不是你的工作区：

```bash
npm pack --json      # stdout 可能混入 prepack 日志，从 '[' 行解析
tar -tzf my-plugin-0.1.0.tgz | sort
```

必须包含：`package/lib/index.js`、`package/lib/client.js`（有前端时）、`package/cordis.yml`、`package/cordis.patch.yml`、`package/locale/*.json`、随包资产。

不允许：`.env*`、密钥、`node_modules/`、`out/`、个人路径配置。

把检查写成脚本（`scripts/accept-pack.mjs`）：解析 `npm pack --json`，断言必需文件在、敏感文件不在。这样发布前跑一条命令即可。

## 元数据怎么写才有人装

| 位置 | 写什么 | 反例 |
| --- | --- | --- |
| `description` | 产品名开头 + 一句功能 | “a plugin for dsh” |
| `dsh.hub.summary` | 中文，说明使用场景 | 英文长句 |
| `keywords` | `dsh`、`deepseek-harness`、`dsh-plugin` + 中英文产品词 | 只有 `plugin` |
| `locale/*/meta.title` | 显示名 + 包名，便于搜索 | 只写英文 |
| README 首屏 | 截图/效果 + 安装命令 | 大段架构说明 |

Hub/安装列表的展示名来自 locale，检索命中来自 `keywords` 与 `description`。三者要一致，否则用户搜不到。

## 版本与兼容

- 语义化版本；破坏性改动升 minor/major，不要靠“重发同版本”修补；
- `engines.dsh` 写最低可用版本，例如 `">=0.2.2-rc.1"`；
- 只声明真正用到的 peer：`@deepseek-ai/cordis`、`@deepseek-ai/dsh-tools`；
- devDependencies 与本地 dsh 版本对齐，避免类型漂移；
- 用到新 API 时，在 README 标注最低 dsh 版本。

## 发布路径

1. `npm publish`（需要对应 scope 权限）；
2. 需要 Hub 收录时，提交包名/仓库与 `dsh.hub.summary`；
3. 打 git tag，与 npm 版本对齐；
4. 发布后在干净 profile 里 `add my-plugin@x.y.z` 复验。

## 不要发布的东西

原型、实验分支、带本地绝对路径的产物、只给自己用的数据。归档目录只保留源码，不参与发布。

## 图标与社会化预览

安装列表和 Hub 卡片会用到图标：

```jsonc
{
  "icon": "icon.svg",
  "files": ["icon.svg", "lib", "locale", "cordis.patch.yml"]
}
```

- 用 SVG，跟随主题时优先用 `currentColor`；
- 图标文件必须进 `files`，否则 npm 包里没有；
- README 首屏放一张能说明效果的截图或 social preview，转化率差别很大；
- 可选徽章：npm version、仓库 star、Hub 收录状态。

## 可选 peer 依赖

前端/React 相关的 peer 不一定是必需的（不同版本 dsh 提供的模块不同）。用 `peerDependenciesMeta` 标成 optional，避免用户装出 peer 冲突：

```jsonc
{
  "peerDependencies": {
    "@deepseek-ai/dsh-client-ui-primitives": ">=0.2.2-rc.1",
    "react": "^18.3.1"
  },
  "peerDependenciesMeta": {
    "@deepseek-ai/dsh-client-ui-primitives": { "optional": true },
    "react": { "optional": true }
  }
}
```

## 上架与分发

- 用户既可能在 **Add plugin 向导**里搜索安装，也可能走 CLI；两种路径都要在 README 写；
- 安装与更新命令成对出现：`add` / `update`；
- `description`、`keywords`、`hub.summary`、`locale.meta` 四处保持一致，否则搜索命中率低；
- 多语言 README（中/英至少各一份）会显著扩大受众。

## 许可证选择会影响别人能否复用

- MIT / Apache-2.0：允许商业使用与二次开发，生态友好；
- GPL：衍生插件也必须开源，很多团队会因此不用；
- 插件依赖的第三方代码、素材、字体要单独标注来源与许可证；
- 从别的插件借鉴实现时，先看它的许可证——**看懂思路可以，复制代码要谨慎**。
