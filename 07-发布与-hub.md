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
