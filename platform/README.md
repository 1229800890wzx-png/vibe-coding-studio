# 旧独立教育栈迁移说明

`platform` 曾用于下载固定上游快照、套用独立教育后端与后台 overlay，并启动单独的 `education` 数据库。该方案已经退役，不能再作为启动、初始化、备份或验收入口。

当前实现位于 `apps/server`、`apps/admin`、`apps/miniapp` 和仓库根目录的 React 官网；数据库迁移位于 `infra/migration`。统一架构、启动和发布流程见 `../docs/UNIFIED_BACKEND.md`。不要恢复旧 setup、启动脚本或 overlays，它们会重新引入第二套接口、字符串主键的旧 `edu_course` 和独立 `edu_inquiry`。统一后端数字主键的原 `edu_course` 继续使用。

本目录仅保留 `upstream.json` 作为旧方案的上游版本来源记录，以及 `LICENSE-backend`、`LICENSE-admin` 两份上游许可证。当前应用的实际版本与许可应以各应用源码、锁文件和统一发布清单为准。
