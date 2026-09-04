# Tinybird 生成式外围层检查点

- 选择生成式外围层，避免修改上游 `events.datasource`。
- `deploy/tinybird/prepare.sh` 每次读取上游唯一真实定义，并在 Git 忽略的 `generated/` 中生成部署文件。
- 生成文件只追加 `academe_events_ingest APPEND` 和 `academe_events_read READ` 两个声明。
- `deploy/tinybird/tinybird.config.json` 只扫描 `generated/`。
- `.tinyb` 和 `generated/` 由 `deploy/tinybird/.gitignore` 明确忽略。
- 当前停止点：文件已创建，尚待运行生成器并在 `academe_analytics` 分支构建验证。
