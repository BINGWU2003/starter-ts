# starter-ts

一个有明确工程取向的 TypeScript 库模板：使用 pnpm 管理 workspace，Turborepo 编排任务，
Oxlint 负责代码检查和规则修复，Oxfmt 统一格式化仓库，tsdown 构建 ESM 包，Vitest 测试真实
行为，Changesets 管理发布。

## 特性

- Node.js ESM only，支持 Node.js 22.18+ 与 24.x
- `packages/config`：只导出共享 base 的纯配置包
- `packages/core`：可发布的 TypeScript 库
- `examples/basic`：直接消费 workspace 包的最小示例
- 每个业务子包拥有自己的薄配置文件，按需复用共享 base
- 子包级 Oxlint 类型感知检查，以及根级 Oxfmt 统一格式化
- Turborepo 本地及 CI 缓存
- Changesets、npm Trusted Publishing 和 GitHub Release
- Ubuntu、Windows 与 Node.js 22、24 的 CI 验证

## 从模板开始

通过 GitHub 的 **Use this template** 创建仓库后，先完成以下替换：

1. 将 `@scope/core` 替换为你的 npm 包名。
2. 将 `@scope/example-basic` 替换为你的示例 workspace 名称。
3. 将 `YOUR_NAME` 替换为你的作者名。
4. 将 `OWNER/REPOSITORY` 替换为你的 GitHub 仓库路径。
5. 更新根目录 `package.json` 和 `.changeset/config.json` 中的
   `BINGWU2003/starter-ts`。
6. 修改 `packages/core` 的描述、源码和测试。

可以使用 `rg` 检查是否还有未替换的标记：

```bash
rg '@scope|YOUR_NAME|OWNER/REPOSITORY|BINGWU2003/starter-ts'
```

## 目录结构

```text
.
├─ packages/
│  ├─ config/          # 共享配置对象与 tsconfig JSON，不构建、不自我配置
│  └─ core/            # 可发布库，拥有自己的 Oxc、Vitest、tsdown 与 tsconfig 配置
├─ examples/
│  └─ basic/           # 消费示例，拥有自己的 Oxc 与 tsconfig 配置
├─ .npmrc              # npm/Node.js 引擎严格校验
├─ .oxfmtrc.json       # 整个仓库共享的 Oxfmt 配置
└─ turbo.json          # 只负责任务编排与缓存
```

`@scope/config` 自身不提供 scripts、工具配置或构建产物，也不生成 `dist`。它只提供以下 base，
具体 workspace 再通过本地配置文件组合它们：

- `@scope/config/oxlint`
- `@scope/config/tsdown`
- `@scope/config/vitest`
- `@scope/config/tsconfig/base.json`
- `@scope/config/tsconfig/node.json`

根目录与 `packages/config` 不参与 lint 或 lint fix。Oxfmt 配置放在根目录并统一格式化整个
仓库，不在子包内重复配置。`packages/core`、`examples/basic` 等普通 workspace 的 Oxlint、
TypeScript、测试和构建由各自配置与脚本负责；Turbo 只编排这些包级任务。

## 开发

需要 Node.js 22.18+ 或 24.x，以及 Corepack 提供的 pnpm 11.15.1。`.npmrc` 与
`pnpm-workspace.yaml` 会严格校验 `package.json` 声明的 Node.js 和 pnpm 版本：

```bash
corepack enable
pnpm install
pnpm check
```

常用命令：

| 命令                | 用途                                  |
| ------------------- | ------------------------------------- |
| `pnpm build`        | 构建所有 workspace                    |
| `pnpm dev`          | 以监听模式运行开发任务                |
| `pnpm lint`         | 使用 Oxlint 检查普通 workspace        |
| `pnpm lint:fix`     | 修复普通 workspace 的 lint 问题       |
| `pnpm format`       | 使用根 Oxfmt 配置格式化整个仓库       |
| `pnpm format:check` | 检查整个仓库的格式                    |
| `pnpm typecheck`    | 检查所有 workspace 的 TypeScript 类型 |
| `pnpm test`         | 运行 Vitest 测试                      |
| `pnpm check`        | 运行提交前的完整验证                  |

提交时，nano-staged 会对普通 workspace 的 JavaScript/TypeScript 文件执行 Oxlint fix，再用
根 `.oxfmtrc.json` 格式化所有匹配文件。根文件与 `packages/config` 只格式化，不参与 lint fix。

运行消费示例：

```bash
pnpm build
pnpm --filter @scope/example-basic start
```

## 发布

面向用户的变更应先创建 changeset：

```bash
pnpm changeset
```

合并到 `main` 后，Release workflow 会创建或更新版本 PR。合并版本 PR 后，workflow 会构建、
发布 npm 包，并由 Changesets 创建 GitHub Release。

首次发布需要先在本地登录 npm 并创建包：

```bash
pnpm --filter @scope/core publish --access public
```

随后在 npm 包的 **Trusted Publisher** 设置中绑定 GitHub 仓库和
`.github/workflows/release.yml`。工作流使用 OIDC 发布，不需要长期保存 `NPM_TOKEN`。

## Turbo 远程缓存

默认只使用本地缓存。如果团队需要共享缓存，可以按需连接远程缓存：

```bash
pnpm turbo login
pnpm turbo link
```

仓库不会预设 Vercel 账户或远程缓存密钥。

## 新增 workspace

新增普通子包时：

1. 在 `package.json` 中添加 `@scope/config: "workspace:*"`。
2. 为实际使用的工具创建本地配置文件；Oxlint 使用 `.oxlintrc.json` 的 `extends` 继承共享
   base，tsdown 则在共享 base 上补充 `entry`。不需要的工具不必创建配置。
3. 在子包中提供对应的 `lint`、`lint:fix`、`typecheck`、`test`、`build` 等脚本。格式化由根
   Oxfmt 统一处理，不需要子包脚本。Turbo 会按同名任务自动编排，通常不需要修改
   `turbo.json`。
4. 让 `tsconfig.json` 继承 `@scope/config/tsconfig/node.json`，再声明子包自己的 `include`
   和必要覆盖项。

只有真正会被多个子包复用的规则才放入 `packages/config`。仓库级编排、入口文件和测试范围
等局部决策留在使用方。

## 许可证

[MIT](./LICENSE.md)
