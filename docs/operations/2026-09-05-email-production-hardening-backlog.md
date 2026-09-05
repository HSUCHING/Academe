# Academe 邮件生产加固待办

状态：待实施

记录日期：2026-09-05

适用部署：`https://academe.metacognix.xyz`（OSS / single tenancy）

本文只记录已确认的问题、建议顺序和验收标准，不表示这些修改已经实施。所有密钥值、Webhook secret、DNS 凭据和运行数据均不得写入 Git。

## 当前已验证基线

- 生产邮件通过 Resend 发送，显示名称为 `Academe`。
- 测试邮件已投递到 Gmail；SPF 与 DKIM 均通过。
- 站点 Logo 与 favicon 可公开访问。
- API 邮件目标测试曾完成 `113/113`，Web 品牌目标测试完成 `7/7`。
- 当前生产应用运行在 OSS 模式，因此 Web 侧 SaaS 专用 `RESEND_*` 通道按设计不启用；生产事务邮件由 API 通道负责。

## P0：立即轮换已暴露的 Resend API Key

原因：现用密钥曾进入工具输出，应按已暴露处理。Resend 密钥不会自动过期，必须主动撤销。

执行顺序必须避免停机：

1. 在 Resend 创建新的 production key，优先使用 `sending_access` 并限制到正式发信域名；不要继续给予应用 full access。
2. 仅在服务器未纳入 Git 的 `deploy/.env` 中替换 `LEARNHOUSE_RESEND_API_KEY`。
3. 重建或重启应用容器，使新环境变量生效。
4. 发送一封最小品牌测试邮件，确认 Resend 接受请求且状态到达 `delivered`。
5. 核对应用日志没有鉴权错误，再撤销旧 key。
6. 再次确认仓库、shell 历史和文档中没有密钥值。

验收标准：新 key 可以完成真实投递；旧 key 已撤销；Git diff 中无秘密；应用健康检查通过。

## P1：启用退信、投诉与服务商抑制回调

代码已经提供 `/api/v1/internal/emails/delivery-events`，并能处理：

- `email.bounced`，仅永久退信进入本地抑制；
- `email.complained`；
- `email.suppressed`。

当前缺口：生产未配置 `LEARNHOUSE_RESEND_WEBHOOK_SECRET`，所以该端点会 fail closed；Resend 控制台也需要登记 HTTPS endpoint 和上述事件。

推荐外围实现：只修改 Resend 控制台与 `deploy/.env`，不修改上游源码。Webhook 创建后只把 signing secret 写入服务器环境文件。

验收标准：合法签名事件返回 200；篡改签名返回 403；临时退信不抑制；永久退信和投诉会阻止后续生命周期邮件。

## P1：建立可回复路径

当前缺口：`LEARNHOUSE_CONTACT_EMAIL` 未配置，邮件域名与主域名均未发现 MX，因此生命周期邮件不会生成有效 `Reply-To`，也不能假设 `Notifications@...` 能接收回复。

推荐外围实现：先建立真实支持邮箱或邮件路由，再配置 `LEARNHOUSE_CONTACT_EMAIL`。发件地址可以继续使用 notifications；回复应进入有人处理的 mailbox。

验收标准：真实邮件头包含预期 `Reply-To`；从 Gmail 回复能够送达；退信不会进入无人管理的地址。

## P1：发布并逐步收紧 DMARC

当前缺口：`_dmarc.metacognix.xyz` 与 `_dmarc.mail.metacognix.xyz` 均未发布。SPF/DKIM 已通过不等于 DMARC 已建立。

推荐外围实现：

1. 先以 `p=none` 和 `pct=100` 进入观察期，并指定受控的 aggregate report mailbox/service。
2. 盘点所有合法发信源，确认 From、DKIM 与 SPF alignment。
3. 报告稳定后升级为 `p=quarantine`，最终视业务情况升级为 `p=reject`；不要在未盘点发信源时直接拒绝。
4. 若使用子域发信，同时明确组织域的 `sp` 策略。

验收标准：Gmail 原始邮件显示 DMARC pass；观察期内没有合法邮件被误判；策略提升后持续监测退信和投诉。

## P2：修复纯文本替代内容

真实测试邮件的自动 `text/plain` 部分包含 HTML preheader 使用的隐藏填充字符。HTML 阅读正常，但文本客户端、无障碍工具和回复引用会受到影响。

低冲突实现建议：

- 新增独立转换器，例如 `apps/api/src/services/email/plain_text.py`；
- 在 `apps/api/src/services/email/utils.py` 只增加一个 import，以及 Resend `text` 字段和 SMTP `text/plain` attachment；
- 过滤 `display:none` / `mso-hide:all` 隐藏块，保留可见正文和链接目标；
- 新增隔离测试，不批量修改邮件模板。

验收标准：Resend 和 SMTP 都生成 multipart alternative；纯文本无 U+034F/U+200C 填充；CTA URL 在纯文本中仍可访问。

## P2：避免品牌替换误改动态值

当前 `apps/api/src/services/email/translations.py` 在 `.format(**fmt)` 后执行 `LearnHouse → Academe`。如果用户或机构真实名称包含 `LearnHouse`，动态值也会被改写。

低冲突实现建议：只调整 `t()` 中的执行顺序——先替换模板里的平台固定品牌，再插入动态值；补一个 `LearnHouse Research` 机构名回归测试，不修改数千行翻译字典。

验收标准：平台固定文案输出 Academe；用户名、课程名和机构名保持原值。

## P2：为邮件正文提供专用 PNG

当前正文使用公开 SVG。Gmail 本次能够接收，但外链 SVG 在 Outlook、部分移动客户端和关闭远程图片时并不稳定；现有 2048px PNG 又不适合直接用于邮件。

低冲突实现建议：在现有 `apps/web/public/academe-brand/` 新增约 320px 的透明 PNG，控制在 100 KB 内；API 独立品牌适配器与 React Email 模板各只改一条 URL。网站 SVG 与 favicon 保持不变。

验收标准：公开 URL 返回 `image/png`；Gmail、Outlook 与 Apple Mail 的亮/暗色模式均检查；图片禁用时显示 `Academe` alt 文本。

## P3：BIMI 发件人头像

网站 favicon 不会自动成为邮箱列表中的发件人头像。当前没有 BIMI DNS 记录，现有 Web SVG 也不是可直接发布的 SVG Tiny PS：缺少对应 profile/version，并且画布不是严格正方形。

前置条件：DMARC 必须进入 enforcement（`quarantine` 或 `reject`）；为 Gmail 的稳定显示准备符合要求的 CMC 或 VMC。

验收标准：独立 BIMI SVG 通过校验；`default._bimi` DNS 可解析；证书链有效；支持 BIMI 的收件客户端显示品牌头像。该任务不得复用网站 SVG 后直接宣称完成。

## P3：补齐邮件客户端与全量回归

最低矩阵：Gmail Web/移动端、Outlook、Apple Mail；亮色/暗色、远程图片关闭、长文本语言、纯文本模式、退订与回复。

目标测试通过不能描述成全项目通过。每次实施后分别记录：已通过、失败、未执行，以及真实投递的 provider message id 和最终状态；message id 可以记录，密钥和完整用户邮件内容不得记录。

## 上游合并边界

- DNS、Resend 控制台、mailbox 和 `deploy/.env` 优先，源码不能解决的内容才进入 `apps/`。
- 源码修改采用“Academe 独立文件 + 上游文件最小接入点”，不得批量改翻译字典或重命名 LearnHouse 技术接口。
- 每项实施必须同步更新 `ACADEME_CUSTOMIZATIONS.md`，包含修改原因、文件、外围方案评估、冲突风险、回退、测试与上游等价修复删除条件。
- 上游若提供显式 text alternative、可配置邮件品牌或等价翻译修复，应删除 Academe 补丁，不保留双重实现。
