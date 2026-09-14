# 统一后端部署说明

## 架构与入口

官网、管理后台和少儿端共用一个 Spring Boot 后端与一套原业务模型。官网静态站由 `serve.mjs` 提供，`website-proxy.mjs` 仅转发公开 allowlist；管理后台使用原系统登录、菜单、角色和数据范围；少儿端继续使用原会员、课程、班期、订单、支付与学习接口。

本地统一验收端口为官网 `4175`、管理后台 `49091`、API `48081`。该环境连接备份恢复得到的 `vibe_edu_restore_<timestamp>`。只读审计确认原库业务数据保留：177/182 张表逐行完全一致，pay/trade/edu/CRM 均无行或字段变化；原服务仍在运行，因此 3 张 Quartz 运行状态表、`infra_job_log`（+1653）和 `infra_api_access_log`（+3）继续产生运行记录。生产部署应使用正式域名、TLS、独立生产数据库与 Redis，不能照搬本地端口。

后台“教育管理 → 官网管理”入口使用 `edu:website:query`；内容新增、编辑、发布分别要求 `edu:website:create`、`edu:website:update`、`edu:website:publish`。官网咨询进入原 `crm_clue`，保留来源、处理状态和运营备注；`edu_website_admission_receipt` 只保存幂等回执与请求摘要。`edu_website_offering` 是官网展示卡片及发布版本，可选关联原课程，但不替代原课程、班期、SKU、库存或订单模型。

## 网关和配置

生产官网使用 `infra/templates/website.nginx.example.conf` 的公开路径 allowlist。网关固定写入机构 `tenant-id`，清空浏览器传入的认证和转发头，并只把真实客户端地址写入 `X-Vibe-Client-IP`。后端 `VIBE_WEBSITE_TENANT_ID` 必须与网关租户一致；`VIBE_WEBSITE_TRUSTED_PROXIES` 只列实际反向代理节点，不能信任公网来源。管理接口放在单独、需要认证的管理域名，官网 vhost 必须拒绝 `/admin-api/`。

官网现有展示内容可由运营后台录入或发布。原演示数据库只用于本地开发和验收，未作为网站内容导入生产迁移包，也不能被当作生产初始化数据。

生产首次上线按顺序执行数据库迁移，再运行官网内容导入。`tooling/bootstrap/import-website-content.mjs` 通过统一管理 API 读取 `infra/website-content.json`，只依赖 Node.js 内置模块；通过 `VIBE_API_TARGET`、`VIBE_WEBSITE_TENANT_ID` 和 `VIBE_ADMIN_TOKEN` 指向已部署后端。默认仅预览，审核后使用 `--apply`：脚本只创建缺失 slug 并发布，任何状态的已有 slug 都完整保留；若创建后发布失败，草稿留给后台人工处理，不会被再次覆盖。内容文件保持官网首页的三个课程方向一致。

## 构建与发布

`node scripts/package-unified.mjs` 只打包已经构建的官网、管理后台、后端 JAR、少儿端 H5/微信小程序、迁移资产、配置模板、许可证和部署文档。输出位于唯一的 `output/unified-release-<timestamp>`，并包含逐文件 SHA-256 清单和 ZIP。包中不含 `.runtime`、`.tools`、数据库备份、私有环境文件或 `node_modules`。

仓库中的实际构建命令如下；生产少儿端须先注入下一段所述实值：

```powershell
npm run build
npm --prefix apps/admin run build:prod
npm --prefix apps/miniapp run build:h5
npm --prefix apps/miniapp run build:mp-weixin
& .tools/apache-maven-3.9.9/bin/mvn.cmd -f apps/server/pom.xml -pl yudao-server -am package -DskipTests
node scripts/package-unified.mjs
```

完整解压发布 ZIP 后，可在包根目录用内置 Node 静态服务启动官网；它不需要 `node_modules`：

```powershell
$env:PORT='4177'
$env:VIBE_API_TARGET='https://api.example.com'
$env:VIBE_WEBSITE_TENANT_ID='1'
node website/scripts/serve.mjs
```

迁移启动器随包位于 `tooling/bootstrap`。Windows 管理机先安装 Node.js，并自行准备 Java 21 与 Maven 3.9.9；也可在联网审核环境运行 `powershell -File tooling/bootstrap/prepare-tools.ps1 -Jdk21` 下载并校验工具。工具会写入包根目录的 `.tools`，该目录是运行时依赖且不包含在发布 ZIP。随后按 `infra/migration/README.md` 使用工作区外的私有连接文件执行迁移。

生产少儿端必须在构建前配置真实 API 地址和微信 AppID，然后重新构建 H5 与 `mp-weixin`；本地验收构建不能直接发布。后端模板中的数据库、Redis、OAuth、微信、短信、支付、COS 与公网回调值也必须由生产密钥管理系统提供。

## 数据库升级与回退

生产迁移共有 10 个 Liquibase changeset。001–008 是冻结的初始基线；009 添加官网咨询回执和 CRM 扩展；010 添加官网内容及权限。任何环境执行后都不得修改历史 SQL、清除 Liquibase checksum 或刷新基线，只能追加前向变更。

应用回退时保留 `edu_website_admission_receipt` 和已经进入 `crm_clue` 的线索。先停止新官网流量或把官网切为维护页，再回退静态资源或应用 JAR；不要删除回执来“重试”咨询，也不要重新启动旧后端与新后端同时接收写请求。若需兼容旧版本，先写明确的前向兼容迁移并验证单写路径。

## 已完成的隔离验收

当前已有证据包括：43 个最终选定 Java 测试通过、9 组统一 API 验收通过、education flow/permissions/discovery/trade/admissions 回归通过、10 个生产迁移重复执行与 checksum 拒绝验证通过，以及微信小程序、H5、管理后台和官网构建通过。浏览器验收 20 项全部通过，其中包括 10 组截图像素差为 0、3 条真实闭环以及权限、内容 hash 和禁用态补验。统一 API 还验证了后端重启后旧 receipt 完全相同及 4 种错误码精确映射。

首次隔离 trade 回归超时的原因是恢复库复制了 `pay_app` 中指向本地 48080 的回调，并非交易业务断言失败。两次错误回调到达原服务后分别被“交易订单不存在”和“售后单不存在”拒绝，没有向真实支付渠道发请求。隔离准备步骤随后只在恢复库中把 `pay_app` 以及订单、退款、转账和通知任务的 loopback 回调改到 48081，并增加回归前置校验；复跑 trade 与 admissions 全部通过。原业务数据经逐行核对保留，原服务运行日志和任务状态在验收期间继续变化，详细证据见 `docs/verification/2026-09-14-unified-backend.md`。
