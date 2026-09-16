# 一对一高级课与选老师预约

首版为独立的一对一课程服务入口：了解课程 → 选择老师 → 选择孩子 → 填写学习目标、期望日期/时间和时长 → 提交预约申请 → 沟通方案与报价。当前未提供正式价目，因此申请不收款、不占老师时段；页面明确显示待沟通确认。后续正式报名继续使用原班期、SKU、订单与支付。

首页、选课页和「我的」均可进入 `pages/edu/one-to-one`。课程介绍与师资可匿名查看，需要提交时沿用原家长登录；老师选择在登录返回后保留。草稿按原会员 ID 和孩子 ID 在本机隔离保存，联系授权不随草稿恢复。创建成功与记录刷新是独立状态，刷新失败仍保留操作结果和重试入口。

## 上游复用与新增差异

| 能力 | 复用 | 本次差异 |
| --- | --- | --- |
| 家长与教师账号 | 原 `member_user`、`system_users`、登录及令牌续期 | 不增加独立身份系统 |
| 师资 | `edu_teacher_profile`、原后台 ResourceBoard | `one_to_one_enabled` 默认关闭；公开查询仅返回已发布、已开启、介绍完整且员工启用的老师 |
| 预约意向 | 原 `crm_clue`、负责人、团队权限与跟进 | 保存服务类型、教师档案 ID、教师姓名快照、期望起止时间及申请状态 |
| 后台处理 | 原教育招生工作台与原 CRM 页面 | 一对一服务筛选、老师/期望时间/目标展示、原负责人跟进 |
| 时间与交易 | 原排课、SKU、订单和支付能力 | 本次期望时间不建立可售库存，不创建平行预约库存或订单 |

原 CRM 负责人是受理员工，所选老师是家长的授课意向；二者分别保存。被选中不自动授予老师家长联系方式或 CRM 权限。原通用线索编辑不能覆盖预约专属字段。

## 数据和接口

`crm_clue` 增加 `education_service_type`、`education_teacher_id`、`education_teacher_name`、`education_preferred_start_time`、`education_preferred_end_time`、`education_appointment_status`。旧记录服务类型为空时按普通课程咨询处理。新增字段沿用原数据库访问、审计、租户及迁移机制，不另建基础业务表。

| 接口 | 行为 |
| --- | --- |
| `GET /app-api/edu/teacher/list?oneToOne=true` | 公开可申请一对一的教师，不返回原员工账号 ID |
| `POST /app-api/edu/admission/create` | 原咨询创建接口扩展 `serviceType=ONE_TO_ONE`、`teacherId`、期望起止时间；沿用孩子归属和联系授权校验 |
| `GET /app-api/edu/admission/list` | 本人申请、教师姓名快照、期望时间与撤回状态 |
| `POST /app-api/edu/admission/cancel` | 本人撤回，幂等更新并保留历史 |
| `GET /admin-api/crm/clue/page?educationOnly=true&educationServiceType=ONE_TO_ONE` | 原 CRM 权限范围内筛选一对一申请 |

输入时间采用北京时间 `yyyy-MM-ddTHH:mm:00`，响应沿用原时间戳序列化。期望时段须在未来、精确到分钟且为 30—180 分钟。同一孩子、老师、时间、课程意向、联系资料和学习目标的重复提交在事务内合并；撤回后可重新申请。申请状态为 `REQUESTED/CANCELLED`，原 `followUpStatus` 单独表达受理跟进，不代表授课已确认。

## 验证与运营

实际 MySQL/原 API 验收：[脚本](../tooling/bootstrap/verify-one-to-one.mjs)；浏览器交互验收：[脚本](../tooling/bootstrap/verify-one-to-one-ui.playwright.js)。结果与截图以 [验证目录](verification/README.md) 中带执行时间的报告为准。

本次一对一专项通过 13 项 Java 测试、实际 MySQL 并发与权限验收、8 组浏览器流程检查，以及后台、H5 和微信小程序编译。浏览器使用原本地开发登录配置；生产验证码配置保持开启。微信真机、真实商户和正式排课确认不在本次验证范围内。

页面截图：[移动端课程介绍](screenshots/one-to-one-mobile.png)、[桌面预览](screenshots/one-to-one-desktop.png)、[预约表单](screenshots/one-to-one-request-form.png)、[提交后刷新失败恢复](screenshots/one-to-one-submitted-retry.png)、[后台预约详情](screenshots/one-to-one-admin-request.png)、[教师开放开关](screenshots/one-to-one-admin-teacher.png)。刷新失败截图只注入一次请求失败，预约保存仍由真实服务端完成。

本地演示中的 TEST 老师、孩子和需求仅用于功能验证。正式服务须由运营在原师资管理中录入并发布真实介绍、开启一对一，再由原招生工作台沟通安排；不得把本地 TEST 档案用作正式师资宣传。
