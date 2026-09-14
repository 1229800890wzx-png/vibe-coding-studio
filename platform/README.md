# 芋道首期后台源码与复现

本目录提交增量源码、锁定上游版本和启动脚本。上游完整源码、依赖、数据库、账号、令牌与日志不提交。实际验证记录见 ../docs/FIRST_RELEASE.md。

## 复现步骤

1. Python 运行 `python platform/bootstrap.py`，下载 upstream.json 指定的两个上游 commit，并应用 overlays。已有目标目录时拒绝覆盖，避免丢失二次修改。网络需要时配置标准 HTTPS_PROXY。
2. 后端目录 `platform/vendor/ruoyi-vue-pro-8e43004cf68a405cd3485f98f8a539b97ca6544a` 执行 `mvn.cmd -B -DskipTests package`。
3. 管理端目录 `platform/vendor/yudao-ui-admin-vue3-master` 执行 `npx.cmd --yes pnpm@10 install --frozen-lockfile`，再执行 `node node_modules/vite/bin/vite.js build --mode education`。
4. 当前仓库根目录执行 `npm.cmd ci` 和 `npm.cmd run build`。
5. PowerShell 7 执行 `./platform/start-education-data.ps1`，再执行 `./platform/start-education-backend.ps1`。等待 48080 启动成功后执行 `python platform/setup-education.py`，初始化运营菜单、课程并修改默认管理员密码。
6. 执行 `./platform/start-education.ps1`。官网 4173，后台 4180，API 48080。管理员为 admin，随机密码仅保存在本机 AppData/Local/CodexEducation/runtime/admin-account.json。

这些是当前 Windows 机器的本地运行脚本：Java 17、Maven、Node 22+、MySQL 二进制 E:/DevPath/mysql、Redis 二进制 E:/DevPath/Redis-x64-5.0.14.1。换机器须调整二进制路径。MySQL/Redis 数据目录位于 LOCALAPPDATA/CodexEducation/runtime，独立端口 3308/6388，不覆盖系统已有 MySQL。已有 database-initialized 标记时不重复导入上游表。

当前工作区已启动的服务使用仓库外的旧 vendor 快照；本次打包未迁移或重启它们。overlays 来自已编译和验证的相同文件。bootstrap 下载/覆盖流程本次只做语法核查，未重复初始化整套环境。

## 复用边界与许可

复用芋道登录、权限、Vue 管理框架、数据库连接与限流。课程和咨询是新增最小教育模块，位于 infra；未启用商城交易与 CRM。上游仓库为 MIT，下载包保留其 LICENSE。overlays 包含上游文件的修改版本，原有版权说明保留；许可证副本随本目录保存。

备份：`python platform/backup-education.py`。接口验收：`python platform/verify-education-api.py`。浏览器脚本在 scripts/verify-education.cjs 与 verify-admin.cjs；本地登录状态准备脚本不会打印凭据，不得提交运行产生的认证状态文件。

这是本机可运行首期，不是公网生产部署。正式发布需要 HTTPS、受维护的 Redis 环境及正式机构内容。
