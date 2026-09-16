# 运行、发布与恢复手册

本项目是上游服务的教育扩展。下面的生产配置是待填实值、待验收的模板；本次验证本地环境并完成一次独立 MySQL 库的逻辑备份恢复，没有部署生产环境、配置真实商户、上传微信发布包或执行生产恢复。

## 版本与已有环境

| 部分 | 本地实测或固定来源 |
| --- | --- |
| Java | Amazon Corretto 21.0.12.1，发行包 21.0.12.9.1，`.tools/jdk-21` |
| Maven | 3.9.9，`.tools/apache-maven-3.9.9` |
| MySQL | 实际服务 8.4.11；Compose 使用 `mysql:8.4` |
| Redis | Compose 使用 `redis:7.4-alpine`，启用 AOF；具体补丁号需在目标环境记录 |
| Node / 管理端包管理 | 管理端记录 Node 24.14.0 / pnpm 10.32.1；根工程要求 Node ≥22.12 |
| 小程序 CLI | `@dcloudio/* 3.0.0-5020420260813003`，Vue 3.4.21，Vite 5.2.8 |

镜像 manifest digest、JDK 下载地址及 SHA256 见 [runtime-source-lock.json](../infra/runtime-source-lock.json)。部署应固定已审核的镜像 digest；Compose 中的浮动标签是本地兼容入口，不代表未来拉取仍是同一补丁版。

本地凭据位于忽略的 `.runtime/foundation.env`。不要复制它作为生产凭据，不要把 `.runtime`、`.tools`、数据库卷或含上传资料的备份打包进源码发布物。数据库和 Redis 的本地端口只绑定回环：13306、16379；API 为 48080。

## 从空开发环境启动

在仓库根目录执行 PowerShell：

```powershell
pwsh -File tooling/bootstrap/prepare-tools.ps1 -Jdk21
pwsh -File tooling/bootstrap/init-local.ps1 -StartServices
node tooling/bootstrap/generate-schema.mjs
node tooling/bootstrap/init-database.mjs
node tooling/bootstrap/verify-schema.mjs
pwsh -File tooling/bootstrap/start-server.ps1 -Build
```

已有 Ubuntu WSL 引擎可给 `init-local.ps1` 加 `-WslDistro Ubuntu`。初始化器仅接受空库，发现已有表即停止；不要通过删库来绕过它。已有本地库的增量更新入口是 `apply-local-updates.mjs`，使用前检查其中将执行的 SQL，并保留备份。此类开发脚本包含本地测试账号、渠道与内容，不能用于生产初始化。

前端分别使用 [MINIAPP.md](MINIAPP.md) 与 [ADMIN.md](ADMIN.md) 的命令。H5 预览为 `http://127.0.0.1:5174`，生产 H5 文件在 `apps/miniapp/dist/build/h5`；微信产物在 `apps/miniapp/dist/build/mp-weixin`。服务端 Jar 为 `apps/server/yudao-server/target/yudao-server.jar`。

## 生产配置与上线顺序

1. 按 [生产迁移包](../infra/migration/README.md) 审阅公开 DO 推导的 schema 与教育迁移；使用独立 Liquibase validate/preview/migrate 路径。它不是官方完整商城 SQL。使用经审核的迁移创建新生产库、原 RBAC、租户、字典与 QRTZ 表；不导入本地示例会员、mock 渠道、测试交易或未审核课程。
2. 建立专用数据库账号、私网 Redis ACL/TLS、HTTPS 反向代理和备份身份。把 [配置模板](../infra/templates/application-production.example.yaml) 保存到服务器私有目录，改名 `application-production.yaml`。由进程管理器或密钥服务注入模板要求的环境变量，尤其是数据库、Redis、微信和加密配置。
3. 使用 Java 21 运行审核后的 Jar：

```bash
java -Xms512m -Xmx2048m -jar /opt/vibe/yudao-server.jar \
  --spring.profiles.active=production \
  --spring.config.additional-location=file:/etc/vibe/
```

4. API 只接受可信代理转发；代理覆盖外部提供的 Forwarded/X-Forwarded-*，转发真实 HTTPS origin。不要公开数据库、Redis、Druid、Actuator 管理详情。H5 `/app-api`、管理端 `/admin-api` 转发到原 API，保留 Authorization 和 tenant-id。上传限制至少覆盖 30MB 文件，禁止缓存教育文件响应。
5. 在原管理后台配置真实微信登录、短信模板和支付应用/渠道。`yudao.trade.order.pay-app-key` 必须与原支付应用 key 一致。支付应用的业务订单通知指向 `/app-api/trade/order/update-paid`，业务退款通知指向 `/admin-api/trade/after-sale/update-refunded`；渠道回调则使用模板中的 `/admin-api/pay/notify/*` 地址，由原支付服务处理和校验。
6. 注册下节的原 Quartz 任务，再完成真实商户沙箱/小额订单、退款、外部回调与设备验证，最后发布前端和微信审核包。管理员密码、短信签名、隐私协议、课程条款、退款规则与联系渠道由机构配置并确认。

**生产不启用 mock。** 原 `LocalMockPayClientPolicy` 仅允许唯一活动 profile 为 `foundation` 且显式 `yudao.pay.mock-enabled=true`。生产模板同时关闭支付 mock 与认证 mock；不要组合 `production,foundation`，不要设置客户端 `VITE_ENABLE_TEST_PAYMENT=true`。模板还覆盖上游固定短信测试码范围，使用六位随机范围。H5 使用同源 API，微信构建配置组织 AppID、HTTPS API 及合法 request/upload/download 域名。

## 原 Quartz 注册与运维

使用原 `JobController`/`JobServiceImpl` 注册。只插入 `infra_job` 行不会创建实际 Quartz trigger；需要原 API 同时维护 `QRTZ_JOB_DETAILS`、`QRTZ_TRIGGERS`、`QRTZ_CRON_TRIGGERS`。模板设置 JDBC job store、`initialize-schema: never` 与固定 scheduler-name；同一集群节点使用相同名字和 AUTO instanceId，恢复时保留原名字。

| handlerName | cronExpression | 责任 |
| --- | --- | --- |
| eduTradeMaintenanceJob | `0 * * * * ?` | 调用原支付过期检查，再释放过期教育订单；重试尚未派发的迟到付款退款 |
| payNotifyJob | `0/5 * * * * ?` | 原付款/退款业务通知及重试 |
| payRefundSyncJob | `0 * * * * ?` | 原支付渠道退款状态同步 |
| payOrderSyncJob | `0 * * * * ?` | 原支付渠道订单状态同步 |

用具有 `infra:job:create` 权限的管理员 Bearer token 及正确 tenant-id，调用 `POST /admin-api/infra/job/create`：

```json
{
  "name": "教育订单占位与迟到支付恢复",
  "handlerName": "eduTradeMaintenanceJob",
  "handlerParam": "",
  "cronExpression": "0 * * * * ?",
  "retryCount": 3,
  "retryInterval": 1000,
  "monitorTimeout": 30000
}
```

另外三个任务替换名称、handlerName、cronExpression 即可。先 `GET /admin-api/infra/job/page?pageNo=1&pageSize=100&handlerName=...` 查重；存在时使用原更新接口，不重复创建。`PUT /admin-api/infra/job/trigger?id=...` 手动触发，随后查 `/admin-api/infra/job-log/page?jobId=...&pageNo=1&pageSize=10`：新日志 `status=1` 且有 endTime 表示完成。暂停/恢复调用 `PUT /admin-api/infra/job/update-status?id=...&status=2` / `status=1`；状态已一致时跳过。

本地自动注册和断言脚本为 `node tooling/bootstrap/register-jobs.mjs`，它会产生真实本地任务执行记录。重启持久性验证见 `verify-runtime-persistence.mjs --before` 和重启后的无参数运行；它不是备份恢复测试。

日常监控原 `infra_job_log` 失败、`pay_notify_task` 重试、`pay_refund` 未完成、教育 hold 的 REFUND_PENDING/REFUND_FAILED。退款接口或网络超时不能视为退款完成；只有原支付退款确认才能改变教学资格。明确渠道失败会记录 REFUND_FAILED、日志和监护人通知，需要机构在原订单/支付渠道中人工核实，不能直接把数据库状态改成“成功”。

## 私有 COS 与附件授权

本地使用原数据库文件适配器，生产可使用原 `S3FileClient` 对接 COS。通过原 `/admin-api/infra/file-config/create` 创建 `storage=20` 配置，再通过原 `/admin-api/infra/file-config/update-master?id=...` 切为主配置。以下是字段结构，尖括号值必须从机构资源与密钥管理系统取值，不能原样发送：

```json
{
  "name": "VIBE private education files",
  "storage": 20,
  "config": {
    "endpoint": "cos.<region>.myqcloud.com",
    "bucket": "<private-bucket-appid>",
    "accessKey": "<secret-id>",
    "accessSecret": "<secret-key>",
    "enablePathStyleAccess": false,
    "enablePublicAccess": false,
    "region": "<region>"
  },
  "remark": "Private education attachments; access through authenticated edu APIs"
}
```

桶策略也必须为私有；配置项不会替你设置桶 ACL。密钥仅授权所需桶的读写操作，使用受限管理员配置原文件服务；该配置和数据库备份均包含敏感信息。启用对象版本/保留策略并验证恢复流程。课程公开封面应使用单独公开资源路径，不能把私有附件 URL 直接用于公开作品。

当前实现的 `/edu/file/get-url` 返回 `/edu/file/content` 授权代理及请求 headers；即使底层使用 COS，也由服务端每次重验监护人/教师与班期资料权限后读取原文件服务。Bearer token 不进入 URL，响应是 attachment、private/no-store、nosniff。**没有实现给教育客户端直接颁发短期 COS 签名链接**，不要按这种方式配置公开下载旁路。原基础文件接口对 `edu-private/` 路径有额外保护；上线前必须实际验证匿名、其他家长和未分配教师均无法读取。

## 备份、恢复与回滚演练

这一节是完整操作手册。本地运行任务已执行一次独立 MySQL 库恢复，报告 `.runtime/backup-restore-report.json` 为 PASSED：备份 1,620,313 bytes，SHA256 `268d02ebc4697b90d0a60da860063e9249e4bf2c67d8aabb7df060ba72a7dd22`，核验 182 张表、6,502 行、原管理员/会员与教育菜单，源库 `vibe_edu` 未修改，恢复库保留供审阅。这不等于 Redis/COS 的整栈灾备演练。后续实际演练仍先由运行环境负责人确认独立目标、隔离网络、备份目录及停写窗口；不得覆盖当前业务库。生产操作另行安排窗口和责任人。

备份集合必须一致：MySQL 全库（含原会员/交易/支付/退款、教育表、infra 文件元数据、QRTZ 表）、Redis AOF/RDB、COS 对象版本或本地文件目录、部署 Jar/前端产物、迁移版本、加密密钥恢复途径。当前 DB 文件适配器的二进制内容随 MySQL 一起备份。不要只备份 `edu_*`。

以下 Bash 命令仅用于已确认的服务器环境；客户端凭据存于权限受限的 defaults 文件，不在命令行放密码：

```bash
backup_dir=/srv/vibe-backups/approved-run-id
mkdir -p "$backup_dir"
mysqldump --defaults-extra-file=/run/secrets/vibe-backup.cnf \
  --single-transaction --routines --events --triggers --hex-blob \
  --no-tablespaces --set-gtid-purged=OFF --databases vibe_edu \
  > "$backup_dir/database.sql"
sha256sum "$backup_dir/database.sql" > "$backup_dir/database.sql.sha256"
```

先关闭应用写入和调度，协调支付渠道回调的持久化/重试窗口，再获取数据库、Redis、对象存储的一致恢复点。MySQL `--single-transaction` 不能自动冻结 COS 文件或 Redis 状态。Redis 通过原运维客户端等待 BGSAVE 完成后复制一致的 RDB，或按现有持久化流程备份整个 AOF 目录；记录 Redis 版本、实例标识、时间和校验和，不在复制中截断 AOF。

恢复必须在独立实例完成：

```bash
# 先人工核对该凭据文件只连接隔离的恢复实例。
mysql --defaults-extra-file=/run/secrets/vibe-restore-isolated.cnf \
  -e 'SELECT @@hostname, @@port, @@version;'
sha256sum -c "$backup_dir/database.sql.sha256"
mysql --defaults-extra-file=/run/secrets/vibe-restore-isolated.cnf \
  < "$backup_dir/database.sql"
```

恢复 Redis 与相应文件版本，启动同版应用但设置 `--spring.quartz.auto-startup=false` 并阻断真实短信/支付出网。恢复环境不可与生产共用 Redis、对象写入凭据、Quartz 数据库或回调地址。只读核对成员/订单/金额、库存与资格、文件 hash、任务身份和迁移版本；随后在隔离测试渠道验证一条从报名到退款的链路。报告写明恢复耗时、丢失窗口、校验结果和操作人，才能形成可接受的 RTO/RPO。

回滚 Jar/前端不等于回滚数据库。优先采用向前修正迁移；需要回到备份时先核对恢复点之后已经发生的真实支付/退款，以原渠道记录对账，不能靠旧库重复触发退款。不要用开发初始化器、`docker compose down -v` 或覆盖现有卷作为回滚方式。

## 已验证范围与待完成项目

本地可复查报告位于忽略的 `.runtime/*-report.json`，构建日志在 `.tools`。已进行真实本地 MySQL/Redis、原账号/RBAC、原库存/交易/退款、教育权限与 Java21 编译测试；测试支付是受 profile 限制的原 mock 渠道。Miniapp H5 和 mp-weixin 编译、移动宽度浏览器检查已执行。具体最新断言和数量以对应报告为准，不把测试浏览器的请求 fixture 当成真实服务验收。

仍需机构环境验证：真实 AppID 登录和手机号授权、短信渠道、微信支付商户及证书/回调、真实原路退款、HTTPS 与微信合法域名、COS 私有桶配置、微信真机行为及审核、生产容量/备份恢复演练。生产秘钥配置与上述外部系统操作均未在本次执行。

## 上游复用与教育差异

| 能力 | 保留的原执行路径 | 本地教育差异 |
| --- | --- | --- |
| 管理身份与权限 | server system OAuth/RBAC；admin 原登录、动态菜单、权限指令 | edu 菜单与教师/教务数据范围，未增加第二套管理员账号 |
| 家长身份 | server member auth；miniapp sheep/request、user store、token refresh | 孩子档案绑定原 memberId，当前孩子独立于购物车行 |
| 商品和库存 | 原 product SPU/SKU、ProductSkuApi.updateSkuStock | 课程绑定 SPU，班期绑定 SKU；报名/转班/退款用原库存 |
| 购物车与结算 | 原 CartService、TradePriceService、TradeOrderUpdateService | studentId、数量1、同SKU多孩子、expectedPayPrice、EDUCATION=3 |
| 付款和退款 | 原 PayOrder/PayRefund、AfterSaleService、支付渠道和通知任务 | 教育 SPI 控制资格/15分钟占位、KEEP/CANCEL、转班后退当前SKU；无第二套支付后台 |
| 文件 | 原 infra FileService、DB/S3 adapters、FileDO | EduFileService 保存所有权与用途，授权内容代理区分上传和提交 |
| 通知和调度 | 原 NotifyMessageSendApi、JobService、Quartz JDBC | edu_service_update 模板、eduTradeMaintenanceJob |
| 前端 | 原 Vue3 管理端与 UniApp 商城源码 | 教育页面/视觉；保留原业务 API 和支付 providers，未实现小程序内 AI IDE |

可直接核验的代码入口：[教育生命周期](../apps/server/yudao-module-edu/src/main/java/cn/iocoder/yudao/module/edu/service/EduTradeLifecycleService.java)、[报名与转班](../apps/server/yudao-module-edu/src/main/java/cn/iocoder/yudao/module/edu/service/EduEnrollmentService.java)、[文件所有权](../apps/server/yudao-module-edu/src/main/java/cn/iocoder/yudao/module/edu/service/EduFileService.java)、[原订单服务](../apps/server/yudao-module-mall/yudao-module-trade/src/main/java/cn/iocoder/yudao/module/trade/service/order/TradeOrderUpdateServiceImpl.java)、[原售后服务](../apps/server/yudao-module-mall/yudao-module-trade/src/main/java/cn/iocoder/yudao/module/trade/service/aftersale/AfterSaleServiceImpl.java)、[无 edu 依赖的交易 SPI](../apps/server/yudao-module-mall/yudao-module-trade/src/main/java/cn/iocoder/yudao/module/trade/service/education/TradeEducationLifecyclePolicy.java)。前端差异位于 `apps/miniapp/edu`、`apps/miniapp/pages/edu`、`apps/admin/src/views/edu`；完整来源见各应用 `UPSTREAM` 文件。

## 许可证清单

三个上游源码的 MIT LICENSE 原文和版权声明保留在各应用根目录。MIT 来源不代表每个 npm/JVM 依赖都是 MIT。运行 `node tooling/bootstrap/export-license-inventory.mjs` 会在 `infra/templates/license-inventory.json` 记录直接 npm 依赖的已安装版本、声明的许可证、本地 LICENSE/NOTICE 路径与 hash，以及活动服务模块 POM 的直接依赖声明。

管理端原声明的 `dhtmlx-gantt`（GPL-2.0）只被停用 MES 源码引用，已从本部署 package.json、锁文件和已安装依赖移除。原 MES Vue 源码仍随上游来源保留，动态视图白名单排除 MES/BPM 等停用领域；Vite 发布检查拒绝停用视图或 dhtmlx-gantt 进入模块图，活动范围类型检查入口为 `pnpm ts:check:active`。这次处理不构成对其他依赖全部属于 MIT 的声明。

本地发布检查已通过：`pnpm install --offline --frozen-lockfile --ignore-scripts`、`pnpm build:prod`、`pnpm ts:check:active`。`.runtime/admin-release-boundary-report.json` 对照原管理员登录后的真实菜单，核验 108 个活动菜单组件均在发布 manifest；产物包含 193 个活动领域视图条目，扫描 738 个 JS/CSS 文件未发现 dhtmlx 分发标记，构建模块图也未包含停用视图。这是菜单解析与产物检查，不替代每个页面的浏览器交互验收。

该清单不联网、不安装依赖、不修改版权声明，也不是完整传递依赖 SBOM。缺失安装包/许可证、Maven 属性版本和未解析父 POM 会明确标记；发布前需对最终产物的完整依赖、字体/素材、原始 notice 以及非 MIT 声明逐项核验，保留分发所需的原文。原作品素材与上游代码的许可证分别记录。

## 小程序统计配置

本部署在 manifest.json 根、h5、mp-weixin 显式设置 `uniStatistics.enable=false`，关闭框架的默认外部页面统计；这是原平台配置，不新增统计系统。配置语义见 [DCloud 关闭统计说明](https://uniapp.dcloud.net.cn/uni-stat-public#关闭统计)。业务运营统计沿用原后台服务，今后引入新的采集渠道前应先确认实际数据与授权范围。

更改该开关后需重启 UniApp 开发服务器并重新构建：当前固定版本在启动时缓存 manifest 与统计运行时注入判断，仅页面热更新不足以关闭旧进程已经注入的统计代码。发布包与重新启动的预览需分别观察网络请求，不能用配置文本代替运行验证。
