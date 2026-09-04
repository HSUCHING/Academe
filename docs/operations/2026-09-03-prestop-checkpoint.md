# Runtime data 停机前检查点

- 迁移前 `academe-app`、`academe-postgres`、`academe-redis` 均为 healthy。
- 本机 API 与公网主页均返回 HTTP 200。
- PostgreSQL 数据库大小基线：12,254,231 字节。
- Redis key 数量基线：3。
- 内容文件数量基线：0。
- 逻辑备份：`runtime-data/backups/pre-runtime-data-migration-20260903.dump`。
- 备份大小：248,803 字节。
- 备份 SHA-256：`836f4bb170ee5f3427aa5550f23b9a2277fd2cd9a9087db8b365a8a92acfce96`。
- `pg_restore --list` 验证通过：721 行目录清单，710 个 TOC 条目，dump 与 pg_dump 版本均为 PostgreSQL 16.15。
- 下一步：停止全部 Compose 服务并复制物理数据；失败时仍从旧 `Academe-data` 启动。
