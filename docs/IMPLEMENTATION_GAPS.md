# 实施差距与收口任务

审计基线：2026-09-13 工作区源码，以及 [已批准实施合同](IMPLEMENTATION_PLAN.md)。原完整方案补充要求包括年龄/年级、学习基础、方向、方式、时间/校区筛选，首页城市/线上选择、师资/校区/作品，招生线索与跟进，运营内容配置，排课日历和影响预览，真实批改草稿保存时间与多人防覆盖。本文是完成前的差距清单，不是全计划完成声明。正在修改的项目单独标记；缺少测试不能单独证明功能缺失。

现有交易、权限、文件、通知和恢复能力见 [架构](ARCHITECTURE.md)、[交易说明](TRADE_EDUCATION.md)、[运行手册](OPERATIONS.md)。不重复把已实现能力列为待开发项。

## 2026-09-14 收口更新

下文保留首次审计时的具体问题与修复任务，不能把其中的历史源码状态当成最新缺陷结论。

| 项目 | 当前状态及证据 |
| --- | --- |
| G01、G02 | 已关闭本地功能问题。新 review.revision 强制校验、服务器保存时间、sessionId 出勤回填已实现；最终共享构建 22 项 Java 测试通过（含点评 4、CRM 4）；实际 API 9 项、管理端 UI 5 项通过，分别含新建/已有草稿并发只能一方成功、发布不可覆盖、出勤回填与范围拒绝。报告为 `.runtime/education-review-report.json` 和 `.runtime/education-admin-teaching-ui-report.json`。原教育流程 18 项已重跑通过。 |
| G03、G04 | 本地收口已完成：公开快照检索、level、startFrom/startTo、匹配班期起价/数量和固定版本班期展示均已实现；目录实际接口 6 项通过，报告 `.runtime/education-discovery-report.json`。筛选采用明确年龄/课程基础枚举，不从孩子自由文本年级或经历推断规则。 |
| G05、G06 | 本地收口已完成：首页城市/线上、品牌及内容编辑已连接原配置；后台使用原 ConfigService 白名单与修订哈希保护。品牌实际接口 4 项通过并恢复配置，报告 `.runtime/education-brand-report.json`；单层优惠券 UI 3 项通过。 |
| G07 | 本地功能与 API 收口已完成：原 CRM 已启用，默认不带 BPM，原线索关联、招生控制器和教育菜单进入运行包，未创建 edu_lead。4 项 Java 边界测试、实际 API 8 项通过，含联系授权、家长/试课隔离、默认列表与详情/团队/跟进范围、原负责人转移及禁止借编辑改负责人；报告 `.runtime/education-admissions-report.json`。招生浏览器页面证据另由 UI 验收报告记录。 |
| G08 | 月历、只读冲突/受影响学员预览已经加入，管理端实际 UI 用例通过；原保存时锁检查与站内通知保留。 |
| G09 | 本地交付已完成：[生产 Liquibase 包](../infra/migration/README.md) 和执行器含最新招生/品牌菜单。独立 MySQL 8.4 库 6 项通过：182 业务表 + 2 引擎表、零业务 fixtures、8 个原生变更记录、幂等重跑与校验和漂移拒绝。报告 `.runtime/production-migration-report.json`。真实生产执行仍未发生。 |

上述收口不改变下文外部发布依赖，也不构成全计划完成声明。

## 首次审计问题与修复范围（历史记录）

优先级：P1 影响数据正确性或完整主流程；P2 为承诺的产品流程或运营能力尚未完整接通。

| 编号 / 优先级 | 源码证据与实际影响 | 独立修复范围及验收 |
| --- | --- | --- |
| G01 / P1 / 已分配修复 | [EduLearningService.review](../apps/server/yudao-module-edu/src/main/java/cn/iocoder/yudao/module/edu/service/EduLearningService.java) 锁住提交后仍可无版本条件地覆盖已有 DRAFT review；[批改页](../apps/admin/src/views/edu/submission/index.vue) 仅用本地 JSON 比较 dirty，不传 review revision。两名教师打开同一草稿后，后保存者可覆盖先保存者。页面未读取 review.updateTime，初次打开无点评也显示“当前反馈已保存”；草稿的 requireRevision 从 submission.status 推导，重开可丢失原草稿勾选。 | review 增加修订号；提交预期修订号，锁后比较，返回服务器 revision/updateTime；前端用 review.requireRevision 回填，显示真实保存时间，冲突时保留本地输入。两请求使用同一旧修订号只能一条成功，发布后仍不可覆盖。运行基础代理负责后端，根任务协调前端。 |
| G02 / P1 / 已分配修复 | [排课页 attendance](../apps/admin/src/views/edu/session/index.vue) 调 enrollment/page 仅传 cohortId/status，然后读取实际上未返回的 attendanceStatus；[enrollmentView](../apps/server/yudao-module-edu/src/main/java/cn/iocoder/yudao/module/edu/service/EduEnrollmentService.java) 只补学员、课程、班期名称；[EduAdminService.pageResource](../apps/server/yudao-module-edu/src/main/java/cn/iocoder/yudao/module/edu/service/EduAdminService.java) 未按 sessionId 联出勤。因此重开点名簿显示未记录。 | enrollment/page 接受 sessionId，验证课次范围和班期一致后返回该课次已有状态/备注/保存时间；前端传 sessionId。已记录出勤重开保持一致，其他课次不串值，越权课次不泄漏。运行基础代理负责后端。 |
| G03 / P1 | [coursePage/courseView/saveCourse](../apps/server/yudao-module-edu/src/main/java/cn/iocoder/yudao/module/edu/service/EduCatalogService.java) 的公开查询按可编辑 edu_course.name/direction/age 过滤，展示却用已发布版本 contentJson；saveCourse 不撤销 PUBLISHED。修改未发布草稿会提前改变公开检索归属，结果卡片仍显示旧版本。 | 公开筛选和展示统一以当前已发布快照为准，管理端保留草稿检索。先发布 A，再仅保存名称/方向/年龄不同的 B，公开检索仍按 A；发布 B 后才切换。 |
| G04 / P2 | [选课页](../apps/miniapp/pages/tab/courses.vue) 已有关键词、方向、年龄、方式、校区；临时筛选 apply、取消、返回滚动与 [过期请求丢弃](../apps/miniapp/edu/resource.js) 已实现。后台 coursePage 尚无学习基础、年级、可上课时间条件；Course.level 只是保存字段，未用于筛选。kind 只有伴随 mode/campus 才进入 cohort 过滤。课程卡片 price/cohortCount 计算所有开放班期，未限定已选方式/校区。 | 先明确基础枚举及年级/时间语义，再扩展原教育目录查询及同一筛选抽屉；时间按实际公开班期/课次筛选。匹配班期驱动数量/起价或明确显示“全方式起价”。保持两阶段 apply、返回恢复、无结果/错误状态。不要把孩子 experience 自由文本当成可自动推断的课程等级。 |
| G05 / P2 | [首页](../apps/miniapp/pages/tab/home.vue) 固定 hero、课程前四条、体验引导与方法文字，公开作品有跳转。没有城市/线上选择和师资/校区推荐区；[AppEduController](../apps/server/yudao-module-edu/src/main/java/cn/iocoder/yudao/module/edu/controller/app/AppEduController.java) 已提供公开 teacher/list、campus/list，不是缺基础 API。体验 CTA 仅切到全部课程。 | 用公开校区形成城市/线上上下文并传给选课；展示已发布教师、校区及审核公开作品；体验入口应用 TRIAL 条件。空数据保持准备中，不能制造虚构教师/开班。 |
| G06 / P2 | 配置并非完全缺失：[config/get](../apps/server/yudao-module-edu/src/main/java/cn/iocoder/yudao/module/edu/controller/app/AppEduController.java) 已从原 infra_config 读取 edu.brand.*，我的页使用服务电话/协议；但 [EduHeader](../apps/miniapp/components/edu/EduHeader.vue)、首页和我的页页脚仍硬编码品牌/内容。管理端 [Home](../apps/admin/src/views/Home/Index.vue) 是教学概览；教育菜单无运营内容编辑流程，原配置管理仍可用。 | 原 infra_config 上加限定 edu.brand.* 与首页内容键的运营表单，接公共配置缓存/读取；品牌名称和首页展示统一消费。保留原配置权限和审计，避免另建通用 CMS 或直接公开任意配置键。改配置后两端显示一致；未发布内容不进入首页。 |
| G07 / P2 | 招生咨询尚未成流程。当前客服按钮只拨打已配置电话，[教育后台资源列表](../apps/server/yudao-module-edu/src/main/java/cn/iocoder/yudao/module/edu/service/EduAdminService.java) 有 trial/student/enrollment，没有咨询线索和跟进；[父 POM](../apps/server/pom.xml) 明确不启 CRM。原 [CrmClueDO](../apps/server/yudao-module-crm/src/main/java/cn/iocoder/yudao/module/crm/dal/dataobject/clue/CrmClueDO.java) 已有 ownerUserId、联系时间、状态、来源，原 [CrmFollowUpRecordDO](../apps/server/yudao-module-crm/src/main/java/cn/iocoder/yudao/module/crm/dal/dataobject/followup/CrmFollowUpRecordDO.java) 已有 bizType/bizId/content/nextTime。源码保留不等于服务已启用。 | 复用原 CRM 线索、负责人、数据权限与跟进，补教育招生工作台及关联体验预约。分两步：先完成 CRM 依赖裁剪/启用和原权限接口验证，再连接咨询入口及 trial 引用。不得新增 edu_lead/另一套负责人权限代替 CRM。具体启用边界见下节。 |
| G08 / P2 | [课次页面](../apps/admin/src/views/edu/session/index.vue) 是分页表格和编辑抽屉，班期页“打开排课日历”实际跳此表。保存前仅作本地必填检查，随后直接 create/update；无独立冲突/受影响学员预览接口。后台 [saveSession](../apps/server/yudao-module-edu/src/main/java/cn/iocoder/yudao/module/edu/service/EduCatalogService.java) 已用锁和当前读阻止教师/教室/班级/孩子冲突，并在更新后给 ACTIVE 学员发原站内通知。 | 增加周/日历及教师/校区视角，独立只读预检返回冲突资源与受影响人数/有权查看的学员；确认后仍调用原带锁保存，不把预检当最终并发保证。显示变更前后时间与通知对象；维持现有通知发送。 |
| G09 / P1 发布准备 | [init-database.mjs](../tooling/bootstrap/init-database.mjs) 是空开发库初始化，明确插本地会员、mock 渠道和联调商品；[apply-local-updates.mjs](../tooling/bootstrap/apply-local-updates.mjs) 硬绑定本地库，包含授权测试账号和内容更新。[trade-education.sql](../infra/sql/trade-education.sql) 独立 ALTER，而源推导基线已含对应字段，不能盲目叠加。当前有生产模板和操作手册，但没有与开发 fixtures 分离、具备版本/校验记录的可执行生产迁移入口。 | 形成生产专用基线/增量清单：公共源哈希、前置版本与结构检查、一次性迁移账本、原租户/RBAC/字典/Quartz/教育必需配置、排除测试身份与 mock；生成 dry-run 和隔离 MySQL 验证。使用哪种迁移工具可沿项目惯例，不以必须引入某框架为目标。目标凭据和正式执行仍属外部发布步骤。 |

## 原 CRM 的最小复用路径与实施结果

不能只把 crm_clue 的 DO/Mapper 复制进教育模块就声称复用完整招生流程。原 [CrmClueServiceImpl](../apps/server/yudao-module-crm/src/main/java/cn/iocoder/yudao/module/crm/service/clue/CrmClueServiceImpl.java) 还依赖 Customer/Permission/FollowUp；[FollowUp](../apps/server/yudao-module-crm/src/main/java/cn/iocoder/yudao/module/crm/service/followup/CrmFollowUpRecordServiceImpl.java) 和 [Permission](../apps/server/yudao-module-crm/src/main/java/cn/iocoder/yudao/module/crm/service/permission/CrmPermissionServiceImpl.java) 注入 Business/Contact/Contract；[CRM POM](../apps/server/yudao-module-crm/pom.xml) 直接依赖 BPM，合同/回款服务引用 BPM API 和监听器。因此简单取消一行 POM 注释不构成小改动。

实施采用了上述原 CRM 边界：合同/回款 BPM 接口由默认关闭的 `crm-bpm` 可选桥接隔离，原线索、跟进、团队权限、负责人转移和审计保持活动。共享 Java 21 包已启动，4 项 CRM 单元测试与 8 项实际招生 API 检查通过。原列表缺省场景和编辑负责人路径在实际隔离验收中发现问题后，已在原 CRM 服务内修正；没有另建教育负责人权限系统。现有试课订单/预约继续走 edu_trial_booking 与原商城，`crm_clue_id` 只是可选线索关联。

## 审计过程中已在关闭、不能再写成“没有实现”的项目

- **优惠券选择已接通并验收**：[checkout.vue](../apps/miniapp/pages/edu/checkout.vue) 复用原 s-coupon-select、settlement.coupons、couponId 报价和创建传递；计价仍由原 TradePriceService 完成。真实结算浏览器 3 项通过，涵盖两孩子结算、应用优惠后的金额变化确认、弹层取消及清除；原券分摊和取消/退款生命周期由 6 项实际接口验证。参见 [结算界面报告](verification/education-coupon-ui-report.json) 与 [优惠券接口报告](verification/education-coupon-report.json)。
- **家长消息已经接原站内信**：[AppEduNotificationController](../apps/server/yudao-module-edu/src/main/java/cn/iocoder/yudao/module/edu/controller/app/AppEduNotificationController.java) 限制 MEMBER 身份，提供分页/未读数/单条和全部已读；已开展双家长越权探针。微信订阅消息/真实短信通道是另一发布依赖，不能用它否定现有站内消息。
- **教师身份与范围已经复用原账号**：[teacher 页](../apps/admin/src/views/edu/teacher/index.vue) 使用 system-user 资源选择；原账号校验、已建档不可改绑、SELF/部门范围和授课范围均在后台。不能把它误报成裸 ID 录入或缺后台权限。
- **多人编辑部分已有保护**：课程 revision、课次 version、学生 version、提交 draft revision、成长报告 version，以及已发布快照/点评不可覆盖均已有实现。G01 专指教师 review 草稿；锁并不等于旧表单冲突检测。
- **本地 SQL 来源要求已有实证**：固定公开源 manifest、MySQL 空库启动、原身份/商品/付款/退款/Quartz 重启和独立库备份恢复均已有报告。G09 指生产可执行迁移分离，不要求获取受限官方商城 SQL，也不把公共测试 H2 DDL 当完整官方生产库。

## 外部发布依赖与本地验收边界

| 范围 | 可在本地继续交付 | 必须在机构/设备环境完成 |
| --- | --- | --- |
| 身份、支付、退款 | 原渠道配置模板、关闭 mock 的启动检查、回调/错误状态契约、结算安全回归 | 真实 AppID/微信手机号授权、商户证书、合法域名、真实支付和退款回调；不能用 mock 成功代替 |
| 存储与灾备 | 授权代理、私有桶配置模板、数据库隔离恢复脚本、对象/Redis恢复步骤 | 实际 COS ACL/密钥/恢复点、Redis+COS+MySQL 一致恢复、生产 RTO/RPO 与容量验证 |
| 内容与招生 | 运营表单、咨询流程、草稿课程导入、发布约束 | 机构确认师资/课价/排课/退款条款/隐私文本和真实客服；六门八课草稿不是已开放招生课程 |
| 设备与交互 | H5 与 mp-weixin 构建、320–430px/失败态浏览器证据、可复放的流程录屏 | 微信真机登录/支付/文件下载、键盘与系统大字、弱网、审核及试点家长/教师验收 |

活动页面、截图、录屏及来源已整理为 [设计证据矩阵](DESIGN_AND_EVIDENCE.md) 和 [离线画廊](screenshots/index.html)。正常页面与选定的空数据、失败、重试、付款状态、草稿恢复均有各自证据；这不代表每一页的所有状态、大字和键盘组合都已逐一覆盖。真实设备、真实渠道与性能目标仍按上表验收。

G01–G09 的本地功能状态以本文开头表格为准。正式发布仍按外部依赖和活动路由证据矩阵验收，不能以源码存在、一次编译成功或其他里程碑通过替代该项验收。
