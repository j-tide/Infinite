# 前端架构与维护约定

本次重构保留 P0 的视觉、交互、生成状态机和版本 1 存储格式。没有增加路由或替换 Zustand；新依赖仅为 Tailwind CSS 与 Vite 集成插件。

## 目录和职责

```text
src/
├── app/
│   ├── App.tsx                    # Provider 和页面入口
│   ├── providers/AppProviders.tsx # React Flow 上下文
│   └── styles/                    # Tailwind 入口、工作区 token、基础规则
├── pages/workspace/
│   └── WorkspacePage.tsx          # 页面组合和指南开关
├── components/
│   ├── layout/WorkspaceLayout.tsx # 顶层网格布局
│   └── ui/                       # Button、IconButton
├── features/
│   ├── canvas/
│   │   ├── components/           # 画布、工具栏、缩放控件、空状态、页脚
│   │   │   └── nodes/            # 三类节点、输入、参数、任务反馈、共享节点结构
│   │   ├── hooks/                # 添加节点、缩放、React Flow 绑定、生成节点视图模型
│   │   ├── store/                # 类型化 Zustand 工厂、操作与任务生命周期
│   │   ├── services/             # 文档序列化、校验和恢复
│   │   ├── utils/                # 图查询、坐标和避让放置
│   │   ├── styles/               # 节点 token、React Flow 覆盖
│   │   ├── types.ts              # 画布、节点、资产、任务、输入模型
│   │   └── constants.ts          # 内置素材、结果路径与存储键
│   └── workspace/
│       └── components/           # 页头、工具/素材侧栏、指南、通知、存储反馈
└── lib/cn.ts                      # 无依赖的 class 组合工具
```

依赖从页面组合流向 feature 和基础 UI；基础 UI 不导入业务 store。画布模型统一来自 `features/canvas/types.ts`，不重复建立全局模型目录。使用直接 import，便于查看实际依赖；没有兼容旧路径的大型 barrel。

`WorkspacePage` 只组合组件、持有指南开关并调用 `useCanvasCreation`。`CanvasSurface` 保持 React Flow 配置和渲染；受控事件与选择清理由 `useCanvasBindings` 提供。`useCanvasControls` 处理缩放与适配，`useCanvasCreation` 将屏幕位置转换为世界坐标并调用纯放置工具。`useGeneratorNode` 提供输入、任务状态、可提交条件和操作，生成节点组合输入展示、参数设置与任务反馈。

`canvasStore` 继续集中管理图编辑、任务、保存状态和计时器，维持同一份 `CanvasDocument` 和事务顺序。序列化与严格恢复校验归于 `documentPersistence`，图查询和连接校验归于纯函数。没有为拆分而引入 store slice 或第二套状态库。

## 样式

使用 [Tailwind 的 Vite 集成](https://tailwindcss.com/docs/installation/using-vite)。主入口为 `app/styles/tailwind.css`，节点 token 从 feature 导入。颜色、圆角、阴影采用语义 token；已有颜色的细微差异保留，以保证原视觉效果。常规布局、响应式、hover、placeholder 和节点状态直接使用 utility classes。

`compact`、`narrow` 分别保持原来的 `width <= 1100px` 和 `width <= 760px`。暂不引入 Preflight：现有浏览器默认的标题、列表、表单和段落排版是视觉基线的一部分。`base.css` 仅承担字体、基础重置、焦点、按钮默认交互和减少动画偏好；没有页面或节点 class。

`react-flow.css` 仅覆盖第三方生成的 DOM/SVG：背景、归属标记、连接线、选中线和端口。数据驱动的图片比例保留动态 inline style。`.node-heading` 是持久化 `dragHandle` 的交互标记；`nodrag`、`nopan`、`nowheel`、端口标记也有明确的 React Flow 语义，不能作为“无用 class”删除。

重复按钮使用 `Button` / `IconButton`，重复节点结构使用 `NodeCard`、`NodeHeading`、`NodeFooter`，重复输入结构在 `GeneratorInputs` 内集中实现。`cn` 只组合 class，不解析冲突；需要覆盖基础组件 utility 时使用明确的 Tailwind `!` 修饰符，避免依赖 class 字符串顺序。

## 增加功能时

- 新页面放在 `pages`，只组合 feature；当前单页不需要 Router，出现实际页面导航后再添加。
- 业务 UI、hooks、模型和纯函数优先留在对应 feature；真正通用的控件再进入 `components/ui`。
- 同一类 UI 重复出现时抽象组件，避免复制长串 utility；新增颜色先确认已有语义 token 能否表达。
- 状态订阅选择具体 action、primitive 或稳定引用。组合 action 对象使用 `useShallow`，避免 Zustand 5 selector 返回不稳定的新对象。
- 保留任务输入快照、失败重试、删除中断、损坏存储不覆盖及视口恢复的现有规则。存储格式变更需显式版本迁移。
- 不按文件行数机械拆分；同时检查组件职责、复杂副作用、重复 UI 和 props 范围。目前最大 UI 文件 99 行，store 205 行，持久化服务 169 行。

## 回归验证

```bash
npm test
npm run build     # 包含 TypeScript 检查
npm run test:e2e
```

项目没有单独 lint 脚本。领域/store 的 26 项单元测试随 feature 迁移并保留原断言；8 项画布 E2E 保留原交互覆盖，新增 2 项工作区 E2E 验证空状态入口、指南开关、缩放按钮和保存写入失败后的重试恢复。测试保存状态使用 `data-testid="save-status"`，避免耦合样式 class。

2026-10-01 在 Node.js 22.22.0 / Chrome 下，26 项单元测试、10 项 E2E、TypeScript 与生产构建全部通过。桌面 1440×1000、紧凑 1000×850、窄屏 740×850 的空状态、桌面三类节点及指南共 5 组截图与重构前逐像素一致。另外对照重构前代码（当前历史中的提交 `072178d`）验证失败、中断、成功及结果图片、选中、排队和运行状态共 6 组场景，截图也逐像素一致；活动状态采用固定 ID/时间与减少动画偏好，以保证对比可重复。浏览器测试和视觉采集产物已加入忽略规则，不混入功能提交。

后续 [OpenSpec 验收](../openspec/changes/build-p0-canvas-demo/verification.md) 保留原行为规范，逐项核对 13 条需求、15 个场景，并补充 7 项浏览器测试。完整 17 项 E2E、26 项单元测试及构建均通过；新测试覆盖键盘/标题删除、排队刷新、历史输入节点删除后的重试、未知版本保护、存储读取失败恢复、当前输入重新生成及多节点坐标隔离。此次验收未修改应用源码。
