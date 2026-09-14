# 官网与小程序后端统一实施计划

> **For agentic workers:** 实施时使用 `superpowers:subagent-driven-development` 或 `superpowers:executing-plans` 按任务交付。本计划已在 codex/unified-backend 实施；实际交付与验证见下表。

**Goal:** 在官网现有视觉与操作流程保持原样的前提下，完整迁移官网管理后台，统一后端、数据库、课程数据与 CRM；官网前端仅做必要的 API 和字段适配。

**Architecture:** 以 `codex/vibe-edu` 为主，一套模块化 Spring Boot 应用、一套 MySQL 业务数据、一套 Redis；官网 React、小程序 UniApp、管理后台 Vue 分别调用权限明确的 API。

**Tech Stack:** 沿用小程序 JDK 21（源码目标 17）、Spring Boot 3.5.15、MySQL 8.4、Redis 7.4、Liquibase OSS 4.33.0；保留三端各自依赖锁。

**Spec:** [统一后端设计与重复能力对照](</C:/Users/12298/Documents/ChatGPT/少儿vibe coding/docs/superpowers/specs/2026-09-14-unified-backend-design.md>)。

**状态:** 2026-09-14，后端整合已实现并完成隔离环境验收，尚未部署生产。下文保留原方案的任务细分作为设计记录；当前交付状态以本表及 [验收记录](../../verification/2026-09-14-unified-backend.md) 为准。

| 任务 | 当前交付 |
| --- | --- |
| 1 基线 | 独立 codex/unified-backend；当前官网快照 00cd7b95；原工作区保留 |
| 2 公开契约 | 发布快照字段白名单；miniapp assignment 保留；两端共用 API |
| 3 官网接入 | 原官网服务卡片接入统一数据；Vite/Node/nginx 代理；锚点及失败重试 |
| 4 数据增量 | 009/010 追加，CRM 来源和回执/官网内容表；恢复库重复升级通过 |
| 5 匿名咨询 | 真实 CRM 事务、持久幂等、授权、角色边界、可信 IP 限流及不含联系信息的日志 |
| 6 官网后台 | 课程/咨询两类原操作完整承接；账号权限决定页签；咨询状态和备注保留 |
| 7 交付 | 四个前端构建目标及 JAR、允许清单打包、运维与回退；本次实际验证证据已记录 |

实施时核对到以下原计划假设与用户认可的实际官网不一致，已按“视觉不动”作适配：

- 当前官网是 /courses#start、#create、#grow 锚点，没有 PR 新增的 /courses/start 等独立详情页，也没有正式课程分页、价格或班期选择控件。保留真实路由与所有展示结构，没有为满足旧路径假设引入另一版页面。正式课程列表/详情使用统一公开 API，已有小程序完成业务展示；官网提供相同网关契约和可选 courseId 关联。
- 官网卡片采用独立展示配置，可选绑定真实课程，未配置时保留通用咨询，不伪造正式课程或价格。品牌、导师、作品与 FAQ 按用户要求保留。
- 匿名写入用 TransactionTemplate REQUIRES_NEW 明确控制整体事务及唯一键竞争后的全新读取，替代计划中的声明式事务实现方式；真实并发验证通过。
- 全部写入验收使用 48081 和恢复副本，不接管其他任务使用的 48080/4173。原官网 PR 只选择迁移管理能力，不整包合并其页面或旧数据库。
- 生产环境、真实微信 AppID/支付商户及外网切流尚未配置；交付可复现工具与模板，不把本地模拟支付或静态构建称为生产上线。


## 全局约束

1. 官网仅演示/测试数据，用户已确认不需真实数据迁移；不编写 ETL、不导入旧账号和默认课程。保留小程序已有数据。
2. 只操作 `1229800890wzx-png/vibe-coding-studio`，不涉及毕业论文仓库。
3. 以小程序 `9e67e2eda71f0d9b67c6f01d9052ec28550c64cc` 为本次方案基线；官网 PR #1 参考 `51e7984866baecdc50a1783de1231ac701af93ec`。开工先确认远端是否新增提交，有变化只复核受影响部分。
4. 新分支拟定 `codex/unified-backend`；不整包合入官网 `platform/overlays`，不覆盖小程序 `apps/server`、`apps/admin`。
5. 共用课程发布、CRM、会员、交易等服务。所有新公开 DTO 使用字段白名单；匿名接口不接受身份、负责人或租户越权字段。
6. 用户已明确“视觉不动，主要改后端，以及数据库的统一”。冻结当前运行官网的布局、样式、图片、品牌文案、导航和轮播；不移入另一版页面、不重写 CSS、不新增展示页。前端只调整接口、字段和实际请求状态，后台沿用现有样式增加必要来源筛选/空关联处理。真实课程数据通过现有组件展示，示意内容不冒充后台真实课程。
7. 先在独立测试环境验证写入和迁移；现有小程序数据不能作为可随意重置的测试夹具。
8. 每阶段提交完整变更与针对性验证证据；不把已有历史报告说成本次测试通过。
9. 用户补充“官网的管理后台也要迁移”：官网现有页面能力、菜单、管理接口和权限完整迁入统一后台；没有真实业务数据只省去历史记录导入，不删掉课程介绍编辑、阶段、封面、大纲、排序、发布/隐藏、咨询状态与备注功能。原官网管理页面采用必要的接口改造接入统一布局，保留字段和操作，不进行管理端视觉重设计。

## 交付顺序

| 阶段 | 交付结果 | 依赖 | 建议评审批次 |
|---|---|---|---|
| A：基线与公开契约 | 可工作的整合分支、公共课程 DTO | 无 | PR A |
| B：官网接口兼容 | 原页面读取统一课程和官网展示内容，字段适配、开发代理；品牌/导师不自动换内容 | 先做 A 的课程接口部分，最终联通依赖 D | PR C |
| C：CRM 数据与匿名接入 | 来源、持久回执、匿名 API、事务/权限 | A | PR B |
| D：官网管理后台迁移 | 官网内容管理、排序/可见性、咨询列表/状态/备注、菜单与权限；统一招生衔接 | A、C | PR B |
| E：部署与回归 | 可重复发布制品、回退步骤、关键链路报告 | B、D | PR C |

B 的适配准备与 C 可在约定接口后并行；D 完成官网内容管理后，B 最终联通，再进入 E。任务执行依赖为 1→2、4→5→6，再完成 3 的全部联调，最后 7。拆分的 PR B 必须同时包含官网管理页面、接口、迁移和后台可见性，不发布“保存成功但招生页看不到”的半成品。

此前 8–12 个工作日按简化后台承接估算。补充官网管理后台完整迁移后，需把展示配置、原状态/备注兼容及菜单权限纳入任务 6，再按实现拆分重估；不沿用旧估算作为交付承诺。本期不包含新增官网支付、复杂 CMS 或真实作品重新授权等待。

## 路径约定

下文代码路径以未来整合分支根目录为相对定位；当前核查到的小程序根目录为 `C:/Users/12298/.codex/worktrees/vibe-edu`，官网 PR 根目录为 `C:/Users/12298/Documents/ChatGPT/少儿vibe coding/output/pr-review-1`。文件标为“新增”的名称是计划命名，不代表当前存在。

为缩短重复路径，表内使用：

- `EDU` = `apps/server/yudao-module-edu/src/main/java/cn/iocoder/yudao/module/edu`
- `CRM` = `apps/server/yudao-module-crm/src/main/java/cn/iocoder/yudao/module/crm`
- `EDU_TEST` = `apps/server/yudao-module-edu/src/test/java/cn/iocoder/yudao/module/edu/service`

实施时先将本计划与设计文档放入整合分支的同名 docs 路径，再按任务逐项更新结果。

## 任务 1：建立整合基线和接口契约

**Consumes:** 两个核查 HEAD、用户确认的原官网页面、设计文档。

**Produces:** 独立整合分支、文件接收清单、公开字段合同、可重复启动说明。

**涉及文件:** 根目录 `src/`、`package.json`、`scripts/serve.mjs`；参考官网 PR 的 `src/education-api.js`、`src/course-catalog.jsx`、`src/inquiry-form.jsx`；小程序 `upstream.lock.json`、`docs/FOUNDATION.md`、`docs/OPERATIONS.md`。

- 核对 git remote、分支、工作树和 HEAD，记录需要保留的未提交变更；创建从小程序出发的整合分支，不修改现有工作树的用户内容。
- 固定当前运行官网的源码与视觉基线，保留原页面、素材和轮播；仅参考 PR 的 API/表单数据处理，不接收整页主题改动。按现有页面采集固定视口、固定数据和轮播帧的基线截图，用于验证后端接入没有改变视觉。
- 迁入官网 admin education 页的实际管理能力和可用组件，替换接口并挂入统一菜单；不搬旧自动建表服务、默认测试账号/咨询数据或机器绝对路径。逐项建立“旧操作→新页面/API/权限”验收表，覆盖原四个管理接口。
- 保留当前路由、导航与 `/courses/start|create|grow` 服务方向页；由数据适配层关联真实 courseId，未确定关联不填假 ID。不为此次后端统一新增详情页或更换首页推荐卡片。
- 固定现有 public API 字段与新增 website-admission 请求/回执、错误语义。沿用 `{code,msg,data}`；定义可区分的授权版本过期、重复内容冲突、暂停受理、限流错误码，前端不只判断 HTTP 200。
- 记录三端原有启动、构建和回归命令，复用已有环境模板；测试环境不加载生产密钥和真实支付。

**验收:** 代码来源可追溯；只有一个 server/admin；没有 `edu_inquiry` 或旧字符串主键建表逻辑混入目标；三端能按现有文档构建/启动，失败明确记录环境原因。

**建议提交:** `chore: establish unified backend integration baseline`

## 任务 2：明确公共课程数据边界

**Consumes:** 任务 1 的公开契约、现有发布快照和小程序课程页。

**Produces:** 官网、小程序共同可用的公开目录/详情响应，草稿与私有字段隔离测试。

**涉及文件:** `EDU/controller/app/AppEduController.java`、`EDU/service/EduCatalogService.java`、`EDU/service/EduViews.java`；新增公共响应 DTO（建议 `EDU/controller/app/vo/EduPublicCourseRespVO.java`）；`apps/miniapp/pages/edu/course.vue` 仅在合同确有兼容变更时调整；新增 `EDU_TEST/EduPublicCourseViewTest.java`。

- 以现有公开页面实际使用字段建立 DTO，不继续通用 DO/map 任意透传。
- 列表与详情均读取已发布快照；草稿编辑不影响已发布结果；缺失快照时隐藏/拒绝该记录并记录异常。
- 保留公开大纲标题、时长、目标、练习摘要等，特别确认小程序已使用的 `lesson.assignment`；排除真实提交、评价、内部材料与课堂进入信息。
- 保留分页 `{list,total}` 和已有筛选；价格仍取正式班期/SKU，保留 null，无班期不伪造价格或名额。
- 验证教师公开 DTO、品牌白名单可直接使用；不增加不必要的聚合服务或第二套内容表。

**验收:** 公开列表和详情版本一致；修改草稿不改变公开页；未发布课程、无发布快照、私有字段不可公开；小程序原公开大纲继续可读。

**验证:** 新增针对性 Java 用例，并在隔离环境执行现有 `verify-education-discovery.mjs`、`verify-education-brand.mjs`。记录实际命令、提交和结果。

**建议提交:** `refactor: define shared public education responses`

## 任务 3：官网接入共享读取接口

**Consumes:** 任务 2 的正式课程 API、任务 6 的官网展示内容 API，官网已确认视觉与原服务路径。

**Produces:** 现有官网通过兼容适配读取统一课程，开发和生产代理可用；品牌/导师共用接口可用但不自动替换当前官网展示内容。

**涉及文件:** 主要为 `src/education-api.js`、`scripts/serve.mjs`、新增 `vite.config.js` 与官网环境模板。确有需要才改 `src/course-catalog.jsx`、`src/inquiry-form.jsx` 等现有组件中的数据绑定，不改样式、DOM 布局、路由或静态素材；新增 `tooling/bootstrap/verify-website-catalog.playwright.js` 检查接口与视觉保持情况。

- 将 API 客户端拆成 coursePage、courseDetail、brand、teachers 方法；处理业务错误、超时及取消请求。
- 原服务介绍卡片改读统一后端的 website-offering 公开接口，保留既有字段语义、排序及素材键；真正教学课程另读原 course API。后台修改服务介绍与发布/隐藏后，官网原组件即时反映正确数据。
- 在适配层处理课程名称与 coverUrl，保留当前服务方向、演示卡片的图片和显示规则；只有已有明确关联的真实课程使用其后端字段，不自动将小程序封面替换官网素材。沿用原图片尺寸及失败状态。
- 保留既有列表筛选控件和交互，通过数据适配接后端条件；现有分页保留 total，无分页的现有页面完整获取其展示所需数据，不新增分页布局。详情独立请求，现有 URL 刷新与从外部直接访问均有效。
- 无数据、请求失败、下架、无可售班期分别有准确状态；金额按分显示为元，null 不显示免费。
- 保留现有官网品牌、联系方式呈现、导师图片/介绍、slogan、轮播及 FAQ。后端共享能力保留；内容替换不属于本期，不将小程序默认配置或种子内容覆盖官网。
- 补 Vite 开发代理与生产预览代理，最终生产由受信任网关转发。目标和机构租户来自环境/网关；浏览器不能自行选择其他机构。
- 维持演示作品与真实学员作品的标识边界；此任务不启用未经明确授权的真实作品营销展示。

**验收:** 用超过 20 条已发布测试课程验证读取完整性、现有筛选/分页和非首批课程直达；旧三个服务路径可刷新；实际发布课程修改两端一致；原首页轮播正常；`npm run dev` 和构建预览都能读同一后端，控制台无接口/图片路径错误。同数据、同视口、同轮播帧截图对比，确认布局、字体、颜色、图片尺寸和间距没有变化；不以更换测试数据造成的文字差异误判样式回归。

**建议提交:** `feat: connect website catalog to shared education API`

## 任务 4：加入教育来源和咨询接收账本

**Consumes:** CRM 当前 schema、任务 1 匿名合同、现有数据库升级机制。

**Produces:** 向前兼容的数据增量和来源识别，保留已有小程序线索。

**涉及文件:** `CRM/dal/dataobject/clue/CrmClueDO.java`、`CRM/controller/admin/clue/vo/CrmCluePageReqVO.java`、`CrmClueRespVO.java`、`CRM/dal/mysql/clue/CrmClueMapper.java`；`EDU/service/EduAdmissionService.java`；新增 `EDU/dal/dataobject/EduWebsiteAdmissionReceiptDO.java`、`EDU/dal/mysql/EduWebsiteAdmissionReceiptMapper.java`；`infra/migration/db.changelog.xml`、新增 `infra/migration/sql/009-website-admission.sql`、对应开发更新 SQL 与 `tooling/bootstrap/apply-local-updates.mjs`。009 编号开工时检查空闲。

- 增加可空 `education_origin`、来源查询与合理索引；小程序新增咨询写 MINIAPP，官网由服务端写 WEBSITE。原 CRM source=90 保留为“课程咨询”，origin 不进入通用更新 DTO，教育识别不依赖可编辑的 source。
- 对已有小程序教育线索定向回填；未回填/旧程序新写记录通过兼容条件仍可查询；其他 CRM 线索不误归为教育。
- 建技术回执表和 `(tenant_id,channel,request_id)` 唯一约束，增加 traceId；不在账本重复存咨询正文和联系信息。
- 同步生产新 changeset 与已有开发库增量路径。不得为开发库强行执行只允许空库的生产基线。
- 改 educationOnly、COURSE 分支和 staffDetail 的教育识别，保持原 CRM owner/team 数据权限；空 member/student 不抛错。
- 固定回执保存期限与重试期限，一期不自动清理已接收回执；后续清理策略不得让仍可重试的 requestId 重建线索。

**验收:** 在新空测试库完整迁移成功；在小程序测试库副本增量更新成功，已有课程、线索、订单不变；重复执行已应用升级无重复结构/回填；原 MINIAPP、WEBSITE 与普通 CRM 线索能正确区分。

**验证:** `verify-production-migrations.mjs`、`verify-schema.mjs` 及来源/唯一键的隔离数据库用例；如果现有验证器固定了表数量，按技术表新增同步更新断言，不删业务表凑数量。

**建议提交:** `feat: add website admission origin and receipt storage`

## 任务 5：实现匿名咨询服务并保留原身份边界

**Consumes:** 任务 4 schema、现有 CRM 创建及 OWNER 权限核心、受理人配置。

**Produces:** website-admission options/create、持久重试、独立限流、可追溯匿名接收事件。

**涉及文件:** 新增 `EDU/controller/app/AppEduWebsiteAdmissionController.java`、`EDU/controller/app/vo/EduWebsiteAdmissionCreateReqVO.java`、`EDU/service/EduWebsiteAdmissionService.java`、专用 IP 限流 key resolver；修改 `CRM/service/clue/CrmClueService.java`、`CrmClueServiceImpl.java` 以抽取共同创建核心；新增 `EDU_TEST/EduWebsiteAdmissionServiceTest.java`、`tooling/bootstrap/verify-website-admission.mjs`。

- options 仅输出受理状态、联系授权文本/版本；缺少有效同机构负责人时关闭。现有全局 owner key 只用于当前单机构，不能声称已支持多机构独立配置。
- 仅官网新入口 PermitAll；原家长 create/list/link-trial/cancel 保持登录、孩子归属和服务类型校验。
- 验证手机或邮箱、字段长度、授权 true 和当前版本；验证可选 courseId 是可公开课程；来源、租户、负责人、授权时间均由服务端设置。
- 将原 CRM 创建的关系验证、线索和 OWNER 权限写入抽成共享核心；原员工/会员调用行为与日志不变。新增仅供内部官网服务调用的创建方法，不增加公共 CRM create 入口。
- 官网创建使用明确匿名接入审计：回执与来源/授权字段形成持久关联，输出无 PII 的 trace 事件。不为适配日志虚构员工/会员，不修改通用日志 DTO 为全局可空。
- 在站点租户、流量保护和请求格式/摘要校验后，先查已提交回执：同 key 同 payload 重放原回执，变化则冲突；未命中才校验当前开关、授权版本、课程和负责人并创建。已成功请求不能因为随后课程下架、授权换版或负责人停用而丢失重试能力。
- 官网外层服务经 Spring 代理开启事务，CRM 核心加入同一事务，原子创建线索、OWNER 权限、回执，禁止独立提前提交。唯一键竞争后在失败事务之外读赢家结果；验证实际事务代理生效，避免同类自调用绕过事务。
- 以可信 IP、租户、端点做 Redis 限流，不带请求参数或 requestId；网关覆盖伪造转发头，未通过公共网关不能绕过租户和速率控制。
- 输出只有不透明 receipt 和接收状态，不返回 CRM id、负责人、联系方式或内部跟进。日志不打印整个表单。

**验收重点:**

- 同 requestId 并发 20 次只创建一条线索、一份 OWNER 权限、一个回执；超时/进程重启后同内容仍得到原回执；成功后课程下架、授权换版、负责人停用也可重放；同 key 改内容明确失败。
- 线索写入后制造权限或回执失败，整次事务不留下孤立业务记录，随后可正常重试。
- 无授权、旧版本、草稿课程、非法联系信息、伪造租户/身份/owner 不新增线索；受理人停用时不能落到默认 admin。
- 换 requestId 或留言仍被同 IP 窗口限制；独立实例共享限额；被拒绝响应不泄露请求内容。
- 匿名创建审计能关联 trace、requestId、授权和线索；原家长咨询、原 CRM 员工创建不被新日志路径破坏。

**建议提交:** `feat: route anonymous website admissions into CRM`

## 任务 6：完整迁移官网管理后台并接通咨询

**Consumes:** 任务 1 的现有官网/旧后台基线、任务 2 正式课程契约、任务 5 匿名 API、CRM 数据权限；任务 3 可先准备，最终读取联调在本任务之后完成。

**Produces:** 统一后台中的官网运营双标签页、全部原管理操作、官网内容读写服务及数据表、CRM 状态/内部备注扩展、菜单与权限；官网咨询真实入库并可跟进。

**涉及文件:** `src/inquiry-form.jsx`、`src/education-api.js`、`src/course-catalog.jsx`；`apps/admin/src/api/edu/index.ts`、`apps/admin/src/api/crm/clue/index.ts`、`apps/admin/src/views/edu/admission/index.vue`；必要时 `infra/sql/education-menus.sql` 与对应增量迁移；扩展 `tooling/bootstrap/verify-education-admissions-ui.playwright.js`，新增官网表单端到端验证脚本。

**新增/迁入文件（拟定）:** 从官网 PR `platform/overlays/yudao-ui-admin-vue3-master/src/views/education/index.vue` 迁入并适配到 `apps/admin/src/views/edu/website/index.vue`，API 为 `apps/admin/src/api/edu/website.ts`。后端新增 `EDU/controller/admin/AdminEduWebsiteOfferingController.java`、`EDU/controller/app/AppEduWebsiteOfferingController.java`、`EDU/service/EduWebsiteOfferingService.java` 及对应 VO/DO/Mapper；增加 CRM 内部状态/备注保存服务和 VO。迁移追加 `010-website-management.sql`（实施时核对未占用），包含 `edu_website_offering` 与 CRM 所需字段；同步开发库增量路径，不修改已应用 changeset。

- 保留原课程管理/咨询跟进双标签和编辑弹窗，将页面/API 迁入统一 `apps/admin`，菜单提供官网管理入口。旧书签路径保留兼容入口或跳转，统一登录后仍能找到原操作。
- 新建/编辑/刷新课程介绍完整保留：创建后锁定 slug，标题 80、简介 600、大纲 2000，原三阶段标签和三种封面、排序 0–999、发布开关。不新增无需求的删除/批量管理来替代原行为。
- 在统一数据库增加 `edu_website_offering`：标准数字主键、tenant_id、租户内唯一 slug、title、description、outline、stage、image_key、sort_order、published、可空 course_id、revision、逻辑删除与审计字段。官网内容可独立存在，关联正式课程时校验本租户；不创建虚假的年龄、课次、商品或班期。
- 官网内容写入提供并发 revision 校验；新建遇 slug 冲突明确失败，不继续旧 upsert 覆盖已有记录。公开接口仅返回 published 数据，沿用原 sort_order/slug 排序；原素材和文案作为当前网站配置保留，不导入测试咨询或假收费课程。
- CRM 增加 `education_website_status=NEW|CONTACTED|CLOSED` 和 `education_operator_note`，官网线索新建为 NEW；原状态可往返修改，关闭只结束当前咨询处理，不转客户、不删除、不撤销已报名课程。
- 原咨询列表/刷新/详情保留称呼、手机或邮箱、经验、兴趣、留言、状态和备注。官网管理入口固定筛选 WEBSITE，沿用 CRM READ/WRITE 范围；原后台没有筛选控件，不把新增筛选当成迁移旧功能的前置要求。
- 内部备注保留原 2000 字保存能力，与提交原文分开；状态/备注修改记录员工和时间，不自动伪造联系方法或下次联系时间。真实联系继续走原跟进接口，不全局降低其校验。
- 官网展示内容新权限（拟定 `edu:website:query/create/update/publish`）随角色和菜单落地；咨询查看/编辑仍叠加 CRM 数据权限。统一管理员账号承接实际人员，演示默认账号不复制；原能力验收通过后才停止旧后台服务。

- 保留现有表单布局和操作流程，读取最新 options，在原状态/提示位置呈现受理结果及联系授权；后台所需 requestId、consentVersion、courseId 等通过数据层传递，不增设无必要的可见字段。通用入口保留无课程咨询。
- requestId 绑定一次提交内容：网络重试保留；用户修改内容后作为新请求生成新 key；重复点击禁用但不依赖按钮防重。
- 成功态只有后端接受后出现；断网/限流/授权版本更新有明确恢复动作，不用假成功动画掩盖失败。
- 招生页支持 WEBSITE/MINIAPP 筛选、未绑定家长/孩子、手机/邮箱展示，显示咨询课程与提交说明；内部跟进继续使用原组件和历史记录。
- 跟进、详情、转交仍走原 CRM 查询和 OWNER/READ/WRITE；不能新增绕过权限的匿名线索全量 DAO。
- 沿用现有运营/招生角色并补官网运营菜单权限，旧 `education:manage` 操作逐项映射验收后再停用其独立实现。只授必要权限，不给所有招生人员 infra 配置、导出、删除或财务权限。
- 官网三态与 CRM 跟进/转客户状态独立呈现；不把一对一撤回或实际联系事件套到官网备注保存操作。

**验收:** 匿名手机、匿名邮箱、课程详情咨询和通用咨询四条流程均能到招生台；受理负责人可跟进、无关联员工不可读、只读团队成员不可写、转交后权限按原规则变化；家长接口看不到员工内部备注，匿名回执不能查询私人信息。

**后台迁移专项验收:** 在隔离环境从统一官网后台新增服务介绍→编辑最长允许简介/大纲→切换阶段和封面→调整排序→发布/隐藏，原官网样式不变且数据反映正确；slug 冲突不能覆盖现有内容，过期 revision 不能覆盖新编辑。咨询 NEW/CONTACTED/CLOSED 往返修改和 2000 字备注保存成功，提交原文不变、不生成假联系时间；官网运营与招生按权限可达，越权和跨租户请求失败。旧后台四个管理接口对应的操作全部有承接后才允许切换。

**验证:** 现有 `verify-education-admissions.mjs`、`verify-education-admissions-ui.playwright.js`、`verify-education-permissions.mjs` 加新增官网流程；证明旧家长/孩子、一对一及试听关联仍正常。

**建议提交:** `feat: unify website inquiry and admissions workbench`

## 任务 7：统一部署、回归与发布制品

**Consumes:** 所有前述交付、现有运维与迁移工具。

**Produces:** 三端制品、配置模板、部署/回退说明、验证报告。

**涉及文件:** `infra/templates/`、`infra/docker-compose.yml`（仅需要的服务配置）、`tooling/bootstrap/init-frontend.mjs`、`scripts/serve.mjs`、部署网关配置模板（新增具体文件）、`docs/FOUNDATION.md`、`docs/OPERATIONS.md`、统一发布打包脚本（新增）。

- 官网构建与 admin/server 分开产生制品，使用一个后端地址；同一台开发机 API 48080 只运行一个目标服务，避免旧官网后端端口冲突。
- 网关对官网公开 API 固定机构租户，保留小程序/后台各自认证路由；覆盖不可信 Forwarded 头；API 返回正确错误体，SPA fallback 不吞掉 API 错误。
- 配置示例不含密钥；保持生产与 mock/foundation 支付配置隔离；运行账号、存储和支付沿用原配置边界。
- 冻结已应用迁移，只追加；在隔离库先验证变更再进入目标环境。迁移工具 validate 也可能创建 Liquibase 元数据表，不能宣传为绝对只读。
- 发布前按原工具备份完整业务库、私有文件和关联配置，记录恢复点；不只备份 edu 表。验证回退应用仍能兼容新可空字段和技术表。
- 保留统一 Quartz 任务和原支付通知链路；切换后停止旧官网后端写入口，不长期双写或重复注册任务。
- 回退先关闭官网新咨询受理/回退前端，保留新线索、回执和订单。后端/admin 保留支持匿名来源的最低兼容版本；必须回退更早版本时，先验证原 CRM 线索页能够接手已收到的官网线索。回退官网页关闭提交，不启用旧官网后端写入，不删除回执表或把新业务回滚到旧数据库快照。
- 更新交付说明：启动顺序、环境变量、迁移、健康检查、备份、回退、管理员入口和匿名开关。不能假设当前已安装 Actuator；使用现有可用检查方式或明确新增受限 readiness。

**必要回归集（只在隔离集成环境执行写入夹具）:**

| 验证面 | 现有工具/新增场景 | 通过条件 |
|---|---|---|
| 公共读取 | discovery、brand；新增官网 catalog | 两端同发布版本，分页/直达/图片/空状态正确 |
| 咨询与权限 | admissions、permissions；新增 website-admission | 匿名闭环、幂等、限流、审计、来源和访问范围正确 |
| 小程序教育主流程 | `verify-education-flow.mjs` | 孩子、课程、报名和学习关系仍可用 |
| 交易基础回归 | `verify-education-trade.mjs`，涉及生命周期改动时追加 coupons/late-payment/recovery | 订单/支付/报名状态与金额库存不被整合破坏 |
| 公开作品边界 | `verify-education-work-publication.mjs` | 未授权不可见、撤回后详情/附件失效，演示不冒充学员成果 |
| 数据与发布 | production-migrations、schema、runtime-persistence、build-freshness | 增量可重复、数据持久、运行制品确为当前代码 |
| 恢复 | `verify-backup-restore.mjs` | 专用副本恢复成功、关联记录完整 |

测试报告写明分支 SHA、环境、执行命令、结果、未验证的外部条件。真实微信支付/域名/存储未验证时标出具体项，不用本地 mock 通过宣称生产可用。

**建议提交:** `chore: package and verify unified website platform`

## 发布完成的业务判断

以下全部成立，首期才算完成：

- 在同数据、同视口和固定轮播帧下，官网布局、样式、图片和交互入口与接入前一致；源码 diff 不含无关 CSS、素材、路由或品牌文案改动。
- 官网管理后台已完整迁入统一后台：双标签页、课程介绍所有字段、排序/发布开关、咨询列表/详情/三态/内部备注，以及菜单和权限逐项通过验收。
- 运营发布一门实际课程后，官网已有课程展示与小程序读取同一公开版本，草稿不会提前出现；静态服务方向卡片保持原展示。
- 家长无需注册即可从官网咨询；招生在现有后台看到来源、课程和联系方式并跟进。
- 重复提交不产生重复线索；员工、家长、匿名三种身份不能互相越权。
- 小程序原有孩子、试听、班期、订单和学习流程保持正常。
- 环境中只有一套目标业务后端和后台写入口，官网原演示库没有被导入。
- 可交付的完整制品、配置示例、迁移及回退说明齐备，验收证据来自本次集成代码。

## 延后项

官网直接登录/购买、复杂可视化 CMS、多机构独立配置、手机号跨渠道自动归因、课程 SEO slug、AI 功能扩展另开范围。真实学员作品在授权文案明确覆盖官网后接入；一期保留高质量课程方向演示，不为等待授权拖延课程和咨询统一。
