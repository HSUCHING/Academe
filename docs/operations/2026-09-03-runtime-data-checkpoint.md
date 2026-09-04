# Runtime data 迁移检查点

- 目标目录：`/home/dev/RxProjects/Academe/runtime-data/`。
- 旧目录：`/home/dev/RxProjects/Academe-data/`。
- `runtime-data/.gitignore` 忽略该目录内全部运行数据，仅允许跟踪 `.gitignore` 本身。
- 迁移范围：PostgreSQL、Redis、上传内容和备份。
- 数据复制前必须先完成 PostgreSQL 逻辑备份，再停止所有写入服务。
- 用户已明确批准：迁移和完整验收通过后删除旧 `Academe-data`。
- 当前停止点：尚未停机，下一步建立迁移前健康基线和逻辑备份。
