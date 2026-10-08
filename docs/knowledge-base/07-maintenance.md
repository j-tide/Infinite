# 维护与扩展

[返回知识库](README.md)

## 常见问题定位

| 现象 | 优先检查 | 解释或处理路径 |
| --- | --- | --- |
| 生成按钮不可用 | `useGeneratorNode.ready/active/retryable` 与最新任务 | 普通生成需要有效图片和非空提示词；原快照重试不要求当前连线存在；活动任务期间不能重复提交 |
| 连不上线 | `graph.isValidConnection` | 检查源节点类型、output、对应输入端口、端口是否已被占用 |
| 修改提示词后重试仍用旧内容 | `retry → submit(previous)` | 符合快照语义；要采用新内容，点“使用当前输入重新生成” |
| 每次结果图看起来一样 | `RESULT_SRC` 与 `finish` | 当前返回固定 mock SVG，提示词不驱动真实模型 |
| 刷新后任务中断 | `restoreDocument` | 浏览器定时器无法跨刷新恢复；按原快照重试会新建任务 |
| 删除图片后任务还能完成 | `removeNodes` 与 task.input | 删除源节点保留资产与任务快照，活动任务无需当前连线 |
| 删除生成节点后没有结果 | `removeNodes`、排队回调、`finish` | 活动任务被中断，迟到回调检查状态和 owner 后退出 |
| 画布刷新后变空 | 来源是否变化、存储原文、错误横幅 | 区分不同来源、无数据与恢复失败；不要先清空 localStorage |
| 显示保存失败 | `flushSave`、storage 适配器 | 内存编辑不等于已保存；检查浏览器权限/配额，使用重试保存 |
| 恢复失败后编辑不能保存 | `recoveryBlocked` | 正在保护原 JSON；保留原文后才决定新建空画布 |
| 重复添加或结果节点重叠 | `placement` 与 `finish` 两条路径 | 手动添加找空位；生成结果按固定偏移摆放，复杂布局仍可能重叠 |
| 新增节点字段刷新后消失 | `restoreNode` | 恢复只重建已知字段，需补校验与恢复逻辑 |

源码入口：[图工具](../../src/features/canvas/utils/graph.ts)、[生成 hook](../../src/features/canvas/hooks/useGeneratorNode.ts)、[store](../../src/features/canvas/store/canvasStore.ts)、[持久化](../../src/features/canvas/services/documentPersistence.ts)。

## 修改功能的联动范围

| 改动 | 必须联动的部分 | 验证重点 |
| --- | --- | --- |
| 新增节点类型 | types、创建 action/hook、侧栏、nodeTypes/节点组件、graph、序列化/恢复 | 创建、拖动、连接、删除、刷新 |
| 新增生成参数 | NodeData、创建默认值、Settings、Task.parameters、submit 快照、恢复校验、结果解释 | 原快照重试、新输入重生成、旧数据兼容 |
| 修改连接规则 | graph、端口、store.connect、恢复边校验 | UI 与恢复规则一致，非法边不会通过导入 |
| 增加素材 | public/samples、SAMPLE_ASSETS、恢复资源白名单 | 资源路径稳定，旧数据仍可打开 |
| 修改任务行为 | TaskStatus、isActiveTask、submit/finish/retry、Feedback、恢复转换 | 非法迁移、重复提交、删除竞争、刷新与重试 |
| 修改存储结构 | version、serialize/restore、错误保护、迁移设计 | 旧文档兼容、坏数据不覆盖、失败可见 |
| 修改画布交互或布局 | React Flow 配置、hooks、共享节点结构、tokens | 多缩放坐标、真实端口拖动、窄视口布局 |

## 容易破坏的约束

- 不混用 nodeId、assetId 和 taskId；删除节点不等于删除资产或任务。
- task.input 和 parameters 是提交快照，不能改成运行时重新读取当前节点。
- 最新任务依赖 tasks 的追加顺序，不能原地按时间或状态重排。
- 同一个生成节点最多一个活动任务，UI 禁用和 store 校验都要保留。
- `finish` 必须检查任务状态和生成节点存在，避免中断后发布结果。
- 恢复阻塞时不得自动写回空文档或“修复”原始存储。
- 新增持久化字段需同时处理序列化、恢复和旧版本行为。
- 新建比例默认 `4:3` 与恢复缺失比例默认 `1:1` 属于不同路径，不应误写成统一规则。

## 未来接入真实生成服务

以下为扩展方向，当前未实现：

1. 把浏览器定时器替换成任务服务适配层，提交冻结输入；通过轮询或服务端事件同步服务端状态。
2. 为提交意图建立稳定幂等标识，网络重发复用同一标识；超时后先查询，避免重复任务和结果。
3. 用服务端条件更新或事务处理完成与取消竞争；前端断线后重查任务，不直接断言失败。
4. 通过 IndexedDB 或对象存储保存上传图片，文档继续引用稳定资产 ID；临时签名 URL 按需获取。
5. 为存储升级建立显式版本迁移；多项目、多标签协作和资产清理分别设计身份、冲突和引用策略。

更完整的未来 HTTP 方案见 [项目 README 的后端追问准备](../../README.md#后端技术追问准备)。实施新需求前先更新相应行为规范，再处理领域类型、store、恢复与测试，保持扩展边界清晰。
