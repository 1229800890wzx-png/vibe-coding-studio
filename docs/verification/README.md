# 本地验证报告

导出时间：2026/9/14 08:01:43（Asia/Shanghai）。本目录是经过凭据检查的专项报告副本；原始运行数据留在被忽略的 .runtime。可重跑 `node tooling/bootstrap/export-verification.mjs`。

数据来自独立本地 MySQL 8.4 / Redis / Java 21 与实际原账号和接口。测试名字带 TEST/本地/验收的资料是合成记录。mock 支付仅用于 foundation；未调用真实商户、未进行微信真机或生产部署。不同报告会复用或重复覆盖场景，不能把记录数量相加当作独立测试总数。每个报告有自己的执行时间，未修改的专项不会为凑总数反复运行。

| 验证范围 | 结果 | 证据 |
| --- | --- | --- |
| 原身份、商品、交易与支付退款 | PASSED · 13 项记录 | [报告](upstream-flow-report.json) |
| 教育服务完整链路 | PASSED · 18 项记录 | [报告](education-flow-report.json) |
| 家长、教师、校区权限 | PASSED · 13 项记录 | [报告](education-permissions-report.json) |
| 多孩子、库存、部分退款和转班 | 详见原始断言记录 · 10 项记录 | [报告](education-trade-report.json) |
| 实际 MySQL 排课并发 | PASSED · 7 项记录 | [报告](education-scheduling-report.json) |
| 原任务与退款恢复 | PASSED · 3 项记录 | [报告](education-recovery-report.json) |
| 迟到付款履约与原路退款 | PASSED · 7 项记录 | [报告](education-late-payment-report.json) |
| 原优惠券分摊及生命周期 | PASSED · 6 项记录 | [报告](education-coupon-report.json) |
| 作品版本、授权和私有文件 | PASSED · 6 项记录 | [报告](education-work-publication-report.json) |
| 原家长站内通知 | PASSED · 11 项记录 | [报告](education-notification-report.json) |
| 点评并发版本与考勤隔离 | PASSED · 9 项记录 | [报告](education-review-report.json) |
| 发布快照、筛选与排课预览 | PASSED · 6 项记录 | [报告](education-discovery-report.json) |
| 原配置服务与品牌编辑并发 | PASSED · 4 项记录 | [报告](education-brand-report.json) |
| 原 CRM 招生、负责人和团队权限 | PASSED · 8 项记录 | [报告](education-admissions-report.json) |
| 真实后台教学操作 | PASSED · 5 项记录 | [报告](education-admin-teaching-ui-report.json) |
| 品牌公开读取与原账号类型隔离 | PASSED · 详见报告 | [报告](admin-permission-debug-report.json) |
| 真实家长学习页面 | PASSED · 5 项记录 | [报告](education-learning-ui-report.json) |
| 真实结算页与优惠券交互 | PASSED · 3 项记录 | [报告](education-coupon-ui-report.json) |
| 筛选、过期响应和失败重试 | PASSED · 5 项记录 | [报告](education-discovery-ui-report.json) |
| 真实招生咨询页面 | PASSED · 7 项记录 | [报告](education-admissions-ui-report.json) |
| 单附件失败、重试及本地草稿 | PASSED · 4 项记录 | [报告](education-upload-ui-report.json) |
| 结算与作业草稿操作录屏 | PASSED · 3 项记录 | [报告](education-video-report.json) |
| 批改与排课预览操作录屏 | PASSED · 2 项记录 | [报告](education-admin-video-report.json) |
| 原报名付款及退款状态录屏 | PASSED · 5 项记录 | [报告](education-payment-video-report.json) |
| 逐页浏览器截图采集 | PASSED · 详见报告 | [报告](education-screenshots-report.json) |
| 关闭默认外部统计 | PASSED · 4 项记录 | [报告](education-privacy-ui-report.json) |
| 独立生产迁移包验收 | PASSED · 6 项记录 | [报告](production-migration-report.json) |
| 独立 MySQL 快照恢复 | PASSED · 详见报告 | [报告](backup-restore-report.json) |
| 原 Quartz 重启与持久化 | PASSED · 详见报告 | [报告](runtime-persistence-report.json) |
| 公开模型与 MySQL 字段对照 | PASSED · 详见报告 | [报告](schema-verification-report.json) |
| Java 源码与运行包一致 | PASSED · 详见报告 | [报告](backend-build-report.json) |
| 最终 Java 测试日志与 Surefire 对照 | PASSED · 16 项记录 | [报告](java-tests-report.json) |
| 实际后端包依赖与许可证声明 | PASSED · 4 项记录 | [报告](artifact-dependencies-report.json) |
| 后台构建与活动菜单边界 | PASSED · 详见报告 | [报告](admin-release-boundary-report.json) |
| H5 与微信小程序构建 | PASSED · 2 项记录 | [报告](frontend-build-report.json) |
| 课程原创封面与真实页面显示 | PASSED · 6 项记录 | [报告](course-image-ui-report.json) |
| 课程图片完整性与小程序包体 | PASSED · 2 项记录 | [报告](course-image-package-report.json) |
| 一对一预约真实 MySQL 与原 CRM | PASSED · 6 项记录 | [报告](one-to-one-api-report.json) |
| 一对一选老师与申请恢复交互 | PASSED · 8 项记录 | [报告](one-to-one-ui-report.json) |
| 一对一专项 Java 与前后端构建 | PASSED · 3 项记录 | [报告](one-to-one-build-report.json) |
| 官方页面对照后的选课与登录交互 | PASSED · 8 项记录 | [报告](benchmark-ux-report.json) |
| 选课体验优化的 H5 与小程序构建 | PASSED · 2 项记录 | [报告](benchmark-ux-build-report.json) |
| 无本机配置时的前端环境初始化 | PASSED · 2 项记录 | [报告](frontend-template-report.json) |
| 源代码交付完整性 | PASSED · 9 项记录 | [报告](delivery-integrity-report.json) |

本次一对一改动通过完整 Java 打包及 13 项相关测试，见一对一专项构建报告；先前 22 项相关测试保留在 Java 测试报告中，各报告按执行时间对应改动范围。原支付隔离/原商城等此前专项记录见 FOUNDATION.md。后台活动范围使用 ts:check:active，不能推广为原上游所有未启用模块类型检查通过。截图与录屏的来源和具体覆盖页面见 [设计证据](../DESIGN_AND_EVIDENCE.md)。性能目标尚无真实设备实测报告。
