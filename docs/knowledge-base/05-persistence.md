# 保存与恢复

[返回知识库](README.md)

## 存储格式

浏览器 localStorage 的键为 `infinite-canvas:v1`，文档内部 `version` 为 `1`。保存的是 JSON 元数据和内置 `/samples/*.svg` 引用，没有图片二进制、临时 object URL 或远程图片 URL。协议、域名和端口不同会形成不同来源的存储空间，`localhost` 与 `127.0.0.1` 不是同一份画布。

证据：[constants.ts](../../src/features/canvas/constants.ts)、[documentPersistence.ts](../../src/features/canvas/services/documentPersistence.ts)。

## 保存内容与瞬态

`serializeDocument` 对节点保留 `id/type/position/data` 并写入标题拖动手柄；对边保留 ID、两端节点、端口及 type；同时保存 assets、tasks 和 viewport。节点选择、测量和拖拽瞬态不进入 JSON，保存状态、notice 和 recoveryBlocked 也不进入文档。

节点 `data` 在保存时整体写入，恢复时按节点类型重建已知字段。因此新加的 data 字段必须补充恢复逻辑，不能认为序列化后就一定能恢复。

## 自动保存时机

| 时机 | 实现 |
| --- | --- |
| 普通节点、连线、视口变化 | `commit` 重置 140 ms 防抖计时器，随后 `flushSave` |
| 任务提交、状态推进、完成及节点删除 | `commit(next, true)` 立即写入 |
| 页面离开或转为隐藏 | pagehide / visibilitychange 调用 `flushSave` |
| 初始化成功且存储可用 | 立即保存恢复后的文档，将活动任务的中断状态落盘 |
| 用户重试保存 | `retrySave → flushSave` |

保存开始时置 saving；成功 `setItem` 后置 saved；写入失败置 error 并显示“数据尚未保存”。内存状态已变更不代表磁盘保存成功。时序与状态见 [canvasStore.ts](../../src/features/canvas/store/canvasStore.ts) 的 `commit/flushSave`。

## 恢复校验

`restoreDocument(raw, now)` 先完成结构和关系校验，再交出可用文档：

1. JSON 可解析，version 为 1；nodes/edges/tasks 为数组，assets/viewport 为对象。
2. ID 非空且不使用保留字段；节点和任务 ID 不重复；位置、时间、尺寸和视口值为有限数；尺寸及 zoom 大于零。
3. 节点类型、比例、失败标志和字段有效；图片节点引用的资产存在；资产索引与其 ID 一致，资源路径在内置白名单中。
4. 边 ID 不重复，源/目标与端口满足正常连线规则；每个生成输入端口最多一条边。
5. 任务输入资产存在；仍在图中的任务 owner/源节点必须有正确类型；成功任务必须带有效结果资产。
6. 活动任务的生成节点必须存在，且同一节点仅有一个活动任务；带 taskId 的资产须指向匹配的成功任务和结果引用。
7. queued/running 统一改为 interrupted，更新时间更新并提示刷新中断；终态保留。

允许历史任务引用已删除的生成节点或输入节点，因为节点是画布表示，任务输入资产与文本快照才是执行依据。校验并非所有未来业务规则的替代：扩展字段、资源和状态时需显式补充。

## 异常恢复策略

| 情况 | 内存表现 | 原始数据与用户操作 |
| --- | --- | --- |
| 没有保存数据 | 空画布 | 初始化后正常保存 |
| 合法 v1 文档 | 恢复节点、连接、资产、任务和视口 | 活动任务变中断后保存 |
| JSON 损坏、未知版本或关系无效 | 空画布并置 `recoveryBlocked=true`，显示恢复失败 | 不自动覆盖 localStorage 原文；用户点“新建本地画布”才允许替换 |
| localStorage 读取或访问抛错 | 显示保存失败，恢复阻塞标志不因这类错误自动置 true | 重试尝试写入当前内存文档，不会重新读取恢复旧文档 |
| 写入失败 | 当前画布仍可操作，saveStatus=error | “重试保存”再次写入；未成功前不能声称已保存 |

恢复阻塞不会冻结内存画布，用户仍可编辑，但这些修改不会写入原存储。“新建本地画布”会清理任务定时器、清空节点/边/资产/任务、解除阻塞并立即写入空文档，应先保留需要抢救的原始 JSON。

证据：[createCanvasStore/startFresh](../../src/features/canvas/store/canvasStore.ts)、[StorageErrorBanner](../../src/features/workspace/components/StorageErrorBanner.tsx)。

## 演进边界

当前恢复只支持 v1，没有版本迁移。恢复生成节点缺少 ratio 时使用 `1:1`，而新建节点和正常生成/UI 的默认值为 `4:3`；处理历史数据时需分别遵循这些路径。

未来加入上传需要同时设计图片持久化介质和资源校验，不能只把 object URL 放进当前 src。多标签页尚无版本冲突检测或 storage 事件合并；资产与任务不断累积，需要另行设计引用检查与清理策略。
