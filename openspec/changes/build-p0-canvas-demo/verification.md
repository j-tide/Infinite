# 重构后功能验收

日期：2026-10-01。范围：使用本变更的三个行为规格验收前端架构重构，确认 P0 功能、交互、任务语义和已有本地数据仍可用。

## 验收对象与判定方法

- 重构前基线：`072178dab5bca9fbc87558fb266fd80b649b9c5d`，其文件树与原提交 `613ba52` 相同。
- 受验提交：`5f4945c241fb0a13ea72d9222fef589ce1f22922`，包含本轮补充测试；应用源码与原重构提交 `c0cf535` 相同。本轮只补充测试和验收记录，没有修改产品源码。
- 行为依据：`specs/canvas-editing/spec.md`、`specs/generation-tasks/spec.md`、`specs/canvas-persistence/spec.md`，共 **13 项 Requirement、15 项 Scenario**。三个行为规格保持原样。
- `openspec validate --strict` 验证工件结构与规格表达；它不能证明浏览器交互、任务运行或保存恢复正确。功能结论来自源码对照、单元测试及真实浏览器操作。
- 原有 10 条 E2E 保留断言；将画布辅助函数移动至 `tests/helpers/canvas.ts`，供新增验收复用。新增 7 条 E2E 补齐边界证据，见 E11–E17。

静态对照未发现功能回归：`src/store.ts` 移至 `src/features/canvas/store/canvasStore.ts` 后，除 import 路径外实现原样保留；原 `src/domain.ts` 中持久化、连接规则、坐标换算与领域类型按职责分文件，函数行为与版本 1 文档格式保持一致。页面与节点的抽取保留了原事件绑定、输入端口、拖动标记和按钮条件。

## 本轮检查结果

以下结果来自主会话本轮实际运行。环境：Node.js 22.22.0、OpenSpec 1.14.0、Playwright 使用本机 Chrome。

| 检查 | 本轮结果 |
| --- | --- |
| `npm ci` | 通过，使用现有锁文件安装依赖 |
| `npm test` | 26/26 通过，测试 258 ms；领域 10 项、store 16 项（含参数化用例） |
| `npm run build` | 通过；脚本包含 `tsc --noEmit` 与 Vite 生产构建，Vite 构建 1.37 s |
| 原有浏览器验收 | 10/10 通过 |
| `npm run test:e2e`，含本轮补充用例 | 17/17 通过，约 1.1 分钟，无重试 |
| `openspec validate --all --strict --json` | 1 passed、0 failed，`issues: []`；当前唯一活动变更为本变更 |
| OpenSpec doctor / status | `healthy: true` / `isComplete: true`；规划工件齐全且任务清单完成 |
| 独立 lint / typecheck 脚本 | 项目没有独立 lint 或 typecheck 脚本；类型检查由 build 执行 |
| 视觉一致性 | 复用上轮已通过的 11 组逐像素对照证据，详见下文；本轮没有重新采集截图 |

验收通过：13 项需求与 15 个场景均有对应实现和验证路径，26 项单元测试、17 项浏览器测试、类型检查、生产构建与 OpenSpec 严格校验全部通过。在这些规定场景与已验证边界内，未发现重构导致的功能变化。

## 需求、场景与证据矩阵

实现列中的路径除显式写明外，均以 `src/features/canvas/` 为前缀。E、U、D 编号对应后面的测试索引，索引保留实际测试名称和文件位置。

| # | Requirement / Scenario | 关键实现 | 验证证据 |
| --- | --- | --- | --- |
| R01 | **Create and edit typed nodes**；S01 **Build a workspace from the interface** | `store/canvasStore.ts:74,146` 创建独立 ID、类型和世界位置；`hooks/useCanvasCreation.ts:26` 定位；`components/nodes/PromptNode.tsx:22` 编辑文本；`components/nodes/GeneratorSettings.tsx:24` 比例控件；`constants.ts:2` 内置资源 | E01 断言空画布、三种类型、独立 ID、内容、比例及图片；E02 显示实时连接输入 |
| R02 | **Stable canvas navigation**；S02 **Move after zooming**；S03 **Clear selection** | `components/CanvasSurface.tsx:33` 受控视口、指针缩放、三键平移、零拖动阈值；`hooks/useCanvasBindings.ts:17` 同时清除节点与连接选择；`hooks/useCanvasControls.ts:15` 底部控件 | E06 校验指针锚定误差小于 2 px、不同缩放下世界位移、平移/刷新稳定；E09 控件与空状态；E11 补连接取消选择；E17 补多节点位置不受目标拖动影响；D03 坐标换算 |
| R03 | **Directed typed input connections**；S04 **Connect and update inputs**；S05 **Remove a connection** | `utils/graph.ts:17,33` 查询 live 输入并校验 source/target/handle/单输入；`store/canvasStore.ts:162,167` 拒绝无效连接及删除；`components/nodes/GeneratorInputs.tsx:53` 显示连接内容 | E02 真正拖端口、改提示词、错类型拒绝、删边源节点仍在；E11 补键盘删除后输入消失；D01、D02、U07 覆盖 live 内容、自连接、重复及占用输入 |
| R04 | **Safe node deletion**；S06 **Delete a connected node** | `store/canvasStore.ts:64` 清除所有关联边、保留资产与任务快照；`components/nodes/NodeHeading.tsx:37` 独立删除入口 | E02 删除源节点并清理边；E11 补标题按钮与 Backspace；E13 补删除两个输入、刷新、再按旧快照成功重试；U04、U06、D06 核验历史独立于节点 |
| R05 | **Runnable and explainable demo**；S07 **Run a submitted checkout** | `package.json:9` 启动、测试、构建命令；`package-lock.json`；`README.md:5,46,92` 启动、演示、依赖与限制；`docs/AI_USAGE.md:1` 明确为真实对话摘要；本地 `public/samples/` 无外部凭证 | 本轮 `npm ci`、build 与原有 E01–E10；E01–E08 实际操作覆盖 README 的创建、生成、复用、刷新路径 |
| R06 | **Versioned local save and restore**；S08 **Reload a completed canvas** | `services/documentPersistence.ts:7,107` 序列化与引用校验；`store/canvasStore.ts:44,179,198` 初始化、防抖及离开保存；`components/CanvasSurface.tsx:33` 直接使用恢复视口，无自动 fitView | E05 对照节点、边、资产、任务并验证图片加载；E06 对照恢复视口；U08 完整文档 roundtrip；D04 排除选择、测量、拖动等瞬态 |
| R07 | **Recover unfinished tasks as interrupted**；S09 **Refresh during generation** | `services/documentPersistence.ts:153,164` queued/running 转 interrupted、保留快照及原因；`store/canvasStore.ts:175,197` retry 与中断落盘；`hooks/useGeneratorNode.ts:12` 和 `components/nodes/GenerationFeedback.tsx:59` 可见反馈 | E07 覆盖运行中刷新；E12 补排队时刷新、编辑后仍按旧快照 UI 重试；U09、D05 同时覆盖 queued/running，不留 active 任务 |
| R08 | **Persistence failures are observable**；S10 **Invalid saved data** | `store/canvasStore.ts:44,56,179,189` 原数据保留、阻止自动覆盖、异常状态、显式新建/重试；`services/documentPersistence.ts:22,107` 版本、字段、有限坐标、路径与关系校验；`src/features/workspace/components/StorageErrorBanner.tsx:15` 与 `src/features/workspace/components/WorkspaceHeader.tsx:47` 可见原因及保存状态 | E08 损坏 JSON 原值保护；E10 写异常与保存重试；E14 补未知版本跨刷新保护；E15 补读异常可见反馈；U10–U12、D07–D09 检查存储异常及非法引用 |
| R09 | **Traceable asynchronous lifecycle**；S11 **Run with connected inputs** | `store/canvasStore.ts:90` 新 task ID、输入/参数快照、600 ms 排队和 1600 ms 运行；`components/nodes/GenerationFeedback.tsx:5` 生命周期标签与 task 引用；`hooks/useGeneratorNode.ts:14` 缺输入条件 | E01 缺输入不能提交且有说明；E03 真正经历排队、运行、成功；U01 时钟边界和独立结果；U02 缺输入；U03 后续编辑不改已提交快照 |
| R10 | **Prevent duplicate active submissions**；S12 **Repeated click** | `store/canvasStore.ts:94` store 重复保护；`hooks/useGeneratorNode.ts:22` active 禁用；`components/CanvasToolbar.tsx:13` 活动任务提示 | U02 queued/running 状态重复调用均只保留一任务；E03 的实际生成按钮在 active 时禁用 |
| R11 | **Reproducible failure and retry**；S13 **Fail and retry** | `store/canvasStore.ts:101,110,114,130,175` 保留旧任务，consume failNext，旧快照新 ID retry；`hooks/useGeneratorNode.ts:30` 保留重试与采用当前输入两个入口 | E04 失败原因、开关消耗、编辑后旧快照重试；U04 删除输入后旧快照仍成功；E13 补跨刷新旧快照；E16 补采用当前输入时产生新快照，原失败任务不变 |
| R12 | **Independent reusable results**；S14 **Use a result as input** | `store/canvasStore.ts:134` fresh asset/result node/task 引用，原图不覆盖；`utils/graph.ts:33` 结果 image 可再连接；`components/nodes/ImageNode.tsx:38` 明确 Mock 与可复用 | E03 真正将生成结果连接到第二生成节点、输入图片显示、原图仍在；U01 多次成功产生不同 task/asset/node ID |
| R13 | **Completion after generator deletion**；S15 **Remove a running generator** | `store/canvasStore.ts:64` active task 中断；`:119,129` 迟到回调检查 task 状态和 owner；`:190` fresh 清除 timers | E07 运行时删除并等待，结果未出现、图边清理；U05 同时覆盖排队/运行删除；U13 显式清空画布也阻止旧 timers 产生结果 |

## 浏览器证据索引

这些测试使用真实按钮、表单、键盘、鼠标拖动与端口连接，通过已保存文档核验领域结果。E12 为捕获 600 ms 排队窗口使用 Playwright clock；它仍通过页面控件提交、刷新和重试，没有直接调用 store API。

| 编号 | 文件与测试名称 |
| --- | --- |
| E01 | `tests/canvas.spec.ts:9` — 从空画布创建三类节点，编辑提示词和比例，缺少输入不能提交 |
| E02 | `tests/canvas.spec.ts:27` — 真实端口连线读取实时输入，拒绝错误类型，删除连接和节点清理引用 |
| E03 | `tests/canvas.spec.ts:50` — 异步成功创建独立资产和结果，结果可真实连接下一生成节点 |
| E04 | `tests/canvas.spec.ts:72` — 一次性失败保留快照，编辑画布后重试仍使用原输入及参数 |
| E05 | `tests/canvas.spec.ts:96` — 终态、节点、资源和连线在刷新后保持，结果图片可加载 |
| E06 | `tests/canvas.spec.ts:110` — 鼠标锚定缩放、按比例拖动、平移、空白取消选择及视口恢复 |
| E07 | `tests/canvas.spec.ts:164` — 生成中刷新变为可重试中断，运行中删除生成节点不会出现孤立结果 |
| E08 | `tests/canvas.spec.ts:185` — 损坏存储有可见警告并保留原值，明确新建后才能替换 |
| E09 | `tests/workspace.spec.ts:6` — 空状态入口、指南开关和缩放控件在工作区拆分后仍可协同操作 |
| E10 | `tests/workspace.spec.ts:46` — 存储写入失败显示提示，恢复存储后重试保存保留未落盘的编辑 |
| E11 | `tests/spec-acceptance.spec.ts:23` — canvas-editing：空白取消连线选择、键盘删除连线和节点、标题删除清理引用 |
| E12 | `tests/spec-acceptance.spec.ts:54` — canvas-persistence：排队时刷新保留原快照并允许 UI 重试 |
| E13 | `tests/spec-acceptance.spec.ts:84` — generation-tasks：删除输入节点并刷新后，历史快照与资产仍可重试成功 |
| E14 | `tests/spec-acceptance.spec.ts:113` — canvas-persistence：不支持的版本保持原值，明确新建后才替换 |
| E15 | `tests/spec-acceptance.spec.ts:137` — canvas-persistence：本地存储读取失败可见，恢复读取后显式重试保存 |
| E16 | `tests/spec-acceptance.spec.ts:163` — generation-tasks：使用当前输入重新生成创建新快照，不复用失败快照 |
| E17 | `tests/spec-acceptance.spec.ts:187` — canvas-editing：多节点缩放与拖动只改变目标节点的世界位置 |

## 单元证据索引

U 项位于 `src/features/canvas/store/canvasStore.test.ts`；D 项位于 `src/features/canvas/domain.test.ts`。参数化用例分别验证各输入，不将同一测试声明误计为一个实际运行 case。

| 编号 | 行与实际测试名称 |
| --- | --- |
| U01 | 53 — shows queued for 600ms and running for 1600ms before creating independent results |
| U02 | 87 — rejects missing inputs and prevents duplicate submission in queued and running states |
| U03 | 103 — snapshots inputs and parameters before live prompt and ratio changes |
| U04 | 116 — consumes one-shot failure and retries the original snapshot even after source edits and deletion |
| U05 | 140 — interrupts generator deletion at %ims and prevents stale result callbacks；0 / 600 ms |
| U06 | 153 — cleans deleted source edges while retaining task history and its input asset |
| U07 | 167 — rejects invalid connections, removes selected edges and cleans selection-deleted nodes |
| U08 | 188 — debounces editing saves and restores positions, viewport and terminal task results |
| U09 | 210 — refreshes unfinished work at %ims into a preserved retryable interruption；0 / 600 ms |
| U10 | 230 — shows a storage write failure and retries without losing the working canvas |
| U11 | 248 — reports unavailable storage reads without falsely claiming restoration succeeded |
| U12 | 258 — preserves invalid saved data until an explicit fresh start: %s；损坏 JSON / version 2 |
| U13 | 276 — clears pending generation timers when explicitly starting a fresh canvas |
| D01 | 32 — resolves current connected content and reads the latest independent task |
| D02 | 44 — accepts directed typed inputs and rejects wrong, self, duplicate or occupied handles |
| D03 | 60 — converts canvas positions to world coordinates at any scale |
| D04 | 66 — roundtrips world positions, viewport and references without transient selection or measurement |
| D05 | 81 — restores a %s task as interrupted while preserving its snapshot；queued / running |
| D06 | 91 — retains terminal tasks and assets when their visual nodes were deleted |
| D07 | 101 — rejects corrupt JSON, unknown versions and nonfinite coordinates |
| D08 | 109 — rejects missing assets, dangling or duplicate edges and invalid historical results |
| D09 | 124 — rejects external asset paths and active tasks with no owning generator |

## 视觉证据与技术决策演进

前一轮重构已对照原 `613ba52` 完成 11 组逐像素一致性检查，记录见 `docs/FRONTEND_ARCHITECTURE.md:69` 和 `README.md:115`：桌面 1440×1000、紧凑 1000×850、窄屏 740×850 空状态，桌面三类节点及指南，以及失败、中断、成功与结果图片、选中、排队、运行状态。活动状态固定 ID/时间并使用减少动画偏好，以便重复对照。

本轮复用这份先前证据：当前重构后基线与原 `c0cf535` 的 `src/` 无差异，源码 tree 为 `3458c966c80d69b50636dbc77e7a4ad14d95a50b`，补充测试也未修改源码。主会话复读先前 11 组报告，均为 0 changed pixels、0 missing、0 added。这不代表本轮重新截图或重新执行 11 组像素比较；运行时新增证据由上述 17 条 E2E 提供。受忽略规则保护的临时视觉采集产物没有作为新截图提交。

原 `design.md:17` 的 ordinary CSS 是 P0 初建时的技术选择。已授权的架构重构将常规样式迁至 Tailwind utility classes 与设计 token，保留必要原生基础规则和 React Flow 覆盖。Provider、React Flow、Zustand、版本 1 localStorage 数据及所有行为要求不变。这是技术取舍演进，不能据此删除或弱化既有行为规格。

本次仅验收；不修改三个 behavior specs，不将本变更归档，不自动同步到主规格。

## 可复现步骤与边界

在仓库根目录执行：

```sh
npm ci
npm test
npm run build
npm run test:e2e
openspec validate --all --strict --json
```

浏览器配置优先使用本机 Chrome，或按 README 安装 Chromium / 设置 `PLAYWRIGHT_CHROME_EXECUTABLE`。E2E 自动启动本地 Vite。可用 `npx playwright test tests/spec-acceptance.spec.ts` 单独复核新增边界；完整功能结论使用全部 17 项结果。Playwright 报告与失败产物位于项目忽略的 `playwright-report/`、`test-results/`。

本验收对应规格内的单项目、本地内置资源、固定 mock 输出与单标签页范围。它没有扩大为真实生成服务、上传、跨标签页合并或未知版本数据迁移验证；这些原有范围限制仍成立。
