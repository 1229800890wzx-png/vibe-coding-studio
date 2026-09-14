# 项目上下文

> 历史说明：2026-09-13 的独立 `platform` 后端、独立 `education` 数据库和后台 overlay 已退役。本文不再记录可执行启动状态。

当前产品采用朋友 PR #1 的橙色 React 官网，保留首页、课程列表与详情、教学方法、导师、作品和咨询体验。官网、`apps/admin` 管理后台、`apps/miniapp` 少儿端均连接 `apps/server` 与统一业务数据库；官网咨询进入原 CRM。

当前架构、真实启动方式、生产配置和回退边界统一维护在 [UNIFIED_BACKEND.md](UNIFIED_BACKEND.md)。产品入口概览见 [仓库 README](../README.md)。不要依据历史提交恢复 `platform/setup-education.py`、旧启动脚本、旧 overlays、字符串主键的旧 `edu_course` 或独立 `edu_inquiry`；统一后端数字主键的原 `edu_course` 继续使用。
