# 生产数据库迁移包

此包为新生产环境提供独立于开发 fixtures 的 MySQL 8.4 初始化和后续版本迁移路径。本次只对新建的本地隔离数据库进行了验证，没有连接或部署生产环境。完整部署与灾备职责见 [运行手册](../../docs/OPERATIONS.md)。

使用 **Liquibase OSS 4.33.0** 的原生 CLI、DATABASECHANGELOG 校验和与 DATABASECHANGELOGLOCK。源码许可证为 [Apache 2.0](https://github.com/liquibase/liquibase/blob/v4.33.0/LICENSE.txt)。此版本原 liquibase-maven-plugin 会附带 liquibase-commercial，因此这里通过 exec-maven-plugin 启动明确声明的 liquibase-core 与 Picocli，不引入 commercial artifact。Maven 仅负责固定依赖；没有自制迁移账本或 SQL 执行器。后续升级迁移引擎前重新审核许可证与兼容性，不能把 4.33 的许可证结论套用于其他版本。

固定 v4.33.0 的 [LICENSE 原文](notices/liquibase-4.33.0-LICENSE.txt) 和 [来源/哈希记录](notices/source.json) 随包保留。已核对该 tag 根目录，没有单独 NOTICE 文件，未编造版权声明。该依赖属于独立迁移构建工具，不装入 Spring Boot 应用；依赖 POM 仍显式列出 CLI、Picocli 与原 MySQL JDBC 驱动版本。

## 内容与来源

[source-manifest.json](source-manifest.json) 记录固定公开源码、结构覆盖、每个 SQL/XML/POM 的 SHA256。初始 8 个变更集包含：

| 变更集 | 内容 |
| --- | --- |
| 001 | 固定公开 root SQL 的原 system/infra 建表语句；排除 DROP、历史 INSERT 和原示例账号 |
| 002 | 公开 DO/Mapper/测试 DDL 对齐后的 95 个原 member/pay/mall/CRM 业务表 |
| 003 | 28 个教育增量表，含点评 revision 和试课原 CRM 线索关联 |
| 004 | 原公开 Quartz 11 表；按 FK 依赖排序，不关闭约束、不导入示例任务 |
| 005 | 原菜单、字典定义；不导入令牌、日志或用户历史 |
| 006 | 一品牌租户、一个原管理员/角色/部门、原 OAuth 客户端、必要原会员/交易配置和教学交付字典 |
| 007 | 教育/招生/运营菜单、原角色映射和原站内信模板 |
| 008 | 原模型计数默认值修正，保留现有非空值 |

不包含测试会员、产品 SKU、课程、孩子、订单、退款、支付应用/渠道、文件存储配置、Quartz 作业或 curriculum 草稿。真实渠道、COS、客服/协议、招生受理人和正式教学内容由机构在原后台配置。原 Quartz 作业仍需通过原 JobService API 注册，不只插 infra_job 表。单租户名为 VIBE CODING，校区沿用原部门数据范围；不创建另一套账号、订单或库存。

第一变更集只接受空业务库，存在未纳入本包的业务表即停止；它不会清库或自动“接管”已有生产库。已有其他版本库必须先完成结构差异评审并编写明确的前向迁移，不能用 baseline、clearCheckSums 或删表强行通过。现有开发库 vibe_edu 也不是该初始化目标。

## 生成与校验

```powershell
node tooling/bootstrap/generate-production-migrations.mjs --check
```

发布前构建资产时使用 `generate-production-migrations.mjs`。本仓库初始包尚未正式部署；只有这段未发布阶段审阅源码变化后，才使用 `--refresh-unreleased` 同步生成资产，再对新隔离库重跑验证。一旦任何真实环境应用了某变更集，冻结该文件和 logicalFilePath，新增后续变更集；不能再刷新初始包。

## 运行

把 [connection.example.json](connection.example.json) 复制到工作区外或忽略的受保护目录，填写精确数据库名、专用迁移账号、BCrypt 管理员密码哈希、独立随机 OAuth 密钥和批准的 HTTPS 管理端回跳地址。示例不是可用凭据。BCrypt 沿用原 Spring Security 密码格式；没有内置默认密码。后续验证仍使用这一套迁移参数；改管理员密码通过原用户服务处理，不修改历史引导变更集。

Windows 本地管理机使用仓库便携 Java21/Maven：

```powershell
node tooling/bootstrap/run-production-migrations.mjs validate C:/secure/vibe-migration.json
node tooling/bootstrap/run-production-migrations.mjs preview C:/secure/vibe-migration.json
node tooling/bootstrap/run-production-migrations.mjs migrate C:/secure/vibe-migration.json
node tooling/bootstrap/run-production-migrations.mjs status C:/secure/vibe-migration.json
```

生产连接默认要求 JDBC `sslMode=VERIFY_IDENTITY`；目标 CA 需在运行 Java 的信任库中配置。专用账号只授予目标 schema 所需 DDL/DML 权限。脚本不创建数据库、用户或生产服务，不将密码传入进程命令行。原生 Liquibase CLI 也可在其他操作系统用同版依赖执行本 changelog；当前便利启动器与本地验证环境为 Windows，不能把 PowerShell 启动器直接当 Linux 运维脚本。

preview 调用原生 `update-sql`，生成的 SQL 位于忽略的 `.runtime/production-migration/<database>/preview.sql`，不会应用业务 DDL/种子。Liquibase validate 在首次运行时会建立自己的两个元数据表；这项行为在验证报告中单独记录。预览含引导哈希/OAuth 参数，应保存在受保护位置；普通日志会替换这些值。执行前核对预览目标和变更集，再使用 migrate。MySQL DDL 并不随事务整体回滚；中断后先核对 Liquibase 已执行记录和真实表结构，按前向迁移修复，不重置账本。

## 独立本地证明

```powershell
node tooling/bootstrap/verify-production-migrations.mjs
```

验证器只创建唯一名 `vibe_edu_migration_test_<timestamp>` 的独立 MySQL 8.4 库，复用现有本地容器，不修改 vibe_edu 的业务数据，也不删除已存在的数据库。连接配置随机生成并留在忽略目录。验证内容：

- 原生 SQL 预览不应用业务表/数据，记录 Liquibase 自身元数据初始化。
- 182 张原/教育表与两个 Liquibase 元数据表全部创建；8 个变更集有引擎校验和且锁已释放。
- 仅一个原管理员/品牌租户；29 个交易/身份/教学/文件/渠道/日志表无测试记录。
- 当前点评修订号、原 CRM 5 字段和试课关联存在。
- 重跑 migrate 幂等，原执行记录不变。
- 仅在新隔离库故意改一个引擎校验和，原 validate 必须拒绝；随后恢复这一测试值并验证通过，未调用 clearCheckSums。

实际报告为 `.runtime/production-migration-report.json`，该库保留供审阅。此证明验证迁移包与约束，不代表真实 AppID、商户、COS、Redis 灾备或生产流量验证完成。
