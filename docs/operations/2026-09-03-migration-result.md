# Academe Tinybird 与运行数据迁移结果

## Tinybird 配置边界

- Academe 自有 Tinybird 项目根目录为 `deploy/tinybird/`。
- `deploy/tinybird/prepare.sh` 每次读取上游唯一真实定义 `apps/api/src/db/tinybird/datasources/events.datasource`，生成被 Git 忽略的部署文件。
- 生成文件只追加 `academe_events_ingest APPEND` 和 `academe_events_read READ`，不修改上游文件。
- `.tinyb` 位于 `deploy/tinybird/.tinyb`，权限为 600，并由 Git 忽略。
- 上游目录内由 Academe 早期新增的 `.tinyb` 和 `tinybird.config.json` 已移除。
- 隔离 Cloud branch 为 `academe_analytics`。
- 分支构建成功，只创建 `events` datasource，没有创建 pipe 或 endpoint。
- 已核对 8 个字段、MergeTree、`toYYYYMM(timestamp)` 分区和 `org_id, event_name, timestamp` 排序键；上游定义包含 365 天 TTL。
- Deployment #1 已将 `events` 发布到主 workspace，deployment #2 已发布两个最小权限 Token。
- Token 已写入权限 600 且 Git 忽略的 `deploy/.env`；唯一测试事件写入和查询均成功。
- 用户已在浏览器确认 Academe Analytics 页面可以正常打开和显示，端到端人工验收通过。

## 运行数据迁移

- 新位置为 `runtime-data/{postgres,redis,content,backups}`。
- `runtime-data/.gitignore` 忽略全部运行数据，只跟踪 `.gitignore` 本身。
- `deploy/docker-compose.yml` 的 PostgreSQL、Redis 和 content 挂载已全部切换到 `../runtime-data/`。
- 迁移前 PostgreSQL custom-format 逻辑备份位于 `runtime-data/backups/pre-runtime-data-migration-20260903.dump`。
- 备份大小为 248,803 字节，SHA-256 为 `836f4bb170ee5f3427aa5550f23b9a2277fd2cd9a9087db8b365a8a92acfce96`。
- `pg_restore --list` 验证成功：721 行目录清单，710 个 TOC 条目。
- 停机复制后，PostgreSQL、Redis 和 content 的路径/类型/大小/权限/UID/GID/链接清单哈希与源目录完全一致。

## 最终验收

- `academe-app`、`academe-postgres`、`academe-redis` 均为 healthy，重启次数为 0。
- 容器实际挂载源均位于 `/home/dev/RxProjects/Academe/runtime-data/`。
- PostgreSQL 中组织为 `Academe`，slug 为 `metacognix`，初始化用户仍存在。
- Redis 迁移前后均为 3 个 key。
- 本机根路径、API、公网根路径和公网 API 均返回 HTTP 200。
- Web、API、Collab 进程均正常启动。
- 旧 `/home/dev/RxProjects/Academe-data` 已按用户明确授权移入 `/home/dev/.local/share/Trash/files/Academe-data`，当前可恢复；尚未永久清空回收站。

## 剩余项

- Redis 报告宿主机 `vm.overcommit_memory` 未开启；这是系统调优项，不影响本次迁移结果。
