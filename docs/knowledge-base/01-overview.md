# 项目概览

[返回知识库](README.md)

## 产品目标

Infinite 通过无限画布表达图片创作流程：图片节点提供参考素材，提示词节点提供文本，生成节点聚合两种输入并展示异步任务；成功后新增图片节点，形成可继续连接的创作结果。首次打开没有预置节点，侧栏提供三种节点创建入口和三张内置素材。

主要实现位于 [canvas feature](../../src/features/canvas/)，页面和工具侧栏位于 [WorkspacePage](../../src/pages/workspace/WorkspacePage.tsx) 与 [workspace feature](../../src/features/workspace/components/)。

## 已实现功能

| 能力 | 用户行为与限制 | 主要入口 |
| --- | --- | --- |
| 节点创建 | 创建图片、提示词、生成节点，或点击内置素材；手动创建寻找空位 | `useCanvasCreation`、`findNodePlacement`、store 的 `add*` |
| 画布编辑 | 标题拖动、平移、缩放、适配视口、选择、取消选择和删除 | `CanvasSurface`、`useCanvasBindings`、`useCanvasControls` |
| 类型化连线 | 图片连生成节点的 image 端口，提示词连 prompt 端口；每种输入仅一条连接 | `isValidConnection`、store 的 `connect` |
| 模拟生成 | 图片及非空提示词就绪后提交；比例支持 `1:1`、`4:3`、`16:9` | `useGeneratorNode`、store 的 `submit` |
| 失败和重试 | 一次性失败开关；失败或中断任务可按原快照重试，也可采用当前输入重新生成 | `retry`、`generate` |
| 独立结果和复用 | 成功新建资产与图片节点，原图保留；结果图片能连到其他生成节点 | store 的 `finish` |
| 自动保存 | 节点、连线、任务和视口写入 localStorage；显示保存状态 | `commit`、`flushSave` |
| 刷新恢复 | 恢复终态；排队或运行任务转为中断；坏数据保护 | `restoreDocument`、`StorageErrorBanner` |

源码证据：[图约束](../../src/features/canvas/utils/graph.ts)、[状态与操作](../../src/features/canvas/store/canvasStore.ts)、[节点视图模型](../../src/features/canvas/hooks/useGeneratorNode.ts)。

## 模拟服务边界

任务在浏览器内约排队 600 ms、生成 1600 ms，由 `setTimeout` 推进。所有成功任务都引用固定 `/samples/result.svg`，并不根据提示词或输入图片执行模型推理。比例只改变任务参数和结果尺寸元数据：`1:1 → 960×960`、`4:3 → 960×720`、`16:9 → 1280×720`。

素材定义见 [constants.ts](../../src/features/canvas/constants.ts)，图片文件见 [public/samples](../../public/samples/)，时间推进与尺寸映射见 [canvasStore.ts](../../src/features/canvas/store/canvasStore.ts) 的 `submit` 和 `finish`。

## 当前范围

| 项目 | 现状 |
| --- | --- |
| 项目与路由 | 一份画布文档、一个工作区页面，没有路由库或多项目管理 |
| 图片输入 | 三张内置 SVG；没有文件上传、粘贴图片或远程素材导入 |
| 服务与身份 | 无后端、真实模型 API、登录和 API Key 配置 |
| 存储 | 浏览器 localStorage，按来源隔离，不支持跨设备同步 |
| 并发 | 一个生成节点只允许一个活动任务；不同生成节点可各自提交；不合并多个标签页的保存 |
| 任务控制 | 无主动取消按钮；删除生成节点会中断活动任务，刷新后恢复为中断 |
| 历史与性能 | 保留资产和任务历史，尚无垃圾回收、配额管理或大型图专项优化 |

README 末尾的 `POST /tasks`、查询、取消、重试等接口属于未来接入方案。当前生成链只调用 store 和定时器；`services/documentPersistence.ts` 是本地文档服务。

## 演示路径

1. 创建一张图片、一个提示词节点和一个生成节点，填写提示词并连线。
2. 编辑提示词，观察生成节点展示的当前输入同步变化。
3. 提交任务，观察排队、运行、成功及新增结果图片。
4. 把结果图片连到另一个生成节点，展示结果复用。
5. 触发一次失败，修改输入后重试，比较原快照与当前输入重新生成的区别。
6. 刷新检查节点与视口恢复；在生成中刷新检查中断；删除源节点检查连线清理和历史保留。

完整操作说明与已有界面截图见 [项目 README](../../README.md)。
