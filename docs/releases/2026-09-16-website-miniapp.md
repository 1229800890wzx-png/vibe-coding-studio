# 官网、小程序与统一平台版本记录

代码整理时间：**2026-09-16 16:10:04 +08:00（北京时间，Asia/Shanghai）**。

仓库：`1229800890wzx-png/vibe-coding-studio`。完整版本分支：`codex/unified-platform`，对应 [PR #3](https://github.com/1229800890wzx-png/vibe-coding-studio/pull/3)，合并目标为 `master`。本记录表示代码提交与上传版本，不表示已部署到生产。

## 本次内容

| 部分 | 代码位置 | 主要变化 |
| --- | --- | --- |
| 官网 | `src/`、`public/` | 暖白橙配色、玻璃卡片和精细边框、自托管中文及英文艺术字体、表单与键盘交互 |
| 官网课程 | `src/course-explorer.jsx`、`src/course-lessons.js` | 用课程说明与互动练习介绍编程基础、大模型、Agent、Vibe Coding、Skill、MCP；保留真实后台课程与咨询接口 |
| 导师介绍 | `src/mentor-page.jsx`、`src/mentor-profiles.js` | 13 所大学校徽连续滚动，加入乔明君和薛煌的团队提供资料；未提供照片留空 |
| 小程序宣发 | `apps/miniapp/pages/studio/` | 原生课程、导师、方法和作品介绍，与官网视觉和内容衔接 |
| 小程序班期 | `apps/miniapp/edu/course-schedule.js` | 周中双晚、周末上午和晚间独立班；12 节 1500 元活动价，前 4 节 300 元，续报抵扣后补 1200 元学习剩余 8 节 |
| 家长学习中心 | `apps/miniapp/pages/tab/`、`pages/edu/` | 孩子切换、下一次课、课表进度、作业、已发布导师反馈、成长报告、订单与服务入口；加载失败重试和旧账号/旧孩子响应隔离 |
| 统一平台 | `apps/server`、`apps/admin`、`infra/migration` | 保留本 PR 已有的统一服务端、后台和数据库迁移，本次页面更新不追加数据库变更 |

小程序另有导师 A/B 的明确占位介绍，不构造预约教师 ID。课程宣传价和抵扣规则已进入展示与咨询，自动抵扣入账仍需原后台商品、已支付订单和报价支持。课表时间进度不当作实际出勤或付费权益余额。

## 提交来源

- 官网提交：`f864f719`，分支 `codex/website-glass-type`。
- 小程序提交：`10275010`，分支 `codex/unified-platform`。
- 官网与小程序本地汇总：`2f5d91a7`，已同时包含以上两部分代码。
- 各提交均保留 Git 作者时间与时区，最终上传时间另记录在 PR 描述。

## 验证

- 汇总后的官网 `npm.cmd run check` 与 `npm.cmd run build` 通过。
- 小程序 `npm.cmd --prefix apps/miniapp test`：9 项通过。
- 9 月 16 日实现轮次的 H5、微信小程序生产构建通过；微信主包 1,993,863 字节（约 1.90 MiB），总包约 2.31 MiB。
- 同日通过 16 项家长中心浏览器检查、12 项班期与咨询回归，覆盖 360px、390px 和桌面、加载失败重试、多孩子慢响应、登录状态更新、课程/订单跳转与真实数字 ID 传递。
- 浏览器交互与提交检查使用隔离演示 API，不代表真实支付、退款或抵扣入账已验证。真实部署仍需有效 AppID、API 域名、后台服务及正式账号联调。
- 官网此前的交互与可访问性验收见 `docs/verification/2026-09-15-*.md`；统一后台既有验收见 `docs/UNIFIED_BACKEND.md`。
- 上传内容不含数据库、私有环境配置、凭据、运行日志、依赖目录或构建产物。暂停中的课程 PDF 重做稿及渲染缓存仍保留在本地。

运行与部署命令见根目录 `README.md`、`docs/UNIFIED_BACKEND.md` 和 `apps/miniapp/STUDIO-INTEGRATION.md`。
