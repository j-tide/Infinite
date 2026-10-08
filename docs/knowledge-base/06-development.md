# 开发与验证

[返回知识库](README.md)

## 环境与命令

需要 Node.js 20 或更新版本及 npm。应用运行不需要环境文件、API Key、数据库或后端服务；精确依赖以 package-lock.json 为准。

```bash
npm ci
npm run dev
```

开发服务默认绑定 `127.0.0.1`，打开终端显示的地址。固定使用同一来源查看同一画布，避免切换 localhost、IP 或端口后误以为数据丢失。

| 命令 | 真实行为 |
| --- | --- |
| `npm run dev` | `vite --host 127.0.0.1`，本地开发服务 |
| `npm test` | `vitest run`，执行 `src/**/*.test.ts`，Node 测试环境 |
| `npm run test:watch` | Vitest 监听模式 |
| `npm run build` | 先 `tsc --noEmit`，再 Vite 生产构建到 dist |
| `npm run preview` | 在本机预览已有生产构建 |
| `npm run test:e2e` | Playwright 执行 tests 目录下浏览器用例 |

没有单独 lint 脚本，类型检查已包含在 build。tsconfig 的 include 仅为 src，build 的类型检查不覆盖 tests 目录和根配置文件。配置见 [package.json](../../package.json)、[vite.config.ts](../../vite.config.ts)、[tsconfig.json](../../tsconfig.json)。

## 浏览器验收环境

[playwright.config.ts](../../playwright.config.ts) 默认使用一个 Chromium 项目、一个 worker、零重试、1440×1000 视口。优先读取 `PLAYWRIGHT_CHROME_EXECUTABLE`，否则使用 macOS 已安装的 Google Chrome；都没有时使用 Playwright 浏览器，可按需运行 `npx playwright install chromium` 安装。

Playwright 自动启动 `npm run dev -- --host 127.0.0.1 --port 5173`，测试来源为 `http://localhost:5173`；非 CI 环境允许复用同地址服务。失败时保留截图和 trace，HTML 报告写入 playwright-report。执行前确认复用的是本项目服务。

## 测试地图

| 文件 | 用例数 | 主要覆盖 |
| --- | --- | --- |
| [domain.test.ts](../../src/features/canvas/domain.test.ts) | 10 | 坐标公式、类型化连接、序列化瞬态剔除、资源/版本/关系恢复校验 |
| [canvasStore.test.ts](../../src/features/canvas/store/canvasStore.test.ts) | 16 | 输入快照、失败/重试、重复提交、独立结果、删除、中断、存储异常 |
| [canvas.spec.ts](../../tests/canvas.spec.ts) | 8 | 真实创建/连线、缩放和拖动、任务与结果复用、刷新和异常保护 |
| [workspace.spec.ts](../../tests/workspace.spec.ts) | 2 | 空态入口、指南开关和缩放控件协作；写入失败反馈与重试保存 |
| [spec-acceptance.spec.ts](../../tests/spec-acceptance.spec.ts) | 7 | 选择清除/删除、排队刷新、原快照重试、未知版本、读失败、当前输入重生成、多节点导航 |

单元测试用假定时器推进任务；浏览器测试使用真实鼠标、键盘和端口拖动。[tests/helpers/canvas.ts](../../tests/helpers/canvas.ts) 提供创建基础图、连接端口、读取文档与等待保存等公共操作。

计数反映本知识库代码基线；2026-10-01 的历史验收为 26 项单元、17 项 E2E、TypeScript 检查和构建通过，详见 [验收报告](../../openspec/changes/build-p0-canvas-demo/verification.md)。文档中的历史通过结果不替代每次改动后的实际检查。

2026-10-08 知识库整理时，重新执行 `npm test`，26 项单元测试全部通过；`npm run build` 的 TypeScript 检查和生产构建通过。知识库 83 个 Markdown 相对链接、HTML 脚本语法与 JSON 一致性检查通过，Playwright 检查导航页搜索和证据面板成功且无控制台错误。本次未改应用交互，未重跑 17 项应用 E2E。

## OpenSpec 知识入口

活动变更为 `openspec/changes/build-p0-canvas-demo`：

| 工件 | 内容 |
| --- | --- |
| [proposal.md](../../openspec/changes/build-p0-canvas-demo/proposal.md) | 产品目的、范围与能力划分 |
| [design.md](../../openspec/changes/build-p0-canvas-demo/design.md) | 原始技术设计与取舍 |
| [tasks.md](../../openspec/changes/build-p0-canvas-demo/tasks.md) | 8 项已勾选实施任务 |
| [canvas-editing/spec.md](../../openspec/changes/build-p0-canvas-demo/specs/canvas-editing/spec.md) | 画布操作、连线、删除与坐标规则 |
| [generation-tasks/spec.md](../../openspec/changes/build-p0-canvas-demo/specs/generation-tasks/spec.md) | 任务快照、状态、失败重试、独立结果与复用 |
| [canvas-persistence/spec.md](../../openspec/changes/build-p0-canvas-demo/specs/canvas-persistence/spec.md) | 保存、刷新中断、损坏保护与错误反馈 |
| [verification.md](../../openspec/changes/build-p0-canvas-demo/verification.md) | 13 条需求、15 个场景的实现和验收矩阵 |

原始 design 中的普通 CSS 描述早于 Tailwind 重构，当前架构以源码及 FRONTEND_ARCHITECTURE.md 为准。change 尚未同步到 `openspec/specs` 或归档；这两个目录当前仅有占位文件。已勾选实施任务不等于已归档。

已安装 OpenSpec CLI 时可运行 `openspec validate build-p0-canvas-demo --strict` 检查工件结构；它不执行浏览器功能验收。

## 提交规则

按 [AGENTS.md](../../AGENTS.md) 先检查工作区、差异、remote、当前分支和最近提交。每个完整逻辑变更对应一个明确的 Conventional Commit，只暂存相关文件，验证后提交并及时 push；禁止覆盖用户修改或擅自 force push。涉及交互时运行 E2E；测试缓存、依赖、构建产物和环境密钥不提交。
