# Academe 测试盘点与执行记录

更新时间：2026-09-04

## 统计口径

- “测试文件”按仓库中 `test_*.py`、`*.test.mjs`、`*.test.ts`、`*.spec.ts` 文件计数。
- “已执行”表示本轮命令尝试加载该测试文件；文件加载失败仍计为已尝试，不计为通过。
- Web 用例数采用 Bun 本次实际输出；未运行套件只统计文件数，不在没有执行证据时推测用例数。
- 构建、健康检查和人工验收独立记录，不冒充自动化测试用例。

## 总览

| 测试套件 | 测试目录 | 文件总数 | 本轮已尝试 | 本轮未执行 | 结果 |
|---|---|---:|---:|---:|---|
| Web | `apps/web/tests/` | 21 | 21 | 0 | 229 个用例：223 通过、4 个断言失败；另有 2 个文件加载错误 |
| API | `apps/api/src/tests/` | 314 | 0 | 314 | 未运行 |
| CLI | `apps/cli/tests/` | 16 | 0 | 16 | 未运行 |
| Playwright E2E | `apps/e2e/features/` | 30 | 0 | 30 | 未运行 |
| **合计** |  | **381** | **21** | **360** | 仅完成 Web 套件尝试执行 |

因此，本轮不能表述为“全项目测试全部通过”。准确表述是：邮箱目标回归测试 2/2 通过；Web 全套存在仓库/独立容器依赖相关失败；API、CLI 和 E2E 尚未执行。

## Web：21 个文件，全部尝试执行

执行命令：

```bash
docker run --rm -v /home/dev/RxProjects/Academe/apps/web:/app -w /app oven/bun:1.4.0 bun test tests
```

结果：退出码 1；Bun 汇总为 `223 pass, 6 fail, 2 errors`，并显示 `Ran 229 tests across 21 files`。其中可明确拆分为：

- 223 个测试用例通过。
- 4 个断言失败。
- 2 个测试文件在加载阶段发生模块错误；Bun 的 `6 fail` 汇总包含这些加载失败。

### 通过或部分通过的文件

- `account-profile-email.test.mjs`：2/2 通过，本次邮箱修复的目标回归测试。
- `language-preference.test.mjs`：2/2 通过，覆盖用户选择持久化与组织默认语言不冒充个人选择。
- `active-user-billing.test.mjs`
- `admin-authorization-denial.test.mjs`
- `admin-ee-gate.test.mjs`
- `api-response-shape.test.mjs`
- `billing-internal-key.test.mjs`
- `certification-enabled.test.mjs`
- `course-structure-translatable-text.test.mjs`
- `editor-unsaved-changes.test.mjs`
- `feature-gate-lockout.test.mjs`
- `h5p-protocol.test.mjs`
- `h5p-url.test.mjs`
- `library-sort.test.mjs`
- `quiz-modes.test.mjs`
- `scorm-proxy-compression.test.mjs`
- `video-source.test.mjs`
- `rtl-guard.test.mjs`：其余断言通过，1 个断言因缺少构建依赖失败。
- `billing-platform-key.test.mjs`：3 个断言失败。

### 4 个断言失败

1. `rtl-guard.test.mjs` — `globals.css > RTL rules survive compilation`：独立 Bun 容器内无法加载 `@tailwindcss/postcss`。
2. `billing-platform-key.test.mjs` — `returns the configured key`：`platformApiKey` 导出不存在。
3. `billing-platform-key.test.mjs` — `throws when unset instead of returning an empty key`：同一导出不匹配。
4. `billing-platform-key.test.mjs` — `treats an empty string as unset`：同一导出不匹配。

### 2 个文件加载错误

1. `billing-webhook.test.mjs`：无法从 `app/api/billing/webhook/route.ts` 加载 `next/server`。
2. `catalog-pagination.test.mjs`：缺少 `components/Objects/Catalog/catalogPagination.ts`。

这些失败不涉及本次邮箱补丁，但它们仍然是未通过项，后续不能在未处理或未建立正确测试环境前标记为通过。

## API：314 个文件，未执行

| 子目录 | 文件数 | 状态 |
|---|---:|---|
| `apps/api/src/tests/` | 2 | 未执行 |
| `apps/api/src/tests/admin/` | 3 | 未执行 |
| `apps/api/src/tests/core/` | 7 | 未执行 |
| `apps/api/src/tests/courses/` | 5 | 未执行 |
| `apps/api/src/tests/integrations/` | 1 | 未执行 |
| `apps/api/src/tests/routers/` | 60 | 未执行 |
| `apps/api/src/tests/security/` | 72 | 未执行 |
| `apps/api/src/tests/services/` | 163 | 未执行 |
| `apps/api/src/tests/setup/` | 1 | 未执行 |

未执行原因不是“已知通过”，而是本轮邮箱前端补丁尚未启动完整 API pytest 环境。后续需在符合项目要求的 Python 3.14.6 和服务依赖环境中运行并记录 pytest 的收集、跳过、通过与失败数量。

## CLI：16 个文件，未执行

目录 `apps/cli/tests/` 包含：

- `backup-archive-fail.test.ts`
- `backup-restore.test.ts`
- `commands.test.ts`
- `content-migration.test.ts`
- `doctor-dns.test.ts`
- `doctor-port.test.ts`
- `domain-port.test.ts`
- `ee.test.ts`
- `integration.test.ts`
- `prompt.test.ts`
- `setup-ci-port.test.ts`
- `setup-ee-preflight.test.ts`
- `start-migrated.test.ts`
- `unit.test.ts`
- `update-ee.test.ts`
- `update-migration.test.ts`

全部未执行。项目脚本将其中 15 个列入常规 `test`，`integration.test.ts` 由 `test:integration` 单独运行，`test:all` 才覆盖全部 16 个文件。

## Playwright E2E：30 个文件，未执行

| 功能目录 | 文件数 | 状态 |
|---|---:|---|
| `apps/e2e/features/assignments/tests/` | 23 | 未执行 |
| `apps/e2e/features/rtl/tests/` | 3 | 未执行 |
| `apps/e2e/features/scorm/tests/` | 4 | 未执行 |

全部未执行；需要 Playwright Chromium、测试账号和可控测试数据。它们也不覆盖本次账户设置保存流程，因此仍需单独人工验收邮箱修复。

## 已完成的非测试验证

- 正式 Docker 镜像构建成功，包含 Next.js 编译和 TypeScript 检查。
- 部署后 `academe-app` 为 `running/healthy`，重启次数为 0。
- 本机和公网根页面/API 健康请求均返回 HTTP 200。

## 尚未完成

- 浏览器人工验证：登录后确认邮箱自动显示；只修改姓名或简介并保存，确认不会退出。
- 浏览器人工验证：在右上角选择中文并刷新，确认仍保持中文。
- API 314 个测试文件。
- CLI 16 个测试文件。
- Playwright E2E 30 个测试文件。
- Web 当前 4 个失败断言和 2 个加载错误的基线清理或在完整依赖环境中的复测。
