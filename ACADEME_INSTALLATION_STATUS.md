# Academe 工程进展与部署记忆

## 0. 任务执行与断点恢复规范

从 2026-09-03 起，每项安装、配置、部署或验收任务必须遵循：

1. 开始操作前，先在本文档写入任务目标、待办步骤和当前停止点。
2. 每完成一步，立即将对应待办标记为完成，并记录必要的非敏感验证结果。
3. 遇到错误时，先记录错误、影响和下一步排查动作，再继续处理。
4. 会话结束或中断前，明确记录最后成功步骤和下一条可执行命令。
5. API Key、Token、密码和 Secret 永不写入本文档，也不通过会回显密钥的状态命令验证。
6. 新会话恢复时先阅读本文档，再核对实际文件、Git 和容器状态。

> 这是 Academe 项目的持续工程记录，不只是安装教程。
> 新会话或服务器中断后，应先完整阅读本文，再继续操作。
> 最后核对：2026-09-03，America/Los_Angeles。

## 1. 项目目标

在当前服务器上部署并持续开发 Academe。Academe 基于当前仓库源码构建，后续会有自己的功能和源码修改，因此不能把它当作只运行上游 LearnHouse 镜像的普通安装。

目标访问地址：

```text
https://academe.metacognix.xyz
```

服务器上的目录：

```text
源码：     /home/dev/RxProjects/Academe
部署配置： /home/dev/RxProjects/Academe/deploy
运行数据： /home/dev/RxProjects/Academe-data
应用入口： 127.0.0.1:3020
```

## 2. 不可违反的工程约束

### 2.1 环境变量

- 所有运行时环境变量统一保存在：

  ```text
  /home/dev/RxProjects/Academe/deploy/.env
  ```

- 不允许把运行时环境变量散落到源码目录、各应用子目录、systemd、Nginx 或 Compose 的 `environment:` 中。
- `docker-compose.yml` 只通过 `env_file: .env` 加载环境变量。
- `.env.example` 只记录变量名和安全示例，不包含真实密码或 Key。
- 正式 `.env` 权限必须为 `600`，并保持 Git 忽略。
- 密钥、密码不能写进本文档。

### 2.2 部署配置

- 所有部署编排统一放在：

  ```text
  /home/dev/RxProjects/Academe/deploy/docker-compose.yml
  ```

- 容器、构建、端口、网络、卷、健康检查、启动依赖和重启策略全部由 Docker Compose 管理。
- 宿主机 Nginx 是现有基础设施，仓库内保留其配置源文件：

  ```text
  Academe/deploy/nginx/academe.conf
  ```

- Nginx 的生效副本位于 `/etc/nginx/rxconf.d/academe.conf`。

### 2.3 源码

- 暂时不随意修改源代码。
- 任何对 `apps/`、`docker/`、根 `Dockerfile` 或其他项目源码的修改，必须先向用户说明：

  1. 为什么要改；
  2. 修改哪些文件；
  3. 对功能和部署有什么影响；
  4. 是否有兼容及回滚风险。

- 得到用户明确确认后才能修改。
- 部署文件放在 `deploy/` 不属于应用源码修改，但仍要记录在本文档。

### 2.4 镜像构建

- Academe 应用必须从本机当前源码构建。
- 不使用 `ghcr.io/learnhouse/app` 等 LearnHouse 官方应用镜像。
- 不运行 `npx learnhouse setup` 来生成官方镜像部署。
- 项目根目录已有多阶段 `Dockerfile`，能够构建 Web、API 和 Collab 的统一应用镜像。
- PostgreSQL、Redis 等基础设施可以使用它们自己的官方镜像。

## 3. 已确定的架构

```text
Internet
   │
Cloudflare DNS / HTTPS
   │
宿主机 Nginx
/etc/nginx/rxconf.d/academe.conf
   │
127.0.0.1:3020
   │
Docker Compose
   ├── academe-app   本地源码构建
   ├── postgres      pgvector PostgreSQL
   └── redis         Redis + AOF
```

持久化数据与 Git 仓库分离：

```text
/home/dev/RxProjects/Academe-data/
├── postgres/   # PostgreSQL 数据
├── redis/      # Redis 持久化数据
├── content/    # 课程文件、图片、视频等
└── backups/    # 数据库和内容备份
```

计划的应用绑定：

```text
127.0.0.1:3020:80
```

3020 只允许宿主机访问，公网流量必须经过 Cloudflare 和 Nginx。

## 4. 已完成并验证的工作

### 4.1 源码与文件

- [x] 源码仓库存在于 `/home/dev/RxProjects/Academe`。
- [x] 已通过 Git 状态核对：原有已跟踪源码没有修改。
- [x] 当前新增内容属于部署配置：`Academe/deploy/`。
- [x] 根目录已有可从源码构建统一应用的 `Dockerfile`。
- [x] 已约定后续源码修改必须先获得用户确认。

### 4.2 服务器与 Docker

- [x] Docker 已安装：`29.7.2`。
- [x] Docker Compose 已安装：`v5.4.0`。
- [x] 服务器资源已检查：4 核、7.7 GiB 内存、约 26 GiB 可用磁盘。
- [x] 资源足够运行 Academe、PostgreSQL 和 Redis。
- [x] 当前没有 Swap；源码构建期间需要关注内存峰值。

### 4.3 域名、Cloudflare 与 Nginx

- [x] `academe.metacognix.xyz` 已通过 Cloudflare 正常解析。
- [x] 最初访问返回 HTTP 200，但内容是服务器原有 Next.js 默认站点，不是 Academe。
- [x] 已创建仓库内 Nginx 配置源文件：

  ```text
  /home/dev/RxProjects/Academe/deploy/nginx/academe.conf
  ```

- [x] 用户已使用 sudo 安装配置到：

  ```text
  /etc/nginx/rxconf.d/academe.conf
  ```

- [x] 已执行 Nginx 配置测试并 reload。
- [x] 已重新验证公网访问返回 HTTP 502。
- [x] 已验证 `127.0.0.1:3020` 当时没有服务监听。
- [x] 该 502 是预期结果，证明 Cloudflare、TLS、宿主机 Nginx 已进入 Academe 专用链路；当前只缺 Compose 应用服务。

### 4.4 独立数据目录

- [x] 已创建 `/home/dev/RxProjects/Academe-data`。
- [x] 已创建 `postgres/`、`redis/`、`content/`、`backups/`。
- [x] 已确定 Compose 后续使用绝对路径挂载这些目录。

### 4.5 初始化信息

- [x] 组织名称确定为 `Academe`。
- [x] 组织标识最终确定为 `metacognix`（早期记录中的 `academe` 已作废）。
- [x] 初始管理员邮箱确定为 `martin.hsuching@gmail.com`。
- [x] 管理员密码应在部署时随机生成并安全保存，不在聊天和本文档记录。

### 4.6 Resend 邮件

- [x] 已确认 Resend Key 所属账户验证的是 `mail.metacognix.xyz`，不是根域 `metacognix.xyz`。
- [x] 使用 `noreply@metacognix.xyz` 测试失败，Resend 返回域名未验证。
- [x] 使用 `noreply@mail.metacognix.xyz` 测试成功。
- [x] 测试邮件已投递到 `martin.hsuching@gmail.com`，Resend 状态为 `delivered`。
- [x] 正式发件地址最终确定为：

  ```text
  Academe <notifications@mail.metacognix.xyz>
  ```

- [x] 正式环境变量应使用：

  ```dotenv
  LEARNHOUSE_EMAIL_PROVIDER=resend
  LEARNHOUSE_SYSTEM_EMAIL_ADDRESS=notifications@mail.metacognix.xyz
  LEARNHOUSE_SYSTEM_EMAIL_SENDER_NAME=Academe
  ```

- [ ] Resend Key 已出现在聊天记录中，正式上线前必须撤销并生成新 Key。

### 4.7 AI 调查

- [x] 已从当前服务器测试第一枚 Gemini Key。
- [x] 已测试第二枚 Gemini Key以排除单个 Key 权限问题。
- [x] 两次均返回：

  ```text
  400 FAILED_PRECONDITION
  User location is not supported for the API use.
  ```

- [x] 服务器公网出口曾核对为 `154.51.243.248`，地理显示美国洛杉矶，但 ASN 为香港注册的 UCloud 网络。
- [x] 已确认当前项目 Google Provider 直接访问 Gemini API，不能仅靠环境变量更改 Google API 地址。
- [x] 已确定直接设置 Gemini Key 并开启 AI 会造成“界面已开启、实际请求失败”。
- [ ] 首次部署暂时设置 `LEARNHOUSE_IS_AI_ENABLED=false`。
- [ ] 后续可选：OpenRouter、可靠的美国出口、迁移服务器，或经用户批准后修改源码支持代理/Vertex AI。
- [ ] 两枚 Gemini Key 已出现在聊天中，需要撤销。

## 5. 当前实际文件和运行状态

```text
已存在：
/home/dev/RxProjects/Academe/deploy/.env
/home/dev/RxProjects/Academe/deploy/nginx/academe.conf
/home/dev/RxProjects/Academe-data/postgres
/home/dev/RxProjects/Academe-data/redis
/home/dev/RxProjects/Academe-data/content
/home/dev/RxProjects/Academe-data/backups
/etc/nginx/rxconf.d/academe.conf

尚未存在或未完成：
/home/dev/RxProjects/Academe/deploy/docker-compose.yml
完整、可启动的 deploy/.env
从源码构建的 academe-app 镜像
Academe/PostgreSQL/Redis 容器
```

当前域名状态：

```text
https://academe.metacognix.xyz -> HTTP 502
127.0.0.1:3020               -> 无服务监听
```

这不是 Cloudflare 或 Nginx 故障，而是 Compose 尚未启动。

## 6. 待完成工作

### 阶段 A：完成集中配置

- [ ] 根据项目实际变量定义，创建完整 `deploy/.env.example`，不得包含真实密钥。
- [ ] 完成正式 `deploy/.env`。
- [ ] 把所有运行时环境变量全部移入 `.env`。
- [ ] 从 Compose 删除散落的运行时 `environment:` 值，只保留 `env_file: .env`。
- [ ] 生成数据库密码、管理员密码、JWT Secret、NextAuth Secret 等随机强密钥。
- [ ] 写入新 Resend Key。
- [ ] 保持 AI 关闭。
- [ ] 设置 `.env` 权限为 600，并确认 Git 忽略。

已确定的非敏感变量：

```dotenv
LEARNHOUSE_INITIAL_ADMIN_EMAIL=martin.hsuching@gmail.com
LEARNHOUSE_INITIAL_ORG_NAME=Academe
LEARNHOUSE_INITIAL_ORG_SLUG=academe
LEARNHOUSE_EMAIL_PROVIDER=resend
LEARNHOUSE_SYSTEM_EMAIL_ADDRESS=notifications@mail.metacognix.xyz
LEARNHOUSE_SYSTEM_EMAIL_SENDER_NAME=Academe
LEARNHOUSE_CONTENT_DELIVERY_TYPE=filesystem
LEARNHOUSE_IS_AI_ENABLED=false
```

### 阶段 B：创建源码构建版 Compose

- [ ] 创建 `Academe/deploy/docker-compose.yml`。
- [ ] `academe-app` 使用本地源码构建，不能引用 LearnHouse 应用镜像。
- [ ] 构建上下文从 `deploy/` 指向仓库根目录 `..`。
- [ ] 使用项目现有根 `Dockerfile`。
- [ ] 自有镜像名称暂定 `academe-app:local`。
- [ ] 增加 PostgreSQL（pgvector）服务。
- [ ] 增加 Redis 服务并启用 AOF。
- [ ] 增加独立 Docker network。
- [ ] 增加健康检查、启动依赖和 `restart: unless-stopped`。
- [ ] 将应用端口绑定为 `127.0.0.1:3020:80`。
- [ ] 配置绝对路径持久化挂载。

应用构建方向：

```yaml
services:
  academe-app:
    image: academe-app:local
    build:
      context: ..
      dockerfile: Dockerfile
    env_file:
      - .env
    ports:
      - "127.0.0.1:3020:80"
```

最终 Compose 的全部服务都必须使用同一个 `.env` 文件；真实环境值不直接写在 Compose 中。

### 阶段 C：配置校验

```bash
cd /home/dev/RxProjects/Academe/deploy
docker compose config
```

- [ ] YAML 和变量解析无错误。
- [ ] Compose 中不存在 `ghcr.io/learnhouse/app`。
- [ ] 应用 build context 正确指向 Academe 当前源码。
- [ ] 端口为 `127.0.0.1:3020:80`。
- [ ] 数据卷全部指向 `Academe-data`。
- [ ] `.env` 未被 Git 跟踪。

### 阶段 D：构建自有应用镜像

```bash
cd /home/dev/RxProjects/Academe/deploy
docker compose build academe-app
docker image inspect academe-app:local
```

- [ ] 镜像由当前本地源码构建。
- [ ] 构建期间监控内存和磁盘。
- [ ] 记录构建对应的 Git commit。

宿主机无需为了构建单独安装 Node/npm；根 `Dockerfile` 会在容器构建阶段处理 Bun、Node、Python 和应用依赖。

### 阶段 E：启动服务

```bash
cd /home/dev/RxProjects/Academe/deploy
docker compose up -d postgres redis
docker compose ps
docker compose up -d academe-app
docker compose logs --tail=200 academe-app
```

- [ ] PostgreSQL healthy。
- [ ] Redis healthy。
- [ ] 数据库迁移成功。
- [ ] 初始管理员和组织创建成功。
- [ ] Web、API、Collab 正常启动。
- [ ] Academe 容器 healthy，无持续重启。

### 阶段 F：链路与功能验收

```bash
curl -I http://127.0.0.1:3020/
curl -fsS http://127.0.0.1:3020/api/v1/health
curl -I https://academe.metacognix.xyz/
```

- [ ] 本机 3020 正常响应。
- [ ] API 健康检查成功。
- [ ] 公网 502 消失，返回合理的 2xx/3xx。
- [ ] 管理员可以登录。
- [ ] 组织名称和标识正确。
- [ ] 可以新建课程和章节。
- [ ] 上传文件成功，文件进入 `Academe-data/content`。
- [ ] 协作编辑/WebSocket 正常。
- [ ] 系统邮件发件地址正确并能投递。
- [ ] 重启容器后数据仍存在。
- [ ] AI 保持关闭且不产生失败请求。

### 阶段 G：备份与恢复

- [ ] PostgreSQL 逻辑备份写入 `Academe-data/backups`。
- [ ] 备份 `Academe-data/content`。
- [ ] 记录源码 commit、自有镜像 tag 和部署日期。
- [ ] 将备份复制到服务器之外。
- [ ] 在非生产环境完成恢复验证。

## 7. 后续源码修改流程

每次修改源码必须按以下顺序：

1. 先在本文档记录需求和当前状态。
2. 向用户报告拟修改文件、原因、影响和风险。
3. 获得用户明确批准。
4. 创建独立 Git 分支。
5. 修改源码并运行相关测试。
6. 从明确 commit 构建版本化自有镜像，例如 `academe-app:<commit>`。
7. 部署前备份数据库与内容。
8. Compose 切换镜像版本并验收。
9. 记录变更、验证结果和剩余问题。
10. 失败时切回旧镜像；数据库迁移必须提前评估回滚兼容性。

## 8. 新会话恢复方法

新会话开始时依次执行：

```bash
sed -n '1,400p' /home/dev/RxProjects/ACADEME_INSTALLATION_STATUS.md
git -C /home/dev/RxProjects/Academe status --short --branch
find /home/dev/RxProjects/Academe/deploy -maxdepth 3 -type f -print
docker compose -f /home/dev/RxProjects/Academe/deploy/docker-compose.yml ps
curl -kIsS https://academe.metacognix.xyz/
```

然后：

1. 对照本文“已完成工作”和“待完成工作”。
2. 以服务器实际状态为准，不仅凭旧聊天判断。
3. 把新完成的步骤、实际修改和验证输出更新回本文档。
4. 未经批准不要修改源码。
5. 不在输出中展示 `.env` 的真实值。

## 9. 当前下一步

下一步不是改源码，也不是运行 LearnHouse CLI，而是：

1. 只读核对项目所需环境变量。
2. 创建集中式 `deploy/.env.example` 和完整正式 `.env`。
3. 创建源码构建版 `deploy/docker-compose.yml`。
4. 执行 `docker compose config` 验证。
5. 向用户报告配置设计与将创建的文件。
6. 从当前源码构建 `academe-app:local`。
7. 启动并完成全部验收。

## 10. 先前错误方案更正

先前文档曾错误写入以下步骤，现全部作废：

- 在宿主机安装 Node/npm 作为部署前置条件；
- 执行 `npx learnhouse setup`；
- 由 LearnHouse CLI 生成官方镜像部署；
- 使用 LearnHouse 官方应用镜像。

正确方案是：**环境变量集中在 `.env`、部署全部由 Docker Compose 管理、应用从 Academe 当前源码构建、持久化数据独立保存、源码修改必须先获批准。**

## 11. 2026-09-03 启动前配置审计

### 审计结论

当前部署文件**不齐备，尚不能启动**。

已存在的 `deploy/.env` 只包含 AI 相关变量；核心的 `deploy/docker-compose.yml` 不存在。数据库、Redis、安全密钥、首次管理员、组织、域名、前端运行时、Collab 和邮件参数尚未形成完整配置。

### 启动硬阻塞

- [ ] 创建 `deploy/docker-compose.yml`。
- [ ] 配置 PostgreSQL 服务、连接串、用户、数据库名和强密码。
- [ ] 配置 Redis 服务及 API/Collab 使用的 Redis URL。
- [ ] 生成 `LEARNHOUSE_AUTH_JWT_SECRET_KEY`，长度至少 32 字符；API 会在缺失或过短时拒绝启动。
- [ ] 生成 `COLLAB_INTERNAL_KEY`；Collab 缺失该变量会直接退出。
- [ ] 配置 `LEARNHOUSE_INITIAL_ADMIN_PASSWORD`；首次自动安装缺失它会失败。
- [ ] 配置域名、HTTPS、前后端 URL、Cookie、CORS/CSRF 范围。
- [ ] 配置本地内容存储并挂载 `Academe-data/content`。
- [ ] 从当前源码成功构建 `academe-app` 镜像。

### 已知且无需再次询问的参数

```text
域名：academe.metacognix.xyz
协议：https
宿主机端口：127.0.0.1:3020
组织名称：Academe
组织标识：metacognix
管理员邮箱：martin.hsuching@gmail.com
存储：本地 filesystem
发件名称：Academe
发件地址：notifications@mail.metacognix.xyz
数据库：本机 Compose PostgreSQL/pgvector
Redis：本机 Compose Redis
```

数据库密码、管理员初始密码、JWT Secret、NextAuth Secret 和 Collab Internal Key 不需要用户提供，可在本机安全随机生成并只写入 `.env`。

### 仍需用户确认

1. **版本/授权模式**：首次部署是否明确使用 Community/OSS 单组织模式。建议首轮使用 `LEARNHOUSE_TENANCY=single` 和公开构建参数，避免误启用 Enterprise/SaaS 功能。
2. **AI 状态**：当前 `.env` 写的是 OpenAI 且 AI 已启用，但先前决策是首轮关闭。需要确认是保留 OpenAI 并测试，还是改回 `LEARNHOUSE_IS_AI_ENABLED=false`。当前 OpenAI Key 和模型可用性尚未验证。
3. **正式 Resend Key**：邮件功能计划启用，但旧 Key 已出现在聊天中。需要用户在 Resend 撤销旧 Key并创建新 Key；新 Key只写入 `.env`。
4. **初始管理员密码交付方式**：可由系统生成；需确认是部署后只显示一次，还是由用户自行在服务器终端写入 `.env`。

### 可选集成，不阻塞首次启动

以下服务首轮均可不配置：

- Google OAuth
- S3/R2（已经选择本地存储）
- Tinybird Analytics
- Judge0 代码执行
- Stripe 支付
- Sentry
- Unsplash
- Gemini
- Enterprise/SaaS 平台授权

这些服务只有在决定启用时才需要相应 API Key、OAuth Client、Webhook Secret 或许可证。

### 首次启动行为

API 启动时会运行自动安装逻辑：连接数据库、创建必要表和默认元素，并在空数据库中使用 `.env` 的组织、管理员邮箱和管理员密码创建初始管理员。因此首次启动前必须一次性把这些变量配置正确。

## 12. 2026-09-03 实际部署与验收结果

> 本节记录本次实际执行结果，并取代第 5、6、9、11 节中已经过时的“尚未启动”状态。敏感值不记录在本文档。

### 已完成的配置与文件

- [x] 正式环境变量集中写入 `Academe/deploy/.env`，共 53 个变量。
- [x] `.env` 权限为 `600`，并由 Git 忽略。
- [x] 已写入用户授权的初始化管理员、组织、Resend、JWT、Collab、Google OAuth 和 Tinybird 配置。
- [x] 已生成并写入 PostgreSQL 密码和 `NEXTAUTH_SECRET`。
- [x] 已配置域名 `academe.metacognix.xyz`、HTTPS、Community/OSS、`single` tenancy 和 filesystem 存储。
- [x] 已创建无真实密钥的 `Academe/deploy/.env.example`。
- [x] 已创建 `Academe/deploy/docker-compose.yml`。
- [x] Compose 使用本地根 `Dockerfile` 构建 `academe-app:local`，构建参数 `LEARNHOUSE_PUBLIC=true`。
- [x] PostgreSQL、Redis 和内容目录分别绑定到现有 `Academe-data/postgres`、`redis`、`content`。
- [x] 应用仅绑定 `127.0.0.1:3020:80`。
- [x] `docker compose config --quiet` 校验通过。

### 构建与运行状态

- [x] 当前源码 commit：`5ce0dab7`。
- [x] 自有镜像 `academe-app:local` 构建成功。
- [x] 镜像 ID：`sha256:8765ad6d2faf1fb950e7b6107dd39bf9bc9104fe6d683aa966587906c9fb8d08`。
- [x] `academe-postgres` healthy，零重启。
- [x] `academe-redis` healthy，零重启，AOF 已启用。
- [x] `academe-app` healthy，零重启。
- [x] 统一应用容器中的 Web、API、Collab 三个 PM2 进程均 online。
- [x] 首次安装成功创建组织 `Academe`，slug 为 `metacognix`。
- [x] 首次安装成功创建 1 个初始化管理员用户。
- [x] 使用授权的初始化管理员凭据调用登录 API 返回 HTTP 200，并返回访问令牌。

### 网络和功能验收

- [x] `http://127.0.0.1:3020/` 返回 HTTP 200。
- [x] `http://127.0.0.1:3020/api/v1/health` 返回 HTTP 200，响应为 `true`。
- [x] 正确登录页路径 `/login` 返回 HTTP 200；直接访问内部页面路径 `/auth/login` 返回 404 属于路由设计。
- [x] `https://academe.metacognix.xyz/` 返回 HTTP 200，原 502 已消失。
- [x] 公网 `/api/v1/health` 返回 HTTP 200。
- [x] 公网 `/login` 可用。
- [x] Google OAuth authorize 路由返回 HTTP 200，生成的 Google URL 主机和回调 URI 均正确。
- [x] Resend 凭据通过只读 API 鉴权，返回 HTTP 200；本次未重复发送测试邮件。
- [x] PostgreSQL 中组织和用户数据存在。
- [x] 容器重启后组织数据、Redis AOF 测试键和 filesystem 测试文件均保持；测试标记随后已清理。
- [x] 重启瞬间 API 曾记录一次 Redis DNS 未就绪警告，随后 DNS 正常解析且消费者恢复启动，不是持续故障。

### 当前剩余问题

- [ ] Tinybird Read Token 和 Ingest Token 均被 Tinybird API 判定为无效并返回 HTTP 403。应用主服务不受影响，但 Analytics 在更新有效 Token 前不可用。
- [ ] Google OAuth 已验证配置加载和授权 URL 生成；完整浏览器授权、Google 回调和实际账户登录仍需人工完成一次。
- [ ] 邮件配置和 Resend API 鉴权已通过；本次未再次发送实际邮件。
- [ ] 尚未建立正式 PostgreSQL/内容备份任务，也尚未执行异机恢复演练。
- [ ] 当前保留了部署前已有的 OpenAI AI 启用配置；模型调用可用性尚未在本次部署验收中测试。

### 当前访问和操作

- 主站：`https://academe.metacognix.xyz/`
- 登录页：`https://academe.metacognix.xyz/login`
- API 健康检查：`https://academe.metacognix.xyz/api/v1/health`
- Compose 目录：`/home/dev/RxProjects/Academe/deploy`
- 查看状态：`docker compose -f /home/dev/RxProjects/Academe/deploy/docker-compose.yml ps`

## 13. 2026-09-03 Tinybird 重建准备与进度维护

### 当前结论

- [x] 已确认旧的 Tinybird Read Token 与 Ingest Token 均返回 HTTP 403，必须撤销/弃用，不能继续作为生产凭据使用。
- [x] 已确认 Tinybird 故障只影响 Analytics，不影响 Web、API、Collab、PostgreSQL、Redis、登录和课程主功能。
- [x] 已复核应用集成方式：事件写入使用 `POST /v0/events`，分析查询使用 `POST /v0/sql`。
- [x] 已复核所需资源：只需部署 `apps/api/src/db/tinybird/datasources/events.datasource`；`endpoints/*.pipe` 仅作查询参考，不需要部署。
- [x] 已确认 datasource 名为 `events`，采用 12 个月 TTL。
- [x] 已检测宿主机：当前未安装 `tb` / `tinybird` CLI。
- [x] 2026-09-03 复核 Compose：`academe-app`、`academe-postgres`、`academe-redis` 均为 healthy。

### 用户需要提供的 Tinybird 信息

以下三项足够让应用接入已建好的 Tinybird 工作区：

1. **区域 API URL**：Tinybird 工作区显示的完整 regional API host，例如 `https://api.<region>.<provider>.tinybird.co`。
2. **Ingest Token**：可向 `events` datasource 写入事件；至少具备该 datasource 所需的 append/write 权限。
3. **Read Token**：可通过 SQL/Query API 读取 `events` datasource。

如果由本机代为创建和部署 `events` datasource，还需要让 Tinybird CLI 登录目标工作区。优先使用 `tb login` 的交互式浏览器/设备授权，不把管理员 Token 写入本文档或聊天记录。部署完成后，应用只保留上面两个最小权限运行时 Token。

### CLI 与重建顺序

- [ ] 经用户同意后安装 Tinybird CLI；优先使用隔离安装方式 `uv tool install tinybird`，避免污染系统 Python。
- [ ] 通过 `tb login` 登录用户新建的目标工作区，并核对当前 workspace 与区域。
- [ ] 从 `Academe/apps/api/src/db/tinybird/datasources/` 执行云端部署，创建 `events` datasource。
- [ ] 创建新的 Ingest Token 和 Read Token，并撤销所有失效或曾暴露的旧 Token。
- [ ] 将 regional API URL 和两个新 Token 仅写入 `Academe/deploy/.env`，不写入 Git 或进度文档。
- [ ] 重建/重启 `academe-app` 使新环境变量生效。
- [ ] 发送一条最小测试事件，确认 Events API 成功。
- [ ] 查询该测试事件，确认 SQL API 成功且 datasource schema 正确。
- [ ] 通过 Academe Analytics 页面做一次端到端验收。
- [ ] 验收后把实际部署时间、workspace 区域和测试结果更新回本文档；不记录 Token 明文。

### 当前等待项

Tinybird 重建目前仅等待用户新建或选定工作区。用户提供 regional API URL 后，可以继续安装 CLI 和部署 datasource；两个运行时 Token 可以由用户在控制台创建，也可以在 CLI 部署完成后按最小权限创建。Tinybird 未完成前，Academe 主服务可以继续正常运行。

### Tinybird CLI Quick Start 执行记录

- [x] 用户确认已有 Tinybird 账户。
- [x] Git 已安装，版本为 `2.43.0`。
- [x] Docker 已安装且 daemon 正常，版本为 `29.7.2`；Tinybird Local 可用但本次选择跳过。
- [x] Tinybird CLI 已按官方安装命令安装，版本为 `4.6.16`。
- [x] 独立教程目录为 `Academe/tinybird-quickstart/`，所有教程 `tb` 命令均从该目录运行。
- [x] `tb init` 已完成，开发模式为 Cloud branch mode。
- [x] 已登录现有 `Academe` workspace，区域为 `europe-west2 (gcp)`。
- [x] 独立 Git 仓库已初始化，当前分支为 `tinybird_intro`。
- [x] 已将 `.tinyb` 和 `.env.local` 加入教程仓库的 `.gitignore`；认证值不写入文档。
- [ ] 官方出租车示例 datasource 尚未创建。其用途仅为验证官方教程链路，不属于 Academe 业务数据。
- [ ] 在用户再次明确批准前，不向现有 Academe workspace 创建 `trips`、`taxi_zone_lookup` 或 `best_tip_zones`。
- [ ] 建议下一步停止出租车示例，改为从 `apps/api/src/db/tinybird/` 部署 Academe 所需的 `events` datasource。

### 当前文件改动边界审计

- Academe 已跟踪源码当前无 unstaged 或 staged diff。
- 部署配置统一位于 `Academe/deploy/`：`.env`、`.env.example`、`docker-compose.yml`、`nginx/academe.conf`。
- 安装进度统一位于 `Academe/ACADEME_INSTALLATION_STATUS.md`。
- Tinybird 教程文件统一位于 `Academe/tinybird-quickstart/`，并拥有独立 Git 仓库。
- Academe 生产 Tinybird 资源定义仍位于 `Academe/apps/api/src/db/tinybird/`；本轮未修改其中任何文件。

## 14. Academe Tinybird events datasource 建设任务

### 任务目标

在现有 Tinybird `Academe` workspace 中构建并部署仓库定义的 `events` datasource，更新运行时最小权限 Token，并完成写入、查询和应用端 Analytics 验收。

### 已完成

- [x] 已复核固定 schema：8 个字段，MergeTree，按月分区，排序键为 `org_id, event_name, timestamp`，TTL 为 365 天。
- [x] 已确认生产 Tinybird 项目根目录为 `apps/api/src/db/tinybird/`。
- [x] 已确认 CLI 登录现有 `Academe` workspace，区域为 `europe-west2 (gcp)`。
- [x] 已新增 `apps/api/src/db/tinybird/tinybird.config.json`，配置为 branch mode，项目目录为当前根目录。
- [x] 已确认 `tb --cloud build` 不受 CLI 4.6.16 支持；Cloud 构建必须使用 branch，正式发布使用 deployment。

### 待办

- [ ] 在 Tinybird 控制台撤销/轮换本次被 CLI 状态输出回显的认证 Token，再重新登录 CLI；不得在文档中记录 Token。
- [ ] 创建隔离 Cloud branch，用于验证 `events` datasource。
- [ ] 确认构建只包含 `events.datasource`，不部署 `endpoints/*.pipe` 参考文件。
- [ ] 在隔离 branch 执行构建并记录结果。
- [ ] 使用非破坏性 deployment 将 `events` 部署到主 workspace。
- [ ] 创建新的最小权限 Ingest Token 与 Read Token，并撤销旧的 HTTP 403 Token。
- [ ] 将 regional API URL 和两个运行时 Token 仅写入 `deploy/.env`。
- [ ] 重启应用容器并确认三个服务健康。
- [ ] 写入一条带唯一标识的测试事件并确认 Events API 成功。
- [ ] 通过 SQL API 查询测试事件并核对字段/schema。
- [ ] 在 Academe Analytics 页面完成端到端验收。
- [ ] 清理测试事件（若 Tinybird 数据保留机制允许安全清理）或记录测试标识与保留期。
- [ ] 更新本节最终状态、部署时间、验证结果和剩余问题。

### 当前停止点

生产 Forward 项目配置已建立，但尚未创建 Cloud branch、尚未构建或部署 `events`，也尚未修改 `deploy/.env`。下一步必须先轮换已回显的 CLI 认证 Token，然后从生产 Tinybird 项目根目录继续。

## 15. 2026-09-03 Tinybird 与运行数据迁移结果

### Tinybird

- [x] 已刷新曾被回显的个人 Admin Token，旧值已失效，新值未进入文档或日志。
- [x] 已重新登录 `Academe` workspace，区域为 `europe-west2 (gcp)`，角色为 admin。
- [x] Tinybird 自有项目配置已迁移到 `deploy/tinybird/`。
- [x] `deploy/tinybird/prepare.sh` 从上游唯一真实定义生成被 Git 忽略的部署文件，并只追加两个最小权限 Token 声明；未修改上游 datasource。
- [x] 上游目录内早期新增的 `.tinyb` 和 `tinybird.config.json` 已移除。
- [x] 已创建隔离 Cloud branch `academe_analytics`。
- [x] 分支构建成功，只创建 `events` datasource，没有创建 pipe 或 endpoint；生成式 Token 包装也已在分支验证。
- [x] 已核对 8 个字段、MergeTree、按月分区、排序键和上游定义中的 365 天 TTL。
- [x] Tinybird deployment #1 已将 `events` 发布到主 workspace；deployment #2 已发布两个最小权限 Token。
- [x] `academe_events_ingest` 仅有 `APPEND:events`，`academe_events_read` 仅有 `READ:events`，并已安全写入权限 600 的 `deploy/.env`。
- [x] 唯一测试事件写入成功，READ Token 查询命中；测试标识为 `codex_tinybird_verify_20260904T043750Z`。
- [x] 用户已在浏览器确认 Academe Analytics 页面可以正常打开和显示，端到端人工验收通过。

### Runtime data

- [x] 新运行数据目录为 `Academe/runtime-data/{postgres,redis,content,backups}`。
- [x] `runtime-data/.gitignore` 忽略全部数据，只允许跟踪 `.gitignore` 本身。
- [x] 迁移前已生成 PostgreSQL custom-format 逻辑备份并通过 `pg_restore --list` 验证。
- [x] 备份文件大小为 248,803 字节，目录清单包含 710 个 TOC 条目。
- [x] PostgreSQL、Redis 和 content 停机复制后的清单哈希、文件数和字节数与源目录一致。
- [x] Compose 三个 bind mount 已切换到 `../runtime-data/`。
- [x] App、PostgreSQL、Redis 均为 healthy，且实际挂载均位于 `Academe/runtime-data/`。
- [x] PostgreSQL 中组织 `Academe`、slug `metacognix` 和初始化用户仍存在；Redis 保持 3 个 key。
- [x] 本机根路径、API、公网根路径和公网 API 均返回 HTTP 200。
- [x] 用户明确批准后，旧 `/home/dev/RxProjects/Academe-data` 已移入 `/home/dev/.local/share/Trash/files/Academe-data`，当前仍可恢复。

### 已知非阻塞项

- Redis 启动日志提示宿主机 `vm.overcommit_memory` 未开启；当前 Redis healthy，但后续应完成系统调优。
- 详细迁移证据记录在 `docs/operations/2026-09-03-migration-result.md`。

### 当前下一步

1. 处理 Redis `vm.overcommit_memory` 宿主机调优。
2. 全部任务完成后统一执行 Git 敏感信息扫描、提交和推送确认。


## 16. 2026-09-04 账户设置邮箱修复

- [x] 根因确认：账户设置页调用公开用户接口，`UserReadPublic` 为保护隐私不返回邮箱，导致重新登录后邮箱输入框为空。
- [x] 修复边界：不修改后端公开接口；设置页从当前认证会话补全自己的邮箱。
- [x] 修正邮箱变化提示条件，只有输入值真正不同于初始邮箱时才提示并触发重新登录。
- [x] 新增纯函数与回归测试；目标测试 2/2 通过，并已验证修复前因模块缺失而失败。
- [x] 根 `.dockerignore` 增加 `/runtime-data/`，解决 Docker 构建读取 PostgreSQL 目录失败并避免运行数据进入构建上下文。
- [x] 正式 Docker 构建通过，包括 Next.js 编译与 TypeScript 检查；仅有既有 Turbopack 动态文件访问警告。
- [x] 新镜像已部署；`academe-app` healthy、重启次数 0，本机与公网根页面/API 均返回 HTTP 200。
- [ ] 用户在浏览器确认邮箱正常显示，且仅修改姓名/简介后保存不会退出登录。

### 测试基线说明

完整 Web 测试本次尝试了 20 个测试文件、共发现 227 个用例：221 个通过、4 个断言失败，另有 2 个文件加载错误；Bun 汇总显示为 `221 pass, 6 fail, 2 errors`。失败来自仓库既有缺失模块/导出或当前独立测试依赖环境，与新增邮箱测试无关。目标邮箱回归测试 2/2 通过。

仓库自动化测试文件共 380 个。本轮已尝试 Web 20 个；API 314 个、CLI 16 个、Playwright E2E 30 个均未执行，因此不能表述为全项目测试通过。完整目录、失败项和统计口径见 `docs/operations/2026-09-04-test-inventory.md`。

## 17. 2026-09-04 界面语言刷新持久化修复

- [x] 根因确认：多个语言菜单直接调用 `changeLanguage()`，没有设置 `i18nextLng_userPicked`；刷新后 `OrgLanguageSync` 将用户选择的中文覆盖为组织默认英语。
- [x] 修复边界：不修改后端或数据库；公共语言切换默认记录个人选择，组织默认语言同步显式使用 `userInitiated: false`。
- [x] TDD RED：新增测试在修复前为 1 通过、1 失败，失败值为应写入 `"1"`、实际为 `null`。
- [x] 目标回归：语言偏好与邮箱回归合计 4/4 通过。
- [x] 正式 Docker 构建通过，包括 Next.js 编译和 TypeScript 检查；仅有既有 Turbopack 动态文件访问警告。
- [x] 新镜像已部署；`academe-app` 为 `running/healthy`，重启次数为 0。
- [x] Web 全套重新尝试 21 个文件、229 个用例：223 通过、4 个既有断言失败、2 个既有加载错误，没有新增失败。
- [ ] 用户在浏览器选择中文并刷新，确认仍保持中文。
