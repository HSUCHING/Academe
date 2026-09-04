# Tinybird 符号链接迁移检查点

- 用户已批准以相对符号链接引用上游 `events.datasource`。
- `deploy/tinybird/datasources/events.datasource` 是相对符号链接，唯一真实定义仍位于 `apps/api/src/db/tinybird/datasources/events.datasource`。
- `deploy/tinybird/tinybird.config.json` 的项目目录为 `.`，资源范围仅包含 `datasources/events.datasource`。
- Tinybird 有效登录状态已迁移到 `deploy/tinybird/.tinyb`，权限为 600 且被 Git 忽略。
- 上游目录内早期新增的 `.tinyb` 和 `tinybird.config.json` 已移除。
- 隔离 Cloud branch 名称为 `academe_analytics`；尚待用修正后的资源边界重新构建验证。
- 用户已授权：运行数据迁移并完整验证成功后，删除旧 `/home/dev/RxProjects/Academe-data`。
