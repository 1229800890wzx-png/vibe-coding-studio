# 本地基础环境与上游来源

后端完整保留 [YunaiV/ruoyi-vue-pro 固定提交](https://github.com/YunaiV/ruoyi-vue-pro/tree/8e43004cf68a405cd3485f98f8a539b97ca6544a) 的 MIT 源码，提交号为 `8e43004cf68a405cd3485f98f8a539b97ca6544a`。归档 SHA256、许可证和变更说明见 `apps/server/UPSTREAM.json`。没有嵌套 `.git`，没有获取受限商城 SQL 附件。

导入后对 server 的 `application.yaml`、`application-local.yaml`、`application-dev.yaml` 做了限定范围的去演示凭据处理：替换为环境变量、移除注释中的示例密钥、关闭认证 mock，默认 profile 改为 foundation。可复现脚本为 `tooling/bootstrap/sanitize-upstream-config.mjs`。原始公开 SQL 和未启用模块测试示例保留用于来源审计；运行初始化器不会导入外部凭据。

启用原 `system`、`infra`、`member`、`pay`、`mall`（product/promotion/trade/statistics）；教育功能放在独立 `edu` 模块。原 CRM 已启用，复用线索、负责人、团队和跟进。合同/回款审批以可选 `crm-bpm` profile 集成，默认不启用 BPM；该可选组合未验收。

原会员账号、系统管理员/RBAC、商品 SKU 库存、商城订单、支付单、售后和退款单均复用上游实现。原 `MockPayClient` 仅在**唯一活动 profile 为 `foundation` 且显式开启 `yudao.pay.mock-enabled`** 时注册；生产、默认及 `prod,foundation` 组合均拒绝 mock。认证 mock 在 foundation 中关闭。

## 数据库来源与限制

`node tooling/bootstrap/generate-schema.mjs` 生成以下可审阅文件：

- `infra/database/20-public-business-models.sql`：从 95 个公开业务 DO、继承字段和上游租户拦截器推导的 MySQL 表与列。
- `infra/database/source-manifest.json`：逐表/逐列记录 DO 来源、当前源码 SHA256、Java 类型、MySQL 类型以及公开 H2 测试 SQL 的类型提示来源；明确区分 公开上游字段与原购物车/订单项的 student_id、原 CRM 的五个教育来源字段。

表名和字段采用固定提交的当前 DO；测试 SQL 仅作为类型提示，因此不会遗漏 `trade_cart`、`trade_config`、`trade_order_log`、`member_user.register_terminal` 等当前代码所需字段。上游 `TenantDatabaseInterceptor` 也会对未标注 `@TenantIgnore` 的普通 BaseDO 添加 `tenant_id`，生成器包含该规则。

这是**公开源代码推导的本地开发 schema**。它不等同于官方完整商城 SQL，不声称恢复了官方所有长度、约束、索引和历史迁移；生产发布前仍需审阅业务约束和迁移。本地启动和交易验收通过实际 MySQL 8.4 执行验证；`verify-schema.mjs` 逐列检查数据库与公开模型一致。

系统/基础设施使用公开 `apps/server/sql/mysql/ruoyi-vue-pro.sql`。初始化只导入原 RBAC、字典和租户等必要种子，排除上游演示日志、云存储、短信、邮件等外部凭据；保留原管理员 ID 1，重置为随机本地密码并停用其他演示账号。文件存储使用原数据库存储适配器。

`21-public-model-reconciliations.sql` 依据实际退款失败修正原订单 `refund_point`：历史 NULL 回填 0，新建订单默认 0，保持原退款服务。`22-local-brand-baseline.sql` 隐藏未启用领域和外部演示文档的顶级菜单、停用其他演示租户、将租户 1 改名为 VIBE CODING；原菜单、租户、RBAC 记录保留。教育异步支付回调沿用上游可空审计字段，避免无交互身份时插入失败。

## 启动

需要 Node 22+、本地 JDK 21，以及可用的 Docker Engine。Maven、可选 Corretto 21 下载到忽略的 `.tools`，不全局安装。`infra/runtime-source-lock.json` 记录本次官方 JDK 下载 URL/SHA256 和 MySQL/Redis 镜像摘要。上游源码兼容目标仍为 Java 17；本次构建和最终运行环境为 Java 21。

```powershell
pwsh -File tooling/bootstrap/prepare-tools.ps1 -Jdk21
pwsh -File tooling/bootstrap/init-local.ps1 -StartServices
node tooling/bootstrap/generate-schema.mjs
node tooling/bootstrap/init-database.mjs
node tooling/bootstrap/verify-schema.mjs
pwsh -File tooling/bootstrap/start-server.ps1 -Build
```

服务启动后，在第二个终端运行 `node tooling/bootstrap/register-jobs.mjs`。它通过原任务 API 注册教育维护、原支付通知重试、原支付状态同步、原退款状态同步四项任务，并等待新的成功执行日志。Quartz 使用公开上游 JDBC DDL、独立 `vibeEduScheduler` 名称和原 JobService；干净初始化不导入公开 SQL 中序列化的演示任务。已有开发库升级使用 `node tooling/bootstrap/apply-local-updates.mjs`，该脚本仅做明确的增量修改，不删除业务数据。

初始化要求 `vibe_edu` 库为空，检测到现有表会立即停止并保留数据。不要将此开发初始化器用于既有数据库或生产环境。教育表/菜单 SQL 存在时会在原业务表之后执行；教育 schema 由单独模块维护，生成器不扫描教育模块。

端口全部绑定回环：MySQL `127.0.0.1:13306`、Redis `127.0.0.1:16379`、API `127.0.0.1:48080`。Compose 项目固定为 `vibe-edu-foundation`，使用专属命名卷。

生成凭据只存在被忽略的 `.runtime/foundation.env`；管理员用户名为 `admin`，本地会员手机号为 `13900000001`。对应原商品/SPU、SKU、会员、支付应用和渠道 ID 都是 `10001`。会员与管理员通过原密码登录 API 登录，数据库保存 BCrypt 哈希。

第二个原会员 `13900000002` 用于跨家长权限验收，密码引用同一份本地环境文件。测试脚本新建的员工仍使用原 `system_users`、原角色和原登录接口。上传限制为单文件 30MB、请求 32MB。运行 jar 复制到 `.runtime/server-run.jar`，避免 Windows 文件锁阻止后续 Maven 打包。启动前自动检查当前 1139 个相关 Java 源文件与编译时间、foundation 配置，发现编译后到达的修改会拒绝启动旧产物；`.runtime/backend-build-report.json` 记录当前 jar SHA256。

### 已有 WSL Docker Engine

本机 Windows Docker Desktop 的 inference Unix socket 异常曾导致引擎启动失败；未执行 factory reset，也未删除其数据。可使用独立、已安装的 Ubuntu WSL Docker Engine。先执行 `init-local.ps1` 生成环境，再运行：

```powershell
pwsh -File tooling/bootstrap/init-local.ps1 -StartServices -WslDistro Ubuntu
```

脚本自动转换实际工作目录的 WSL 路径。若 WSL 无法直连 Docker Hub，可用 Windows 现有代理通过官方 `google/go-containerregistry` 的 portable `crane pull --platform linux/amd64` 下载原 `mysql:8.4`、`redis:7.4-alpine` 镜像 tar，再用该 WSL 引擎 `docker load -i` 导入。无需修改 Docker daemon 或全局代理配置。

## 验证

```powershell
node tooling/bootstrap/verify-schema.mjs
node tooling/bootstrap/verify-upstream-flow.mjs
node tooling/bootstrap/verify-education-flow.mjs
node tooling/bootstrap/verify-education-permissions.mjs
node tooling/bootstrap/register-jobs.mjs
```

交易脚本依次验证匿名/认证 mock 拒绝、原管理员登录和 RBAC、原会员登录、SPU、服务端报价、原交易单和支付单、原 mock 支付、原售后审批和退款。它产生真实的**本地测试**交易记录，验证结果写入忽略的 `.runtime/upstream-flow-report.json`，不输出 token 或密码。

支付 profile 隔离的四个测试（构建前设置 `JAVA_HOME` 为 `.tools/jdk-21` 的绝对路径）：

```powershell
.tools/apache-maven-3.9.9/bin/mvn.cmd -B -ntp -s tooling/bootstrap/maven-settings.xml -f apps/server/pom.xml -pl yudao-module-pay -am -Dtest=LocalMockPayClientPolicyTest -Dsurefire.failIfNoSpecifiedTests=false test
```

持久化验证先执行 `node tooling/bootstrap/verify-runtime-persistence.mjs --before`，正常重启本地后端后执行不带参数的同一脚本。它验证原任务 ID/cron 保留并执行新日志，另外在 MySQL 临时表中运行同一份 NULL 修复迁移，不修改真实订单。

备份恢复：`node tooling/bootstrap/verify-backup-restore.mjs` 使用已有 WSL Docker Engine 内的官方 `mysqldump --single-transaction`，在忽略目录 `.runtime/backups` 保存快照，并恢复到新建的 `vibe_edu_restore_<时间>` 库。逐表比对快照行数，验证原身份、品牌、教育菜单与模板。原库不清空；恢复库保留供审阅。可用 `VIBE_WSL_DISTRO` 指定已有发行版，默认 Ubuntu。备份含密码哈希和业务数据，和环境文件一样只保存在本地忽略目录。

## 验收记录

2026-09-12 至 2026-09-14 本机实际结果：

| 验证 | 结果与证据 |
| --- | --- |
| 从空库启动原基础环境 | MySQL 8.4.11，初次 171 表；随后增加公开 Quartz 11 表，共 182 表。`.runtime/database-init-report.json` 保留首次记录，`.runtime/schema-verification-report.json` 记录当前 95 个公开业务模型及已登记的本地扩展字段均存在。 |
| Java 21 编译及单元测试 | Corretto 21.0.12.1，完整 Maven package 成功；45 项选定测试通过，包括原支付 profile 隔离、购物车、报价、身份、退款并发保护、教育生命周期、规则、数据权限与私有文件路径。`.tools/backend-java21-final.log`；随后排课修复的 13 项相关测试及完整打包再次通过；最终 CRM/点评/权限改动又通过 22 项相关测试及完整打包，见 `.tools/backend-java21-final-gaps.log`。这些运行含重复用例，不将次数相加为独立覆盖数。 |
| 原系统/会员/商城/支付/售后 | 13 项实际接口断言通过，包含原报价 9900 分、创建订单、mock 支付及原售后退款完成状态 50。`.runtime/upstream-flow-report.json`。 |
| 教育服务链路 | 18 项实际断言通过：8 课时版本发布、原 SPU/SKU、体验预约与原库存、总部不可读取家长私有草稿、作业/点评/成长报告发布、作品授权及撤回。`.runtime/education-flow-report.json`。 |
| 原 RBAC 与数据范围 | 13 项实际断言通过：SELF 教师未分配时不可访问班期/学员/作业，分配后仅可访问对应班期；部门范围教务不可跨校区访问。`.runtime/education-permissions-report.json`。 |
| Quartz 重启与数据库默认值 | 4 项原任务注册及新执行成功，重启后 ID/cron 保留；实际 MySQL 临时旧数据 NULL 回填与新行默认值验证通过。`.runtime/runtime-persistence-report.json`。 |
| 备份恢复 | 独立新库恢复 182 表、6502 行，逐表符合快照；原身份、品牌、42 个教育菜单、通知模板保留。`.runtime/backup-restore-report.json`。 |

API 运行证据是原登录/业务接口成功及 Java 21 启动日志；此最小依赖组合没有安装 Actuator 健康端点，不能以 `/actuator/health` 作为已启用探针。真实微信 AppID、商户号、证书与正式渠道回调尚未配置，本地原 mock 支付验收不等同真实渠道验收。并发交易、到期/迟到支付和前端验收结果由对应专项报告记录。

生产可执行初始化与增量迁移使用独立 [Liquibase OSS 包](../infra/migration/README.md)，已在新 MySQL 隔离库证明空库初始化、无测试记录、幂等与引擎校验和。它与本文件中的开发初始化器分开。当前公开报告副本统一见 [验证目录](verification/README.md)。
