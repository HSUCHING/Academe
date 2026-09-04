# Academe 自有内容与上游改动登记

本文档用于保证 Academe 可以持续同步上游 LearnHouse，同时尽量减少合并冲突。

每次新增 Academe 专属文件、修改上游文件或改变部署结构时，必须同步更新本文档，并与相关改动一起提交到 Git。本文档不得记录密码、Token、API Key 或其他敏感值。

## 1. 长期原则

1. `apps/`、`packages/`、根 `Dockerfile` 及其他上游源码应尽量保持与 LearnHouse 一致。
2. Academe 专属配置优先放入独立的 `deploy/`，运行数据集中放入被 Git 忽略的 `runtime-data/`。
3. 定制优先使用环境变量、Docker Compose、反向代理或外挂服务实现。
4. 只有外围配置无法满足需求时才修改上游源码，并保持修改范围最小。
5. 不对无关上游文件执行批量格式化、重命名或顺手重构。
6. 上游同步提交与 Academe 定制提交分开，便于审阅、rebase、cherry-pick 和回退。
7. 每项自有改动都应记录用途、上游影响、冲突风险和回退方法。

## 2. Git 与上游同步约定

- `origin`：Academe 自有 fork。
- `upstream`：LearnHouse 母仓库；若尚未配置，应在首次同步前添加并核对。
- 上游更新应先获取到独立同步分支，在验证后再合入 Academe 工作分支。
- 不把运行时密钥、数据库文件、上传内容、备份或 Tinybird 登录状态提交到 Git。
- 本文档和所有非敏感部署模板必须提交到 Academe fork。

推荐的同步检查顺序：

1. 提交或妥善保存当前 Academe 改动，确保工作树边界清楚。
2. 获取 `upstream` 最新代码，并查看上游变更范围。
3. 优先合并纯上游更新，再逐项重放或核对 Academe 定制。
4. 对照本文档检查所有位于上游目录内的新增或修改文件。
5. 运行构建、健康检查和关键功能验收。
6. 更新本文档中的状态、冲突说明及对应 commit。

## 3. Academe 自建内容目录字典

| 路径 | 类型 | 用途 | Git 策略 | 上游冲突风险 |
|---|---|---|---|---|
| `AGENTS.md` | 自建 Agent 规则 | 强制后续 Agent 遵守上游优先、最小源码修改、完整登记与验证要求 | 提交 | 极低 |
| `ACADEME_CUSTOMIZATIONS.md` | 自建文档 | 记录自有内容、源码修改和上游同步约束 | 提交 | 极低 |
| `ACADEME_INSTALLATION_STATUS.md` | 自建文档 | 记录部署过程、当前状态、验收结果和恢复点 | 提交；不得含密钥 | 极低 |
| `deploy/` | 自建目录 | Academe 生产部署层 | 提交非敏感文件 | 极低 |
| `deploy/docker-compose.yml` | 自建配置 | 从当前源码构建并运行 App、PostgreSQL 和 Redis | 提交 | 极低 |
| `deploy/.env.example` | 自建模板 | 记录运行时变量名和安全示例 | 提交；不得含真实值 | 极低 |
| `deploy/.env` | 本机敏感配置 | 保存正式运行时环境变量和密钥 | 永不提交，必须被忽略 | 无合并风险 |
| `deploy/nginx/academe.conf` | 自建配置 | 保存 Academe 域名的 Nginx 配置源文件 | 提交 | 极低 |
| `deploy/tinybird/` | 自建配置 | 从上游 `events.datasource` 生成临时部署文件，并追加 Academe 最小权限 Token 声明 | 提交配置与生成脚本；永不提交 `.tinyb` 或 `generated/` | 极低 |
| `runtime-data/` | 自建运行目录 | PostgreSQL、Redis、上传内容和备份 | 仅提交内部 `.gitignore`，其余永不提交 | 无合并风险 |
| `/home/dev/.local/share/Trash/files/Academe-data` | 已迁移旧数据副本 | 原外部数据目录的可恢复回收站副本 | 永不提交；确认无需恢复后可清空 | 无合并风险 |

## 4. 位于上游目录内的新增文件

这类文件没有修改现有上游代码，但路径位于上游维护的目录中，未来同步时必须重点核对。

| 文件 | 状态 | 用途 | 冲突风险 | 后续处理 |
|---|---|---|---|---|
| `apps/web/lib/account/profile.ts` | Academe 新增 | 合并公开资料与当前会话中的私有邮箱，并统一判断邮箱是否变化 | 低 | 若上游资料设置页不再依赖公开用户响应中的邮箱，可删除此文件并改用上游实现 |
| `apps/web/tests/account-profile-email.test.mjs` | Academe 新增 | 防止登录后设置页邮箱消失或未变更邮箱被误判 | 低 | 与对应修复一起保留；采用上游等价测试后可删除 |
| `apps/web/tests/language-preference.test.mjs` | Academe 新增 | 防止用户主动选择的界面语言在刷新后被组织默认语言覆盖 | 低 | 与对应修复一起保留；采用上游等价测试后可删除 |

## 5. 已修改的上游源文件

以下文件由 Academe 做了最小修改；同步上游时必须逐项核对。

如果以后必须修改，应按下表登记，并与源码改动在同一提交中更新本节。

| 文件 | 修改原因 | 最小修改摘要 | 冲突风险 | 回退方式 | 首次 commit |
|---|---|---|---|---|---|
| `apps/web/components/Objects/Account/subpages/AccountGeneral.tsx` | 页面误用不含邮箱的 `UserReadPublic` 响应初始化私有设置表单，导致邮箱为空；补填后又被当作邮箱变更并主动退出 | 用会话邮箱补全公开资料；共用真实邮箱变化判断来显示警告和决定是否重新登录 | 中 | 删除 `resolveAccountProfile`/`hasAccountEmailChanged` 的导入和调用，恢复上游实现 | `🐛 Preserve email in account settings` |
| `.dockerignore` | `runtime-data/` 迁入仓库后，Docker 构建上下文读取 PostgreSQL 数据目录时权限失败，并有发送运行数据的风险 | 增加 `/runtime-data/` 排除规则 | 低 | 仅当运行数据不再位于仓库内时删除该规则 | `🐛 Preserve email in account settings` |
| `apps/web/lib/i18n.ts` | 多处语言菜单直接调用 `changeLanguage`，未记录用户主动选择，刷新后会被组织默认语言覆盖 | 用户发起的语言切换默认写入个人选择标记，并允许系统同步显式关闭该行为 | 中 | 恢复单参数函数，并同时恢复 `OrgLanguageSync.tsx` 调用 | `🐛 Remember the selected interface language` |
| `apps/web/components/Contexts/OrgLanguageSync.tsx` | 组织默认语言同步与用户主动切换共用同一函数，需要区分来源 | 传入 `userInitiated: false`，确保组织默认值不会伪装成个人选择 | 低 | 恢复单参数调用，并同时恢复 `i18n.ts` | `🐛 Remember the selected interface language` |

## 6. 新增或修改内容的登记规则

每次变更至少回答以下问题：

1. 这是 Academe 自建内容，还是对上游文件的修改？
2. 能否放到 `deploy/` 或其他外围层，避免进入上游源码目录？
3. 是否需要进入 Git？是否可能包含敏感信息？
4. 上游未来修改相同路径时，冲突概率和处理方式是什么？
5. 删除或回退这项改动会影响哪些服务和数据？
6. 对应的 Git commit 是什么？

## 7. 当前基线

- 基线日期：2026-09-03。
- 当前 fork 代码基线 commit：`7313e8aa`（与 `origin/sci` 一致）。
- 无上游源码修改的 Academe 部署基线 commit：`84faaaa8`。
- 当前分支：`sci`。
- 当前部署使用上游根 `Dockerfile`，未修改已跟踪应用源码。
- 从 `84faaaa8` 之后开始记录 Academe 的必要源码补丁。

本节中的分支和 commit 应在完成下一次上游同步或正式发布后更新。


## 8. 源码补丁比对日志

### `🐛 Preserve email in account settings`

- 根因：`AccountGeneral.tsx` 使用通用 `getUser()` 请求 `/users/id/{id}`；该接口返回保护隐私的 `UserReadPublic`，设计上不包含 `email`。
- 用户影响：重新登录后邮箱输入框为空，表单无法直接保存；用户补填原邮箱后，页面把它误判成邮箱变更并执行退出登录。
- 修复边界：不改变 API 和 `UserReadPublic`，仅在自己的账户设置页从当前认证会话补全邮箱。
- 修改文件：`apps/web/components/Objects/Account/subpages/AccountGeneral.tsx`。
- 新增隔离文件：`apps/web/lib/account/profile.ts`、`apps/web/tests/account-profile-email.test.mjs`。
- 构建配套修改：根 `.dockerignore` 忽略 `/runtime-data/`，防止数据库、Redis、上传和备份数据进入 Docker 构建上下文。
- 回归验证：`bun test tests/account-profile-email.test.mjs` 必须覆盖“公开资料缺少邮箱”和“原邮箱未变化”两种情况。
- 测试范围记录：`docs/operations/2026-09-04-test-inventory.md` 区分目标测试、Web 全套、未执行套件、构建验证和人工验收，避免未来把局部通过误记为全项目通过。
- 上游同步检查：若上游修改了账户设置的数据来源、增加仅本人可用的私有资料接口，或已有等价测试，应先运行本测试；确认上游行为等价后删除本补丁，而不是保留两套合并逻辑。

### `🐛 Remember the selected interface language`

- 根因：通用 `LanguageSwitcher` 会写入 `i18nextLng_userPicked`，但公开主页用户菜单、Dashboard 桌面侧栏和移动菜单直接调用 `changeLanguage()`；这些入口切换成功后没有个人选择标记，刷新时 `OrgLanguageSync` 会重新套用组织默认语言。
- 用户影响：在右上角选择中文后当前页面立即变为中文，但刷新后恢复为组织默认英语。
- 修复边界：不新增数据库字段或后端接口；继续使用 i18next 的浏览器存储，只统一公共切换函数的来源语义。
- 修改文件：`apps/web/lib/i18n.ts`、`apps/web/components/Contexts/OrgLanguageSync.tsx`。
- 新增隔离测试：`apps/web/tests/language-preference.test.mjs`。
- 回归验证：用户调用默认写入 `i18nextLng_userPicked=1`；组织默认语言调用明确使用 `userInitiated: false`，不得写入该标记。
- 上游同步检查：若上游统一了所有语言菜单或提供账户级语言偏好，应先运行本测试；确认刷新持久化和组织默认回退行为等价后删除本补丁。
