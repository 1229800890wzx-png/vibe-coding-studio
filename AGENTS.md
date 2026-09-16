# 项目协作

- 接手先读 `README.md` 与 `docs/UNIFIED_BACKEND.md`；生产迁移看 `infra/migration/README.md`。
- 当前官网采用朋友 PR #1 的橙色 React 页面。保留其首页、课程列表与详情、教学方法、导师、作品和咨询体验，不恢复旧蓝白视觉。
- 官网、管理后台和少儿端统一使用 `apps/server`、同一套迁移和业务数据库。不得恢复 `platform` 旧独立后端、旧后台 overlay、旧字符串主键的 `edu_course` 或独立 `edu_inquiry`；统一后端原有的数字主键 `edu_course` 继续使用。
- 官网咨询成功必须以后端回执为准并进入原 CRM，不得退回本地假提交。
- Windows 文档与命令示例保留 `npm.cmd` / `npx.cmd`；官网检查使用 `npm.cmd run check`，构建使用 `npm.cmd run build`。
- 不运行 seed 覆盖运营内容。`infra/website-content.json` 仅是缺失 slug 的默认导入清单，导入工具默认预览且不覆盖已有数据。
- 不提交数据库、凭据、运行日志、`.runtime`、`.tools`、`node_modules` 或构建产物。
