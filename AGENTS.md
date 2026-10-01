# Git 工作规范

本项目远程仓库为 `https://github.com/j-tide/Infinite.git`，默认主分支为 `main`。

## 开始开发前

- 先检查 `git status`、`git diff`、`git remote -v`、`git branch --show-current` 和 `git log --oneline -10`。
- 已有 Git 仓库不得重复初始化；不得覆盖已有历史或擅自更改远程配置。
- 识别已有未提交修改，保留与本次任务无关的修改，不得删除、reset、checkout 覆盖或擅自 stash / drop 用户修改。

## 提交与验证

- 一个独立功能点或完整逻辑变更对应一个 Commit；每完成一个可运行、可验证的变更就及时提交并推送，不等整个需求完成后统一提交，也不过度拆分。
- 使用 Conventional Commits：`<type>(<scope>): <description>`，scope 可在无合适范围时省略。
- type 使用 `feat`、`fix`、`refactor`、`perf`、`docs`、`style`、`test`、`build`、`ci`、`chore`、`revert`，描述必须明确表达实际变更。
- 禁止使用 `update`、`fix bug`、`修改代码`、`优化`、`changes`、`wip`、`test` 等模糊描述。
- 每次提交前检查 `git status`、`git diff`、`git diff --staged`，确认只包含本次功能相关内容，没有调试代码、临时文件、环境文件、敏感信息或明显不应提交的大文件。
- 根据项目实际存在的命令运行相关 lint、类型检查、测试和构建。当前命令：`npm run build`（包含 TypeScript 检查）；没有单独 lint 脚本。
- 优先使用 `git add <相关文件>`，避免机械使用 `git add .` 将无关或未完成修改混入提交。
- `.gitignore` 必须排除环境文件、依赖、构建产物、编辑器临时文件、日志、缓存、临时文件以及密钥、Token、证书等敏感信息；环境示例文件只能包含占位值。

## 推送

- 每次成功 Commit 后及时 `git push`，保持本地与远程同步。
- Push 失败先分析原因；远程有新 Commit 时先检查差异，再选择 pull、rebase 或 merge。
- 未经用户明确授权不得使用 `--force`，不得为推送成功删除或覆盖远程提交。
- 首次初始化提交使用 `chore: initialize project`，推送使用 `git push -u origin main`。

执行顺序：理解任务 → 检查 Git 状态 → 开发一个功能点 → 验证 → 检查 Diff → 暂存相关文件 → Conventional Commit → Push → 继续下一个功能点。
