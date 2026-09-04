# 2026-09-03 Academe 迁移日志

## 目标

1. 将 Academe 自有 Tinybird CLI 配置迁移到 `deploy/tinybird/`，继续引用上游 `events.datasource`，不复制或修改上游源文件。
2. 将 `/home/dev/RxProjects/Academe-data/` 中的运行数据迁移到仓库内、但被 Git 完全忽略的 `runtime-data/`。
3. 保留旧数据目录作为回退副本，未经用户另行确认不删除。

## 不可违反的边界

- 不记录或输出 Token、密码和 API Key。
- 不修改已跟踪的上游应用源文件。
- PostgreSQL 停写前不得复制物理数据目录。
- 切换数据路径前必须创建逻辑备份。
- 最终验证完成前不得删除 `/home/dev/RxProjects/Academe-data/`。
- 本轮所有非敏感内容完成后统一提交 Git。

## 当前进度

- [x] Tinybird 个人 Admin Token 已安全刷新，旧值已失效。
- [x] Tinybird CLI 已重新登录 `Academe` workspace，区域为 `europe-west2 (gcp)`，角色为 admin。
- [x] 已创建 `deploy/tinybird/tinybird.config.json`，仅引用 `apps/api/src/db/tinybird/datasources/events.datasource`。
- [ ] 验证 Tinybird 配置只包含 `events`。
- [ ] 迁移 `.tinyb` 并移除上游目录内的 Academe 自有配置。
- [ ] 创建并验证隔离 Tinybird Cloud branch。
- [ ] 将 `/runtime-data/` 加入 Git 忽略。
- [ ] 创建迁移前 PostgreSQL 逻辑备份。
- [ ] 停止服务、复制并核对运行数据。
- [ ] 切换 Compose 挂载并完成健康、数据和公网验收。
- [ ] 将最终结果合并回 `ACADEME_INSTALLATION_STATUS.md` 和 `ACADEME_CUSTOMIZATIONS.md`。

当前停止点：服务仍使用 `/home/dev/RxProjects/Academe-data/` 且全部健康；尚未停机或移动数据。下一步验证 Tinybird 外移配置。
