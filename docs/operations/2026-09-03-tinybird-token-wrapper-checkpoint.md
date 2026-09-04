# Tinybird 最小权限 Token 包装层检查点

- Tinybird Forward 拒绝通过 Token API 创建 resource-scoped Token，HTTP 403 明确要求由 deployment 管理。
- 用户已批准使用 Academe 外围包装文件，不修改上游 datasource。
- `deploy/tinybird/datasources/events.datasource` 仅包含上游 include 与两个 Token 声明。
- `deploy/tinybird/datasources/events_upstream.incl` 是指向 `apps/api/src/db/tinybird/datasources/events.datasource` 的相对符号链接。
- `academe_events_ingest` 目标权限为 `DATASOURCES:APPEND:events`。
- `academe_events_read` 目标权限为 `DATASOURCES:READ:events`。
- 当前停止点：包装文件已创建，尚待在 `academe_analytics` Cloud branch 构建验证。
