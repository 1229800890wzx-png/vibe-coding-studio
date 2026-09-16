# 首期独立栈记录（历史）

> 本文原先描述 2026-09-13 的独立本机教育栈。该栈使用单独端口、`education` 数据库、字符串主键的旧 `edu_course`、独立 `edu_inquiry` 和 `platform` overlay，现已退役，不能用于启动、初始化或恢复。统一后端数字主键的原 `edu_course` 继续使用。

当前首期能力已迁入统一平台：朋友的橙色官网读取统一课程发布数据，课程列表和详情支持上下架，咨询经统一公开 API 进入原 CRM，运营人员在 `apps/admin` 的“官网管理”与招生工作台跟进。

请使用 [统一后端说明](UNIFIED_BACKEND.md) 中的 `apps/server`、`apps/admin`、`apps/miniapp` 和官网启动命令。生产迁移以 `infra/migration/README.md` 为唯一入口；不要运行历史 seed 或向现有运营库导入旧 SQL。
