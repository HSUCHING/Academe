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
| `docs/operations/2026-09-05-email-production-hardening-backlog.md` | 自建运维文档 | 记录邮件身份、投递安全和兼容性的未实施任务、优先级与验收标准 | 提交；不得含密钥 | 极低 |
| `deploy/` | 自建目录 | Academe 生产部署层 | 提交非敏感文件 | 极低 |
| `deploy/docker-compose.yml` | 自建配置 | 从当前源码构建并运行 App、PostgreSQL 和 Redis | 提交 | 极低 |
| `deploy/.env.example` | 自建模板 | 记录运行时变量名和安全示例 | 提交；不得含真实值 | 极低 |
| `deploy/.env` | 本机敏感配置 | 保存正式运行时环境变量和密钥 | 永不提交，必须被忽略 | 无合并风险 |
| `deploy/nginx/academe.conf` | 自建配置 | 保存 Academe 域名的 Nginx 配置源文件 | 提交 | 极低 |
| `deploy/tinybird/` | 自建配置 | 从上游 `events.datasource` 生成临时部署文件，并追加 Academe 最小权限 Token 声明 | 提交配置与生成脚本；永不提交 `.tinyb` 或 `generated/` | 极低 |
| `deploy/sysctl/` | 自建宿主机配置 | 保存 Redis 所需的可审计 sysctl 配置源；安装目标为 `/etc/sysctl.d/99-academe-redis.conf` | 提交 | 极低 |
| `deploy/backup/` | 自建备份工具 | 生成并校验 PostgreSQL/内容本机备份，保存每日 systemd 调度源文件 | 提交脚本、测试和单元；运行备份永不提交 | 极低 |
| `runtime-data/` | 自建运行目录 | PostgreSQL、Redis、上传内容和备份 | 仅提交内部 `.gitignore`，其余永不提交 | 无合并风险 |
| `/home/dev/.local/share/Trash/files/Academe-data` | 已迁移旧数据副本 | 原外部数据目录的可恢复回收站副本 | 永不提交；确认无需恢复后可清空 | 无合并风险 |

## 4. 位于上游目录内的新增文件

这类文件没有修改现有上游代码，但路径位于上游维护的目录中，未来同步时必须重点核对。

| 文件 | 状态 | 用途 | 冲突风险 | 后续处理 |
|---|---|---|---|---|
| `apps/web/lib/account/profile.ts` | Academe 新增 | 合并公开资料与当前会话中的私有邮箱，并统一判断邮箱是否变化 | 低 | 若上游资料设置页不再依赖公开用户响应中的邮箱，可删除此文件并改用上游实现 |
| `apps/web/tests/account-profile-email.test.mjs` | Academe 新增 | 防止登录后设置页邮箱消失或未变更邮箱被误判 | 低 | 与对应修复一起保留；采用上游等价测试后可删除 |
| `apps/web/tests/language-preference.test.mjs` | Academe 新增 | 防止用户主动选择的界面语言在刷新后被组织默认语言覆盖 | 低 | 与对应修复一起保留；采用上游等价测试后可删除 |
| `apps/web/components/Auth/AcademeAuthVisual.tsx` | Academe 新增 | 封装登录与注册品牌区域的 WebGL 动态背景，不依赖认证业务逻辑 | 低 | 若上游提供可配置的等价动画组件，可删除并切换到上游实现 |
| `apps/web/tests/auth-visual.test.mjs` | Academe 新增 | 验证动画画布接入时不会替换现有组织品牌内容 | 低 | 与动画组件一起保留；采用上游等价测试后可删除 |
| `apps/web/public/academe-brand/` | Academe 新增 | 集中保存 Academe 的 SVG、PNG 与 favicon 品牌资源，作为全站品牌资源的单一来源 | 极低 | 保留规范命名的原始资产；公共兼容入口仅引用本目录 |
| `apps/web/tests/academe-branding.test.mjs` | Academe 新增 | 验证页面水印显示 Academe 品牌、使用站内链接并加载独立品牌资源 | 低 | 与水印品牌补丁一起保留；上游提供全局品牌配置后可删除 |
| `apps/web/tests/academe-email-branding.test.mjs` | Academe 新增 | 验证前端服务器邮件的 Logo、主题、正文、按钮与默认发件人使用 Academe | 低 | 与邮件品牌补丁一起保留；上游提供平台品牌配置后可删除 |
| `apps/api/src/services/email/academe_brand.py` | Academe 新增 | 集中保存 API 邮件的 Academe 默认 Logo HTML 与站内帮助地址 | 极低 | 上游提供邮件品牌配置后删除，并移除 `emails.py` 的最小接入点 |
| `apps/api/src/tests/services/test_academe_email_brand.py` | Academe 新增 | 验证独立品牌常量及 API 欢迎邮件实际使用 Academe Logo 与站内链接 | 低 | 与 API 邮件品牌适配器一起保留或回退 |

## 5. 已修改的上游源文件

以下文件由 Academe 做了最小修改；同步上游时必须逐项核对。

如果以后必须修改，应按下表登记，并与源码改动在同一提交中更新本节。

| 文件 | 修改原因 | 最小修改摘要 | 冲突风险 | 回退方式 | 首次 commit |
|---|---|---|---|---|---|
| `apps/web/components/Objects/Account/subpages/AccountGeneral.tsx` | 页面误用不含邮箱的 `UserReadPublic` 响应初始化私有设置表单，导致邮箱为空；补填后又被当作邮箱变更并主动退出 | 用会话邮箱补全公开资料；共用真实邮箱变化判断来显示警告和决定是否重新登录 | 中 | 删除 `resolveAccountProfile`/`hasAccountEmailChanged` 的导入和调用，恢复上游实现 | `🐛 Preserve email in account settings` |
| `.dockerignore` | `runtime-data/` 迁入仓库后，Docker 构建上下文读取 PostgreSQL 数据目录时权限失败，并有发送运行数据的风险 | 增加 `/runtime-data/` 排除规则 | 低 | 仅当运行数据不再位于仓库内时删除该规则 | `🐛 Preserve email in account settings` |
| `apps/web/lib/i18n.ts` | 多处语言菜单直接调用 `changeLanguage`，未记录用户主动选择，刷新后会被组织默认语言覆盖 | 用户发起的语言切换默认写入个人选择标记，并允许系统同步显式关闭该行为 | 中 | 恢复单参数函数，并同时恢复 `OrgLanguageSync.tsx` 调用 | `🐛 Remember the selected interface language` |
| `apps/web/components/Contexts/OrgLanguageSync.tsx` | 组织默认语言同步与用户主动切换共用同一函数，需要区分来源 | 传入 `userInitiated: false`，确保组织默认值不会伪装成个人选择 | 低 | 恢复单参数调用，并同时恢复 `i18n.ts` | `🐛 Remember the selected interface language` |
| `apps/web/components/Auth/AuthBrandingPanel.tsx` | 默认认证品牌背景需要接入 Academe 独立动画并简化中央品牌展示；认证路由与表单逻辑均不应改变 | 接入独立动画组件，以大字号 `Academe` 流光标题替代中央组织 Logo 框和普通组织名称；自定义图片与 Unsplash 背景继续使用原逻辑 | 低 | 恢复中央 Logo 与组织名称 JSX，并删除 Academe 视觉组件接入 | `✨ Add animated authentication visual` |
| `apps/web/components/Footers/LegalFooters.tsx` | 登录注册协议文案仍从多语言资源显示 LearnHouse 品牌 | 仅在共享认证页脚出口将 LearnHouse 规范为 Academe；条款与隐私链接逻辑不变 | 低 | 删除 `termsText` 规范化并恢复原内联翻译调用 | `🎨 Apply Academe branding across site and email` |
| `apps/web/components/Objects/Watermark.tsx` | LearnHouse 水印与外链不符合 Academe 品牌 | 仅替换为 `Powered by Academe`、Academe 图标和站内首页链接；保留原显示权限与套餐判断 | 低 | 恢复原文案、`lrn-text.svg` 和 LearnHouse 外链 | `🎨 Apply Academe branding across site and email` |
| `apps/web/public/lrn.svg`、`lrn-dash.svg`、`lrn-text.svg`、`favicon.ico` | 多个上游页面硬编码旧公共资源路径，逐页接入会扩大冲突面 | 保留旧 URL 作为兼容入口，统一映射到 `academe-brand/` 内的 Academe 资产 | 低 | 恢复上游四个资源文件；无需回退页面源码 | `🎨 Apply Academe branding across site and email` |
| `apps/api/src/services/email/translations.py`、`sender.py` | 多语言邮件正文、主题、提醒邮件与默认发件人仍显示 LearnHouse | 在唯一翻译出口统一品牌名，并把缺少部署配置时的内置发件人回退值改为 Academe；不批量修改各语言字典 | 低 | 删除翻译出口的品牌归一化并恢复默认发件人常量 | `🎨 Apply Academe branding across site and email` |
| `apps/api/src/tests/services/test_email_translations.py`、`test_email_utils_service.py`、`test_emails_service.py` | 防止邮件品牌名或默认发件人在上游同步后回退 | 增加跨语言、生命周期提醒、完整邮件渲染与默认发件人回归断言；保留显式自定义发件人能力 | 低 | 与邮件品牌补丁一并回退 | `🎨 Apply Academe branding across site and email` |
| `apps/api/src/services/users/emails.py` | API 邮件默认 Logo 与帮助回退仍指向 LearnHouse | 导入 Academe 独立常量、替换帮助 URL 常量，并在旧 SVG 定义结束后覆盖默认 Logo；保留上游 SVG 原文 | 低 | 删除导入、恢复 Academy URL，并删除默认 Logo 覆盖两行 | `🎨 Apply Academe branding across site and email` |
| `apps/web/components/Emails/LearnHouseEmail.tsx`、`services/emails/resend.ts`、`transactional.ts`、`services/billing/emails.ts` | 前端服务器邮件通道仍输出 LearnHouse Logo、文案、链接与默认发件人 | 仅替换收件人可见品牌和欢迎按钮目标；保留组件/API 名及现有发信地址 | 中 | 恢复 7 处显示字符串与 Logo URL | `🎨 Apply Academe branding across site and email` |

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
- 当前部署继续使用未修改的上游根 `Dockerfile`；应用源码补丁全部登记在第 5、8 节。
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

### `✨ Add animated authentication visual`

- 目标：参考 Aurelis `sci` 分支的动态认证背景，美化 Academe 登录与注册页的品牌区域。
- 外围方案评估：该效果必须渲染在现有认证 React layout 内，Docker、反向代理和环境变量无法插入页面组件；因此保留一个最小上游接入点。
- 修复边界：不修改登录、注册、验证码、表单提交、OAuth、会话或后端认证逻辑；组织自定义图片和 Unsplash 背景保持不变。
- 修改文件：`apps/web/components/Auth/AuthBrandingPanel.tsx`，接入独立组件，并以大字号 `Academe` 流光标题替代中央组织 Logo 圆角框和普通组织名称。
- 新增隔离文件：`apps/web/components/Auth/AcademeAuthVisual.tsx`、`apps/web/tests/auth-visual.test.mjs`。
- 动画行为：使用 WebGL2 渲染动态背景，并为固定文字 `Academe` 添加循环高光扫过效果；不支持 WebGL2 时保留 CSS 渐变；系统启用“减少动态效果”时背景只绘制静态帧且标题停止扫光。
- 可见性修正：文字颜色与 `-webkit-text-fill-color` 必须保持透明，否则不透明字形会遮住背后的移动渐变，使扫光动画存在但肉眼不可见。
- 最低亮度修正：为文字增加 45% 白色恒定底色，高光带移出字形时仍保持可见，扫过时再提升至峰值亮度。
- 回归验证：`bun test tests/auth-visual.test.mjs` 必须证明动画画布与 `Academe` 流光标题被渲染，旧组织名称和中央组织 Logo 图片不再输出；生产构建必须通过。
- 冲突风险：低。现有文件只有一个小型接入点，主要实现位于 Academe 独立文件。
- 回退方式：移除品牌面板中的导入、启用条件和 JSX 分支，再删除两个隔离文件。
- 上游同步检查：若上游提供可配置的等价认证动画，应验证自定义背景、WebGL 降级和减少动态效果后，删除 Academe 组件及接入点。

### `🎨 Apply Academe site branding`

- 目标：使用用户提供的莲花渐变图标统一 Academe 网站品牌，并将可见水印改为 `Powered by Academe`。
- 最小改动策略：不逐一修改所有引用 `/lrn*.svg` 的页面；将规范化原始资产集中到 `apps/web/public/academe-brand/`，旧公共 URL 只保留为兼容入口。
- 自有资产：`academe-logo.svg`、`academe-logo-2048.png`、`academe-favicon.ico`。
- 修改文件：三个旧 SVG 公共入口、根 favicon，以及 `apps/web/components/Objects/Watermark.tsx`；水印继续沿用上游的显示权限和套餐逻辑。
- 主页尺寸适配：`apps/web/components/Objects/Menus/OrgMenu.tsx` 原按横向字标设置 `133×40` 且高度自适应；方形莲花图标因此膨胀并溢出导航栏，现仅将该回退 Logo 固定为 `40×40` 并使用 `object-contain`。
- 缓存适配：该导航 Logo 使用 `unoptimized` 直接请求 `/lrn-text.svg`；否则 `next/image` 的旧优化 URL 可能继续命中浏览器缓存并显示替换前的 LearnHouse 图像。
- 明确不修改：组织 Logo/Favicon 上传接口及 SVG 安全限制、认证逻辑、后台 API、数据库和套餐判断。
- 认证协议品牌：共享 `AuthFooter` 在显示出口将翻译中的 LearnHouse 规范为 Academe，不批量修改所有语言文件，不改变条款与隐私链接目标。
- 回归验证：水印必须显示 `Powered by Academe`、链接到 `/` 并通过公开白名单中的 `/lrn.svg` 兼容入口加载集中保存的 Academe 图标；生产构建必须能解析所有兼容资源。
- 冲突风险：低。只有一个 React 源文件的小型展示修改；旧资源路径即使随上游变化，也可直接重新建立兼容映射。
- 回退方式：恢复四个上游公共资源和原 Watermark 内容，删除 `academe-brand/` 及对应测试。
- 上游同步检查：若上游新增全局平台品牌配置，应迁移到上游配置并删除兼容入口与 Watermark 补丁。

### `✉️ Normalize Academe email branding`

- 根因：API 事务邮件和生命周期提醒的 20 种语言资源，以及 Web 服务器发送的欢迎/账单邮件，仍包含 LearnHouse；缺少部署级发件人配置时，代码内置回退名称也为 LearnHouse。
- 用户影响：邮件主题、正文、页脚或发件人可能暴露旧品牌，与网站 Academe 品牌不一致。
- 最小改动策略：所有邮件翻译最终都经过 `t()`，因此只在该唯一出口把品牌名规范为 Academe，不改动数千行上游翻译字典；默认发件人只改一个常量。
- 动态值保护：品牌规范化在模板格式化之前执行，避免把用户、课程或机构真实名称中的 `LearnHouse` 错误改成 Academe；生产逻辑只调整两行顺序。
- 修改文件：`apps/api/src/services/email/translations.py`、`apps/api/src/services/email/sender.py`；`apps/web/components/Emails/LearnHouseEmail.tsx`、`apps/web/services/emails/resend.ts`、`transactional.ts`、`apps/web/services/billing/emails.ts`。
- 新增隔离测试：`apps/web/tests/academe-email-branding.test.mjs`。
- 上游测试调整：`apps/api/src/tests/services/test_email_translations.py`、`test_email_utils_service.py`、`test_emails_service.py`。
- 明确不修改：`get_learnhouse_config`、`LEARNHOUSE_*` 环境变量、Redis key、退订 token salt 等兼容性技术标识；组织或部署显式配置的自定义发件人仍原样生效。
- Web 邮件通道：共享邮件 Logo 改为 Academe 公共 Logo，底部署名、欢迎/账单文案和默认显示发件人改为 Academe，欢迎按钮指向 Academe 主页；旧发信邮箱地址作为投递技术配置保留。
- API 邮件收尾：新增独立 `academe_brand.py`；`emails.py` 仅导入两个常量、把 Academy 回退地址指向 Academe，并在旧上游 SVG 定义结束后覆盖默认 Logo。保留旧 SVG 原文，避免形成大段删除 diff。
- 回归验证：跨语言事务邮件与生命周期提醒的固定品牌不得包含 LearnHouse，动态值必须保持原文；无发件人配置时必须回退为 `Academe <address>`；完整邮件相关测试 634/634 通过。
- 当前验证（2026-09-05）：API 邮件目标测试 113/113 通过；Web 品牌目标测试 7/7 通过；生产容器健康；Resend 品牌测试邮件状态为 delivered。
- 冲突风险：API 侧低，Web 邮件侧中；API 生产代码仅两个集中位置，Web 邮件仅替换 7 处展示值，不重命名组件或接口。
- 回退方式：恢复翻译出口的直接返回值和 `DEFAULT_SENDER_NAME` 常量，并回退对应测试。

### `🔧 Tune Redis host memory policy`

- 根因：Redis 启动日志提示宿主机未启用 `vm.overcommit_memory=1`，这会增加后台保存或复制在内存压力下失败的风险。
- 最小改动策略：不修改任何上游应用源码或 Compose 服务定义；只在 Academe 自建的 `deploy/sysctl/` 保存配置源，并安装到宿主机标准 sysctl 目录。
- 新增隔离文件：`deploy/sysctl/99-academe-redis.conf`，唯一设置为 `vm.overcommit_memory = 1`。
- 宿主机状态：配置安装于 `/etc/sysctl.d/99-academe-redis.conf`，属主 `root:root`、权限 `0644`，并已应用到当前内核。
- 验证结果（2026-09-05）：当前内核值为 `1`；仓库配置与宿主机配置逐字节一致；Redis 为 `healthy`，重启次数为 0，近期日志没有相关异常。
- 冲突风险：极低。全部仓库改动位于 Academe 自建部署目录和文档，不接触上游源码。
- 回退方式：删除宿主机 `/etc/sysctl.d/99-academe-redis.conf`，按服务器原策略恢复内核值；如不再需要可同时删除仓库配置源。回退前应评估 Redis 后台保存风险。
- 上游同步检查：该配置属于宿主机运维层，拉取上游代码时正常保留；仅当上游部署文档或基础设施明确提供等价配置时再去重。

### `💾 Automate verified production backups`

- 目标：为 PostgreSQL 和上传内容建立每日、可验证的本机备份，降低单机故障和误操作造成的数据损失。
- 最小改动策略：全部实现位于 Academe 自建 `deploy/backup/` 与文档，不修改 `apps/`、根 Dockerfile 或 Compose。
- 新增隔离文件：`backup.sh`、`verify.sh`、三个 Shell 合同测试、systemd service/timer 和精确安装脚本。
- 安全边界：不读取或归档 `deploy/.env`；数据库凭据只在 PostgreSQL 容器内部使用；content 只读挂载；新备份失败时不清理历史成功备份。
- 运营策略：每日 03:15、随机延迟最多 15 分钟，本机保留 14 天；每周状态/容量检查、每月离线校验、每季度恢复演练。
- 备份验证（2026-09-05）：首份数据库与内容备份已发布，SHA-256、`pg_restore --list` 和 `tar -tzf` 均通过；timer 为 enabled/active；三个生产容器 healthy 且重启次数为 0。
- 恢复验证（2026-09-05）：在无网络、无端口的临时 PostgreSQL 恢复 dump，61 张业务表和逐表行数一致；内容解包后的相对路径与 SHA-256 一致；临时资源已删除。
- 已知剩余项：尚无服务器外副本，后续季度恢复演练仍需持续执行，因此不能宣称异机灾难恢复闭环完成。
- 冲突风险：极低。仅新增 Academe 自有部署文件和文档。
- 回退方式：先停用并删除已安装的两个 systemd 单元，再删除仓库备份工具；已有备份默认保留。
- 上游同步检查：拉取上游时保留；若上游提供等价方案，先做恢复对比后再去重。
