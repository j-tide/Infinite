# Infinite 项目知识库

Infinite 是单项目、纯前端的智能图片创作画布 P0 Demo。用户把图片和提示词连接到生成节点，提交模拟异步任务，再把结果图片用于下一次创作。当前没有真实图片模型、后端、账号或上传能力。

知识库依据 2026-10-08 的代码基线 `917b3f1` 整理。功能事实以实现和行为规范为准，历史验收结果保留原日期；后续修改应同时维护对应章节。可用浏览器直接打开 [交互导航页](index.html)，按模块搜索和查看代码证据。

## 章节导航

| 章节 | 解决的问题 |
| --- | --- |
| [项目概览](01-overview.md) | 项目做什么、有哪些功能、哪些能力尚未实现 |
| [架构与源码地图](02-architecture.md) | 应用如何启动、职责如何分层、各功能去哪里改 |
| [领域模型](03-domain-model.md) | 节点、连接、资产、任务和文档如何关联 |
| [核心执行流程](04-flows.md) | 创建、连线、生成、重试、删除、坐标处理如何执行 |
| [保存与恢复](05-persistence.md) | 自动保存时机、恢复校验、异常和数据保护如何工作 |
| [开发与验证](06-development.md) | 如何启动、测试、构建，规范和验收记录在哪里 |
| [维护与扩展](07-maintenance.md) | 常见问题如何定位、改功能要联动哪些文件 |

## 十分钟阅读路径

1. 读项目概览，确认固定 mock、单标签页和本地存储的范围。
2. 沿 `main.tsx → App → AppProviders → WorkspacePage → CanvasSurface` 看页面如何组合。
3. 对照领域模型读 `types.ts` 和 `utils/graph.ts`，分清节点与资产、当前输入与任务快照。
4. 读 `canvasStore.ts` 的 `submit → later → finish` 及 `retry`，理解任务生命周期。
5. 读 `documentPersistence.ts` 和保存与恢复章节，再用单元测试和浏览器用例核对边界。

## 必须先分清的概念

| 概念 | 当前含义 |
| --- | --- |
| 图片节点与资产 | 节点是画布上的表示；资产保存图片引用及元数据。删除节点会清理连接，资产和历史任务仍保留 |
| 当前输入与任务快照 | 当前输入由连线实时推导；任务提交时复制图片资产 ID、提示词文本和比例，之后不随编辑变化 |
| 重试与重新生成 | 重试使用失败或中断任务的原快照创建新任务；“使用当前输入重新生成”重新读取当前连线与参数 |
| 中断与取消 | 当前只有 `interrupted`，没有取消按钮、取消 API 或 `cancelled` 状态 |
| 保存失败与恢复失败 | 保存失败允许重试写入；恢复失败会阻止覆盖原数据，需用户明确新建本地画布 |

## 原有文档与证据

| 来源 | 用途 |
| --- | --- |
| [项目 README](../../README.md) | 操作指南、演示路径和历史运行结果 |
| [前端架构约定](../FRONTEND_ARCHITECTURE.md) | 分层、样式和组件扩展规则 |
| [OpenSpec 三份行为规范](../../openspec/changes/build-p0-canvas-demo/specs/) | 画布编辑、任务生成、持久化的需求与场景 |
| [OpenSpec 验收报告](../../openspec/changes/build-p0-canvas-demo/verification.md) | 13 条需求、15 个场景与测试的对应关系 |
| [AI 使用记录](../AI_USAGE.md) | 开发过程和工具验证记录 |
| [面试编码要求](../../面试编码要求-智能无限画布.md) | 初始题目与交付范围 |

## 知识库维护

修改业务行为时，先更新对应章节中的约束和代码入口，再补充或调整相关测试；只有实际执行检查后才更新验收日期与结果。`index.html` 是本次代码基线的交互摘要，调整摘要时应与 Markdown 章节保持一致。`.project-intake/` 是本地扫描底稿，已加入忽略规则；仓库中的稳定入口是本目录。

## 供后续 AI 分析的上下文

```text
项目：Infinite，单项目纯前端智能画布 P0 Demo。
技术：React 19、TypeScript、React Flow 12.12、Zustand 5、Tailwind CSS 4、Vite 6。
入口：src/main.tsx → src/app/App.tsx → AppProviders → WorkspacePage。
领域：src/features/canvas/types.ts 与 utils/graph.ts。
状态/模拟任务：src/features/canvas/store/canvasStore.ts。
保存/恢复：src/features/canvas/services/documentPersistence.ts。
关键约束：输入类型与每端口单连接；提交冻结输入；重试用原快照；每次成功新建资产和图片节点；删除节点保留历史；坏数据不自动覆盖。
运行：npm ci、npm run dev；验证：npm test、npm run build、npm run test:e2e。
边界：固定本地 SVG mock；localStorage v1；无后端/上传/账号/跨设备同步/多标签并发合并。
先阅读 docs/knowledge-base/README.md 和 AGENTS.md；不要把 README 的未来 HTTP 方案当成现有实现。
```
