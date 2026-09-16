# VIBE CODING · 设计与验证证据

本文件记录已经实现的界面规则，以及能够追溯到截图、源码、构建日志或测试报告的结果。它不代替完整发布验收，也不把计划中的设备测试、性能指标写成已测结论。

更新时间：2026-09-14 08:00（Asia/Shanghai）。[打开截图画廊](screenshots/index.html)。画廊只使用仓库内已有图片，不把缺失页面补成演示图。

## 证据如何阅读

| 类型 | 能够证明 | 不能据此推断 |
| --- | --- | --- |
| 真实 API · H5 | UniApp H5 在浏览器中使用原会员登录、真实本地 API 与 MySQL 返回内容后的可见状态 | 微信 DevTools、手机真机、真实手机号授权、真实微信支付已经通过 |
| 真实 API · 后台 | 原后台登录、权限菜单和教育接口下的可见页面；操作结果另见真实交互报告 | 仅凭一张截图证明所有角色、并发、全部错误路径都正确 |
| 浏览器故障注入 | 在指定浏览器请求上制造一次失败后，验证失败提示、保留输入或单项重试 | 真实移动网络弱网、系统杀进程、微信文件缓存期限均已覆盖 |
| 历史版本 | 修改前的可追溯视觉记录 | 当前交付界面或当前页面覆盖数量 |
| 构建 / 静态检查 | 指定时间、指定代码与工具链能够编译或通过对应检查 | 所有运行平台或所有第三方服务已经联调成功 |
| 来源待核实 | 文件存在，等待补充采集方法 | 自动把新增图片认定为真实 API 验证 |

截图中的课程、孩子、班期、作业等均为本地合成测试资料。原身份、原权限、原文件和原 trade/pay 流程仍是实际调用路径；没有建立第二套账号或前端成功模拟器。上传故障注入的认证未被替换，只有第二个文件的一个请求被中断，第一项与重试项仍走真实 API。课程网络失败图来自另一次单独的课程查询请求中断；延迟旧查询的测试也单独记录在采集脚本中。

## 当前课程封面

本次新增六类 AI 创作示意图，按互动故事、小游戏、个人网站、实用工具、AI 应用和综合产品映射。当前正常页面截图为 [桌面首页四卡](screenshots/course-images-home-desktop.png)、[手机首页完整一卡](screenshots/course-images-home-mobile.png) 和 [手机课程详情](screenshots/course-images-detail-mobile.png)。详情见 [图像来源、尺寸与替换规则](COURSE_IMAGES.md)。

[独立浏览器脚本](../tooling/bootstrap/verify-course-images.playwright.js) 对真实首页 4 卡、选课首屏 20 卡检查实际方向、图像 URL、自然尺寸和 16:9；390 / 1440px 视口无横向溢出，正常场景无页面异常。另一个独立浏览器上下文只中断一次 tools.jpg，验证图形兜底与无循环重试；上述三张正常截图没有请求拦截。截图保留本地 TEST 文案，图像不声称是真实学员成果或实际授课照片。

已逐图确认旧耳机封面的 7 张截图（首页 320 / 375 / 390 / 430px、首页主图、首页早期图和旧选课列表）加注“旧封面样式”，原真实 API 或历史来源类别保持不变。原课程详情截图显示的是旧版封面缺失状态，单独说明；筛选、空状态、错误、交易、教学及后台证据不因本次图像修改而一概作废。

## 一对一高级课

独立入口保留常规选课路径，同时提供选老师、选择孩子与北京时间、填写学习目标、提交预约申请及撤回记录。六张新截图分别记录 [手机选老师](screenshots/one-to-one-mobile.png)、[桌面选老师](screenshots/one-to-one-desktop.png)、[预约表单](screenshots/one-to-one-request-form.png)、[刷新失败时仍保留提交结果](screenshots/one-to-one-submitted-retry.png)、[原 CRM 详情](screenshots/one-to-one-admin-request.png) 和 [教师预约开关](screenshots/one-to-one-admin-teacher.png)。功能、数据与正式授课边界见 [一对一高级课说明](ONE_TO_ONE.md)。

本轮 [浏览器脚本](../tooling/bootstrap/verify-one-to-one-ui.playwright.js) 的 8 组检查通过。H5 使用原会员登录，后台截图使用原本地开发管理员登录；后台查询、教师开关和预约业务均由真实服务处理。故障场景只向申请接口注入一次 401，并中断一次记录查询：真正的会话续期和后续提交仍走原接口，记录刷新失败不会隐藏已保存的申请，查询重试不再次创建。成功面板截图只展示保留的结果，错误提示及重试行为由对应报告验证；正常选老师、表单和后台截图没有伪造响应。

这些截图中的孩子、教师和联系资料为本地 TEST 数据，期望时间与老师选择不是锁定日程或最终报价。320 / 390 / 1440px 浏览器布局检查和真实 API 结果不代表微信真机、真实手机号授权或真实商户支付已验收。

## 课程决策与报名连续性

对照新东方官方网页和公开 H5 完成首页三条服务路径、正式班筛选与详情价格一致、班期分组与锚点、逐项放宽条件、原会员登录续接及孩子规则确认。详见 [对照与优化说明](BENCHMARK_OPTIMIZATION.md) 和 [官方来源研究](research/NEW_ORIENTAL_2026-09-14.md)。官方两张截图留在研究目录，不与我方 H5 截图混计；新东方原生微信小程序仍未核实。

[组合浏览器脚本](../tooling/bootstrap/verify-benchmark-ux.playwright.js) 最终 8 组通过（2026-09-14 07:59，Asia/Shanghai）。本轮七图只有班期确认使用原会员密码登录，其余匿名；登录表单截于填写凭据之前。零结果由真实查询返回，图中保留条件与恢复入口。脚本只在登录后的孩子 GET 主动中断一次，后续读取恢复后仍返回原班期；另实测切换真实孩子撤销规则勾选。没有发送短信、创建预约、下单或付款。本机原始报告为 .runtime/benchmark-ux-report.json，交付副本由统一导出生成。

当前公开 29 门课程均为 TEST / 验收资料，截图里的费用、教师和孩子不能作为正式售卖或师资宣传。改动复用原会员、选课袋、教育和 CRM 接口，没有新增第二套账号或交易。320 / 390 / 430 / 1440px 的指定路由无整页横向溢出；本轮 H5 与 mp-weixin 构建通过仍不代表微信真机验收。

## 已落地的设计规则

以源码为准：[后台教育样式](../apps/admin/src/styles/edu.scss)、[小程序教育样式](../apps/miniapp/edu/theme.scss)、[后台状态组件](../apps/admin/src/views/edu/components/EduStatus.vue)、[小程序加载/错误/空状态](../apps/miniapp/components/edu/EduState.vue)。

| 规则 | 当前实现值 | 用途与边界 |
| --- | --- | --- |
| 品牌橙 | #FF7A00 | 主操作、当前菜单与少量强调；主按钮使用深色文字 |
| 主要文字 / 深色侧栏 | #1D1D1F | 信息主体与后台导航 |
| 页面底色 | #F5F5F7 | 白色内容卡片之外的画布 |
| 浅橙 / 深橙 | #FFF3E8 / #C94B00 | 小程序辅助按钮、标签与文字链接；状态仍有文字说明 |
| 正文与标题 | H5 正文 16px、标题 24px、章节 20px；后台正文/表格 14px、页标题 28px | 这些是样式定义，不是全机型字体渲染一致性的实测结论 |
| 字体 | 小程序系统字体栈：Apple 系统字体、PingFang SC、Microsoft YaHei、sans-serif | 不下载外部字体；实际字形取决于设备可用字体 |
| 卡片 | 后台 12px 圆角 / 22px 内边距；小程序 16px 圆角 / 16px 内边距 | 白底、浅边框，保持表单、列表与说明分组 |
| 操作尺寸 | 小程序主按钮最小 48px、链接与筛选控件最小 44px | 代码尺寸约束；尚未进行系统辅助功能尺度的设备验收 |
| 表格 | 14px，单元格设置 48px 高度，内容多时可撑高 | 金额按元展示；接口金额为整数分，相关金额列右对齐 |
| 焦点 | 后台链接和按钮 focus-visible 使用 3px 轮廓与 3px 外间距 | 已有键盘焦点样式；未声明完成全站读屏或 WCAG 审计 |
| 布局 | 小程序内容最大 880px；后台教育区最大 1640px | 320/375/390/430px 浏览器截图仅说明被采集的布局，不代表所有设备 |
| 动效与安全区域 | reduced-motion 媒体查询；底部操作区使用 safe-area-inset-bottom | 微信与不同机型的安全区域仍需真机验证 |

后台继续使用原 Vue 3 / Element Plus 的表格、表单、抽屉、菜单和权限指令。家长端继续使用原 UniApp 工程、会员状态和原生 Tab，不另起一个并行管理系统。

## 关键交互状态与实证

| 场景 | 当前行为 | 证据与验证方式 |
| --- | --- | --- |
| 加载、空数据、接口错误 | 加载骨架、具体空状态、可重试错误；没有静默演示数据回退 | EduState / useResource 源码；已有真实 API 与早期离线浏览器检查 |
| 筛选与返回 | 后台按资源保存筛选/分页；课程筛选先编辑后应用 | 后台 useEduPage、课次页同一筛选键；课程页实现与 H5 浏览器检查 |
| 查询响应乱序与恢复 | 旧的零结果响应后到时不覆盖最新列表；取消筛选保留已应用值；零结果和网络失败都可恢复 | 课程发现 UI 5 项：真实 API，指定旧请求被延迟一次、另一次请求被 abort；没有伪造成功响应 |
| 学习列表路由 | calendar → assignments 的真实 uni.navigateTo 与返回恢复正确标题；直接 hash 采集应等待目标状态，批量截图使用 about:blank 重载 | 学习 UI 真实浏览器报告第 1、2 项 |
| 学习资料 | 展示原始文件名与所属课次；通过带授权头的私有文件接口下载 | 学习 UI 真实浏览器报告：下载文件名与完整字节逐项相等 |
| 成长报告 | 可阅读 summary/content、strengths、nextSteps | 学习 UI 真实浏览器报告：使用已发布真实报告字段断言 |
| 调班 | 从有效报名进入；关联 enrollmentId/courseId/studentId；只列出同课程、同类型、同版本、同价且未开课有余量的其他班期 | 学习 UI 真实浏览器报告：实际 TEST 申请成功，随后拒绝清理；后端保留最终冲突校验 |
| 作业附件失败 | 每项上传状态、失败原因、只重试/重选失败项；成功项与文字保留；存在失败项时不提交 | 单次浏览器 abort 故障注入截图和 [上传回归脚本](../tooling/browser-verify-upload.js) |
| 本地作业恢复 | 本地草稿按会员/孩子/作业隔离；重新加载恢复文字与已上传引用 | [草稿恢复脚本](../tooling/browser-verify-draft.js)；对应归档图片出现后纳入下方清单，不等同系统杀进程真机验证 |
| 教师草稿 | 左侧作品、右侧反馈；未保存时不显示“已保存”；反馈、requireRevision、revision 与 updateTime 来自服务器 | 教学后台真实浏览器报告：首次保存、重开与保存时间断言 |
| 教师并发编辑 | 发送当前 revision；另一编辑者先保存后，旧版本被拒绝，本地输入保留；已发布版本只读 | 教学后台真实浏览器报告；独立点评 API 9 项含首次/已有草稿并发 |
| 考勤 | 查询原 enrollment/page 时带 sessionId，回填状态、备注和服务器更新时间 | 教学后台真实浏览器报告保存后重开；API 9 项含不同课次隔离与范围限制 |
| 月历与排课 | 同一原 session API、同一 rows 状态；月历汇总所有匹配分页，列表保留筛选；跨午夜显示结束日期 | 原后台登录月历实测；教学后台真实浏览器报告；没有第二套排课存储 |
| 排课预览 | 保存前只读检查教师/教室/班级/学员冲突，展示前后时间与受影响学员；修改表单使预览失效；最终保存继续执行事务内检查 | 教学后台真实浏览器报告验证预览不改版本/标题、修改后发送新候选参数 |
| 作品授权与公开附件 | 监护人先看确切不可变版本；公开读取每次检查当前授权和发布；附件只通过该版本的序号获取，HTML/ZIP 下载不执行 | 作品公开 API 6 项；专门的版本预览/撤回验证 |
| 一对一高级课预约 | 独立选老师入口；按孩子保留草稿，重新确认联系授权；实际提交结果不会被记录刷新失败覆盖；本人可撤回且历史保留 | [浏览器报告](verification/one-to-one-ui-report.json)：8 组 PASS；[真实 API/MySQL 报告](verification/one-to-one-api-report.json)：6 组 PASS；期望时段不是排课确认 |
| 下单与售后 | 同 SKU 的不同孩子保持独立行；价格变化需重新确认；KEEP/CANCEL 明确说明学习权益影响 | 原 trade/pay 实际 API 回归与结算单元测试；真实微信支付仍未验收 |

## 已保存的测试与构建结果

以下是各自运行时的结果，不作全项目“一切通过”的概括。后台已在品牌请求修复后重新完成活动模块类型检查、生产构建及发布边界验证；小程序构建结果按下表所列日志日期解读。

| 证据 | 当前保存结果 | 可复跑入口 / 本地报告 |
| --- | --- | --- |
| 学习页面真实浏览器 | 5 项 PASS | [脚本](../tooling/bootstrap/verify-education-learning-ui.playwright.js) · [报告](verification/education-learning-ui-report.json) |
| 教学后台真实浏览器 | 5 项 PASS，零页面异常 | [脚本](../tooling/bootstrap/verify-education-admin-teaching-ui.playwright.js) · [报告](verification/education-admin-teaching-ui-report.json) |
| 教学关键流程录屏 | 2 项 PASS；登录后录制，零页面异常与 API 失败 | [录制脚本](../tooling/bootstrap/capture-education-admin-flows.playwright.js) · [报告](verification/education-admin-video-report.json)；仅 TEST 草稿写入，排课预览取消 |
| 报名付款与退款状态录屏 | 5 项 PASS；独立原会员 / TEST 数据 / 原本地 mock 支付通道 | [录制脚本](../tooling/bootstrap/verify-education-payment-video.playwright.js) · [报告](verification/education-payment-video-report.json)；付款实际下单，退款仅回放已有结果，未真机或真实微信支付 |
| 点评与考勤真实 API | 9 项 PASS | [脚本](../tooling/bootstrap/verify-education-review.mjs) · [报告](verification/education-review-report.json) |
| 排课/报名并发真实 API | 7 项 PASS | [脚本](../tooling/bootstrap/verify-education-scheduling.mjs) · [报告](verification/education-scheduling-report.json) |
| 作品预览、公开附件、撤回 | 6 项 PASS | [脚本](../tooling/bootstrap/verify-education-work-publication.mjs) · [报告](verification/education-work-publication-report.json) |
| 成套教育 API 流程 | 18 项 PASS（报告所记时间） | [脚本](../tooling/bootstrap/verify-education-flow.mjs) · [报告](verification/education-flow-report.json) |
| 消息与成员隔离 | 11 项 PASS | [脚本](../tooling/bootstrap/verify-education-notifications.mjs) · [报告](verification/education-notification-report.json) |
| 课程发现、筛选与请求恢复 | 5 项 PASS（真实 API + 指定延迟/中断） | [脚本](../tooling/browser-verify-discovery-ui.js) · [报告](verification/education-discovery-ui-report.json) |
| 招生咨询与原 CRM 联动 | 最后一次 7 项 PASS，零页面异常、零 API 失败 | [脚本](../tooling/bootstrap/verify-education-admissions-ui.playwright.js) · [报告](verification/education-admissions-ui-report.json)；原会员/管理员实际登录，无请求拦截，仅创建 TEST 咨询并记录联系授权 |
| 一对一高级课真实浏览器与 API | 浏览器 8 组 PASS；实际 MySQL/API 6 组 PASS | [浏览器脚本](../tooling/bootstrap/verify-one-to-one-ui.playwright.js) · [浏览器报告](verification/one-to-one-ui-report.json) · [API 报告](verification/one-to-one-api-report.json)；原登录，单次 401 与单次查询中断单独标明 |
| H5 编译 | 2026-09-13 日志含 Build complete | [统一构建报告](verification/frontend-build-report.json)；输出 apps/miniapp/dist/build/h5 |
| mp-weixin 编译 | 2026-09-13 日志含 Build complete；日志明确尚未配置 AppID | [统一构建报告](verification/frontend-build-report.json)；输出 apps/miniapp/dist/build/mp-weixin |
| 后台活动模块类型与定向 ESLint | 本次两页定向 ESLint 与 ts:check:active PASS | apps/admin：pnpm exec eslint src/views/edu/submission/index.vue src/views/edu/session/index.vue；pnpm ts:check:active |
| 后台品牌修复后最终构建 | 活动类型检查、build:prod、发布边界均 PASS | [统一构建报告](verification/frontend-build-report.json) · [发布边界报告](verification/admin-release-boundary-report.json) |
| 原菜单与产物对应关系 | 108 个实际菜单组件、193 个清单视图、738 个 JS/CSS 产物通过检查 | [边界脚本](../tooling/bootstrap/verify-admin-release-boundary.mjs) · [报告](verification/admin-release-boundary-report.json)；此数值不代表所有组件均做过浏览器交互验收 |

交付报告使用 docs/verification 中经过凭据检查的副本；[验证索引](verification/README.md)记录各自时间与范围。原 .runtime 与原始构建日志不公开。复跑后使用 tooling/bootstrap/export-verification.mjs 更新副本，不能把凭据或 token 加入截图清单、文档或浏览器日志。最终后台原始日志位于本机 .tools/admin-final-active-typecheck.log、admin-final-production-build.log 与 admin-final-release-boundary.log。

## 已修复的本地后台权限提示

在全新独立浏览器中确认，原管理员身份为 userId=1、username=admin，角色为 common 与 super_admin；并非残留教师会话。间歇提示“没有该操作权限”来自 Logo 的品牌加载：原 Axios 默认把后台 Bearer Token 附给了公共 /app-api/edu/config/get。原 TokenAuthenticationFilter 会先比较路由与 Token 的用户类型，因此即使控制器允许匿名，该跨类型请求仍返回 HTTP 200 / 业务码 403。

修复限定在 [品牌加载入口](../apps/admin/src/api/edu/brand.ts)，使用原请求层已经支持的 isToken:false，仅对这条公共请求省略后台 Token，继续保留 tenant-id。没有放宽后台认证、公共/后台身份边界或吞掉全局错误。

| 实际验证 | 结果 |
| --- | --- |
| 全新原管理员登录、打开课次页面 | 身份仍是原 admin1，UI 请求中无 HTTP/业务码 403 |
| 公共品牌请求，不带 Authorization、tenant-id=1 | HTTP 200 / code=0 |
| 有后台身份的 /admin-api/edu/session/preview | HTTP 200 / code=0，正确显示真实受影响学员 |
| 故意向 app-api 发送后台 Token 的独立对照请求 | 仍返回 code=403，证明原身份类型保护没有被移除 |

交付脱敏记录：[请求与身份验证报告](verification/admin-permission-debug-report.json)。它只记录路径、账户编号/角色、Token 是否存在与 Bearer 类型，不记录 Token 或密码值。

## 当前截图矩阵

当前清单共 **92 个影像文件：87 张截图、5 段录屏**。本轮新增课程决策与报名连续性 7 张截图；原有 79 个影像及一对一高级课 6 张截图完整保留。

下表与画廊的 JSON 清单同步。一个页面可有多张状态、宽度截图或一段录屏；影像文件数不等于独立页面数。文件更新时间仅用于追溯，不是加载时间或性能测量。

[结算、上传重试与本地草稿录屏](screenshots/flow-checkout-and-draft.webm) 使用原会员和实际 API：两个孩子用券后合计 89.99 元；仅第二项附件的一次请求被故意中断，第一项和重试均走真实上传 API。随后 reload 恢复文字及两项附件并清理本地队列，没有提交订单或作业。[实际报告](verification/education-video-report.json) 明确标记这次浏览器故障注入。

[教师草稿保存录屏](screenshots/flow-teacher-review.webm) 与 [排课预览录屏](screenshots/flow-schedule-preview.webm) 从原后台登录后的新页面开始，不含凭据，无拦截或 mock。前者显示未发布草稿的真实服务器时间；后者展示候选时间、1 位受影响学员与本次无冲突结果，随后取消并核对原排课未变。[2 项实际 UI 记录](verification/education-admin-video-report.json) 同时记录零页面异常和零 API 失败。

[报名付款录屏](screenshots/flow-enrollment-payment.webm) 展示独立原会员 10002 选择 TEST 孩子/班期、原优惠券报价 15.00→11.99 元、UI 下单及原本地 mock 付款，实际报名变为 ACTIVE。[退款结果录屏](screenshots/flow-refund-progress.webm) 只读展示原 API 已有 KEEP / CANCEL 成功记录及取消资格，**没有录制发起或审批退款**。两条均无请求拦截，登录不在录像中；[5 项报告](verification/education-payment-video-report.json) 仅证明本地 H5 与原支付测试通道，不代表真实微信支付。

<!-- EVIDENCE_MATRIX_START -->
| 页面 / 状态 | 来源类别 | 路由 | 影像与观察 |
| --- | --- | --- | --- |
| 当前封面 · 首页桌面卡片 | 真实 API · H5 | /pages/tab/home | [course-images-home-desktop.png](screenshots/course-images-home-desktop.png) — 1440px 浏览器视口，截取完整四卡区域；真实 API 课程按方向显示创作示意图，图像全部加载且为 16:9，无横向溢出。保留本地 TEST 课程内容。 |
| 当前封面 · 首页手机卡片 | 真实 API · H5 | /pages/tab/home | [course-images-home-mobile.png](screenshots/course-images-home-mobile.png) — 390px 浏览器视口，截取一张完整课程卡片；真实 API、方向图完整加载与“创作示意”标注。固定导航未遮挡图片或价格；保留本地 TEST 文案。 |
| 当前封面 · 手机课程详情 | 真实 API · H5 | /pages/edu/course?id=35 | [course-images-detail-mobile.png](screenshots/course-images-detail-mobile.png) — 从实际首页点击进入课程 35；390px 视口，工具创作图完整加载，课程资料来自真实 API。AI 创作示意并非实际学员作品或真实授课照片。 |
| 一对一高级课 · 手机选老师 | 真实 API · H5 | /pages/edu/one-to-one | [one-to-one-mobile.png](screenshots/one-to-one-mobile.png) — 390px 浏览器中的独立高级课程入口，展示真实本地公开教师目录与老师选中状态。这里提交期望时间申请，尚未锁定课次或报价；教师明确标记 TEST。 |
| 一对一高级课 · 桌面选老师 | 真实 API · H5 | /pages/edu/one-to-one | [one-to-one-desktop.png](screenshots/one-to-one-desktop.png) — 1440px 浏览器视口的高级课程介绍与真实可预约教师列表；保留课程选择与独立一对一入口。页面未伪造正式师资、价格或预约成功状态。 |
| 一对一高级课 · 预约申请表单 | 真实 API · H5 | /pages/edu/one-to-one | [one-to-one-request-form.png](screenshots/one-to-one-request-form.png) — 原会员实际登录后的完整表单截图：孩子、意向老师、北京时间、期望时长、学习目标、联系方式及再次确认。按孩子保留草稿，联系授权需重新勾选；此图采集时尚未注入失败。 |
| 一对一高级课 · 刷新失败仍保留提交结果 | 浏览器故障注入 | /pages/edu/one-to-one | [one-to-one-submitted-retry.png](screenshots/one-to-one-submitted-retry.png) — 截取真实提交成功后保留的结果面板，画面本身不含记录列表的错误提示。该独立场景仅注入一次申请接口401和一次记录查询中断；原会员续期、重试创建与持久化仍由真实服务处理，随后查询重试不再创建申请。 |
| 一对一高级课 · 原 CRM 预约详情 | 真实 API · 后台 | /edu/admission | [one-to-one-admin-request.png](screenshots/one-to-one-admin-request.png) — 原本地开发后台登录后的真实 CRM 详情抽屉；通过一对一服务筛选定位申请，展示意向老师姓名快照、北京时间、学习目标和原负责人。后台截图无成功响应模拟，期望时段不代表已排课。 |
| 一对一高级课 · 原教师档案开关 | 真实 API · 后台 | /edu/teacher | [one-to-one-admin-teacher.png](screenshots/one-to-one-admin-teacher.png) — 原本地开发后台登录后的教师编辑抽屉，复用原员工身份并显示一对一预约开关。截图为打开状态；对应真实交互报告验证关闭后从公开目录移除、重新打开后恢复，仅修改本轮 TEST 老师。 |
| 招生咨询工作台 | 真实 API · 后台 | /edu/admission | [admin-edu-admission.png](screenshots/admin-edu-admission.png) — 原管理员登录与真实 API 响应下的当前页面；具体写入与权限行为另见对应回归。 |
| 教学作业 | 真实 API · 后台 | /edu/assignment | [admin-edu-assignment.png](screenshots/admin-edu-assignment.png) — 原管理员登录与真实 API 响应下的当前页面；具体写入与权限行为另见对应回归。 |
| 校区管理 | 真实 API · 后台 | /edu/campus | [admin-edu-campus.png](screenshots/admin-edu-campus.png) — 原管理员登录与真实 API 响应下的当前页面；具体写入与权限行为另见对应回归。 |
| 班期管理 | 真实 API · 后台 | /edu/cohort | [admin-edu-cohort.png](screenshots/admin-edu-cohort.png) — 原管理员登录与真实 API 响应下的当前页面；具体写入与权限行为另见对应回归。 |
| 课程与版本 | 真实 API · 后台 | /edu/course | [admin-edu-course.png](screenshots/admin-edu-course.png) — 原管理员登录与真实 API 响应下的当前页面；具体写入与权限行为另见对应回归。 |
| 报名资格 | 真实 API · 后台 | /edu/enrollment | [admin-edu-enrollment.png](screenshots/admin-edu-enrollment.png) — 原管理员登录与真实 API 响应下的当前页面；具体写入与权限行为另见对应回归。 |
| 成长报告管理 | 真实 API · 后台 | /edu/growth-report | [admin-edu-growth-report.png](screenshots/admin-edu-growth-report.png) — 原管理员登录与真实 API 响应下的当前页面；具体写入与权限行为另见对应回归。 |
| 请假与转班 | 真实 API · 后台 | /edu/request | [admin-edu-request.png](screenshots/admin-edu-request.png) — 原管理员登录与真实 API 响应下的当前页面；具体写入与权限行为另见对应回归。 |
| 教室管理 | 真实 API · 后台 | /edu/room | [admin-edu-room.png](screenshots/admin-edu-room.png) — 原管理员登录与真实 API 响应下的当前页面；具体写入与权限行为另见对应回归。 |
| 课次排课列表 | 真实 API · 后台 | /edu/session | [admin-edu-session.png](screenshots/admin-edu-session.png) — 原管理员登录与真实 API 响应下的当前页面；具体写入与权限行为另见对应回归。 |
| 品牌与首页配置 | 真实 API · 后台 | /edu/settings | [admin-edu-settings.png](screenshots/admin-edu-settings.png) — 原管理员登录与真实 API 响应下的当前页面；具体写入与权限行为另见对应回归。 |
| 学员档案 | 真实 API · 后台 | /edu/student | [admin-edu-student.png](screenshots/admin-edu-student.png) — 原管理员登录与真实 API 响应下的当前页面；具体写入与权限行为另见对应回归。 |
| 作品批改列表 | 真实 API · 后台 | /edu/submission | [admin-edu-submission.png](screenshots/admin-edu-submission.png) — 原管理员登录与真实 API 响应下的当前页面；具体写入与权限行为另见对应回归。 |
| 师资档案 | 真实 API · 后台 | /edu/teacher | [admin-edu-teacher.png](screenshots/admin-edu-teacher.png) — 原管理员登录与真实 API 响应下的当前页面；具体写入与权限行为另见对应回归。 |
| 体验预约 | 真实 API · 后台 | /edu/trial | [admin-edu-trial.png](screenshots/admin-edu-trial.png) — 原管理员登录与真实 API 响应下的当前页面；具体写入与权限行为另见对应回归。 |
| 作品审核与发布 | 真实 API · 后台 | /edu/work | [admin-edu-work.png](screenshots/admin-edu-work.png) — 原管理员登录与真实 API 响应下的当前页面；具体写入与权限行为另见对应回归。 |
| 教学工作台 | 真实 API · 后台 | /index | [admin-index.png](screenshots/admin-index.png) — 原管理员实际 API 教学工作台，按可访问范围显示待办和课次。 |
| 作业批改 · 实际版本冲突 | 真实 API · 后台 | /edu/submission | [admin-review-conflict-live.png](screenshots/admin-review-conflict-live.png) — 另一真实编辑者先保存后，旧 revision 被拒绝；当前反馈与勾选状态保留。 |
| 课次排课 · 月历 | 真实 API · 后台 | /edu/session | [admin-session-calendar-live.png](screenshots/admin-session-calendar-live.png) — 同一原 session API 的月份视图，保留班期筛选并展示真实课次。 |
| 课次排课 · 影响预览 | 真实 API · 后台 | /edu/session | [admin-session-impact-live.png](screenshots/admin-session-impact-live.png) — 真实只读预览：原时间、候选时间、当前受影响学员及通知说明。 |
| 招生咨询 · 原 CRM 线索 | 真实 API · 后台 | /edu/admission | [admission-admin-live.png](screenshots/admission-admin-live.png) — 原管理员会话读取 TEST 招生线索，沿用原 CRM 负责人数据范围。 完整招生 UI 套件已通过 7 项真实浏览器检查。 |
| 招生跟进 · 原 CRM 记录 | 真实 API · 后台 | /crm/clue/detail | [admission-followup-live.png](screenshots/admission-followup-live.png) — 通过原跟进记录界面管理 TEST 咨询；不是新建并行客户系统。 完整招生 UI 套件已通过 7 项真实浏览器检查。 |
| 双孩子结算、上传重试与草稿恢复 | 浏览器故障注入 | /pages/edu/cart → checkout；assignment | [flow-checkout-and-draft.webm](screenshots/flow-checkout-and-draft.webm) — 原会员与实际 API：双孩子用券后合计 89.99 元；仅第二项附件的一次上传请求被故意中断，成功项与重试走真实 API。随后 reload 恢复文字及两项附件并清理本地队列；没有提交订单或作业。 |
| 报名与付款 · 原本地支付测试通道 | 真实 API · H5 | /pages/edu/cohort → checkout → orders | [flow-enrollment-payment.webm](screenshots/flow-enrollment-payment.webm) — 独立原会员 10002 的 TEST 孩子/班期选择、原券报价 15.00→11.99 元、UI 下单和原 mock 付款，实际报名转为 ACTIVE。无请求拦截，登录不在录像中；仅本地测试通道，不代表真实微信支付。 |
| 退款结果 · KEEP / CANCEL 只读回放 | 真实 API · H5 | /pages/edu/refunds | [flow-refund-progress.webm](screenshots/flow-refund-progress.webm) — 只读展示原 API 已有的 KEEP 成功退款与 CANCEL 成功退款/资格取消状态。没有录制发起或审批退款，没有新退款操作；无请求拦截，登录在录屏外，仅本地支付测试记录。 |
| 月历排课 · 影响预览与取消 | 真实 API · 后台 | /edu/session | [flow-schedule-preview.webm](screenshots/flow-schedule-preview.webm) — 原管理员与实际 API：月历中把 TEST 课次候选时间后移 30 分钟，查看前后时间、1 位受影响学员与本次无冲突结果；取消后复查原排课时间及版本不变，无保存或对外发送。 |
| 教师批改 · 保存未发布草稿 | 真实 API · 后台 | /edu/submission | [flow-teacher-review.webm](screenshots/flow-teacher-review.webm) — 原管理员实际登录，录制从登录后开始。打开 TEST 待批作品、编辑反馈、保存 DRAFT revision 0→1，显示真实服务器更新时间；不发布反馈，无拦截或对外发送。 |
| 成长报告 · 正文展开 | 真实 API · H5 | /pages/edu/learning-list?type=reports | [learning-report-live.png](screenshots/learning-report-live.png) — 实际已发布报告的 summary、strengths 与 nextSteps 已展开并逐项断言。 |
| 调班 · 实际相容班期选择 | 真实 API · H5 | /pages/edu/requests | [learning-transfer-live.png](screenshots/learning-transfer-live.png) — 真实有效报名下的 TEST 目标班期与申请原因；随后真实提交并拒绝清理。 |
| 作业详情与提交 | 真实 API · H5 | /pages/edu/assignment | [mini-assignment.png](screenshots/mini-assignment.png) — 真实作业内容、附件队列与草稿/提交入口。 |
| 我的作业 | 真实 API · H5 | /pages/edu/learning-list?type=assignments | [mini-assignments.png](screenshots/mini-assignments.png) — 已发布作业列表与截止时间。 |
| 课程日历 | 真实 API · H5 | /pages/edu/learning-list?type=calendar | [mini-calendar.png](screenshots/mini-calendar.png) — 按当前孩子读取有权益的课次 |
| 校区 | 真实 API · H5 | /pages/edu/campuses | [mini-campuses.png](screenshots/mini-campuses.png) — 已发布校区列表 |
| 购物车 | 真实 API · H5 | /pages/edu/cart | [mini-cart.png](screenshots/mini-cart.png) — 原 trade 购物车与孩子维度课程行 |
| 确认报名 · 用券后金额 | 真实 API · H5 | /pages/edu/checkout | [mini-checkout-coupon.png](screenshots/mini-checkout-coupon.png) — 原结算接口重新计价，展示优惠额与金额变化确认。 |
| 孩子档案 | 真实 API · H5 | /pages/edu/children | [mini-children.png](screenshots/mini-children.png) — 原会员名下的 TEST 孩子资料 |
| 班期详情 | 真实 API · H5 | /pages/edu/cohort | [mini-cohort.png](screenshots/mini-cohort.png) — 真实 SKU 价格/余量与教学日程 |
| 招生咨询 · 真实表单 | 真实 API · H5 | /pages/edu/consultation | [mini-consultation-live.png](screenshots/mini-consultation-live.png) — 原会员会话下的实际课程/孩子选项和联系授权表单。 完整招生 UI 套件已通过 7 项真实浏览器检查。 |
| 招生咨询 · 提交完成 | 真实 API · H5 | /pages/edu/consultation | [mini-consultation-success.png](screenshots/mini-consultation-success.png) — TEST 咨询经实际 API 提交并写入原 CRM；仅记录联系授权，没有发送外部消息。 完整招生 UI 套件已通过 7 项真实浏览器检查。 |
| 招生咨询 | 真实 API · H5 | /pages/edu/consultation | [mini-consultation.png](screenshots/mini-consultation.png) — 原招生选项与咨询表单。 |
| 优惠券选择 | 真实 API · H5 | /pages/edu/checkout | [mini-coupon-selector.png](screenshots/mini-coupon-selector.png) — 原优惠券数据，区分可用与不可用并确认选择。 |
| 课程筛选面板 | 真实 API · H5 | /pages/tab/courses | [mini-course-filters.png](screenshots/mini-course-filters.png) — 真实课程页的筛选面板；本次编辑在应用前保留原筛选。 |
| 课程详情 | 真实 API · H5 | /pages/edu/course | [mini-course.png](screenshots/mini-course.png) — 课程介绍、课时大纲与班期入口 此次采集的旧版缺失封面未显示图片；课程资料证据保留，当前封面参见 course-images-detail-mobile.png。 |
| 课程列表 · 零结果 | 真实 API · H5 | /pages/tab/courses | [mini-courses-empty.png](screenshots/mini-courses-empty.png) — 真实查询返回零条课程后的可操作空状态。 |
| 课程查询 · 网络失败 | 浏览器故障注入 | /pages/tab/courses | [mini-courses-error.png](screenshots/mini-courses-error.png) — 浏览器只中断一次课程查询请求，显示行内失败与重新加载入口；后续成功仍读取真实 API。 |
| 课程列表 · 旧封面样式 | 真实 API · H5 | /pages/tab/courses | [mini-courses.png](screenshots/mini-courses.png) — 课程卡片、搜索与筛选入口 此图可见旧耳机占位封面，保留当时真实 API、筛选或布局证据；不代表当前课程封面。 |
| 独立 TEST 报名 · 原券结算 | 真实 API · H5 | /pages/edu/checkout | [mini-enrollment-checkout.png](screenshots/mini-enrollment-checkout.png) — 原会员 10002 的实际 TEST 班期与孩子进入原结算，优惠券将 15.00 元调整为 11.99 元；独立于主家长购物车。 |
| 独立 TEST 报名 · 本地支付完成 | 真实 API · H5 | /pages/edu/orders | [mini-enrollment-paid.png](screenshots/mini-enrollment-paid.png) — UI 通过原本地 mock 通道完成订单 26 / 支付单 26，实际报名为 ACTIVE。此图不证明真实微信商户支付或真机通过。 |
| 首页 · 320px 视口 · 旧封面样式 | 真实 API · H5 | /pages/tab/home | [mini-home-320.png](screenshots/mini-home-320.png) — 实际 API；该次浏览器采集检查无整页横向溢出，不代表全部路由/真机。 此图可见旧耳机占位封面，保留当时真实 API、筛选或布局证据；不代表当前课程封面。 |
| 首页 · 375px 视口 · 旧封面样式 | 真实 API · H5 | /pages/tab/home | [mini-home-375.png](screenshots/mini-home-375.png) — 实际 API；该次浏览器采集检查无整页横向溢出，不代表全部路由/真机。 此图可见旧耳机占位封面，保留当时真实 API、筛选或布局证据；不代表当前课程封面。 |
| 首页 · 390px 视口 · 旧封面样式 | 真实 API · H5 | /pages/tab/home | [mini-home-390.png](screenshots/mini-home-390.png) — 原会员浏览器实际 API 首页布局；不代表微信真机或全路由验收。 此图可见旧耳机占位封面，保留当时真实 API、筛选或布局证据；不代表当前课程封面。 |
| 首页 · 430px 视口 · 旧封面样式 | 真实 API · H5 | /pages/tab/home | [mini-home-430.png](screenshots/mini-home-430.png) — 实际 API；该次浏览器采集检查无整页横向溢出，不代表全部路由/真机。 此图可见旧耳机占位封面，保留当时真实 API、筛选或布局证据；不代表当前课程封面。 |
| 首页 · 历史版 · 旧封面样式 | 历史版本 | /pages/tab/home | [mini-home-initial.png](screenshots/mini-home-initial.png) — 视觉修改前的保留截图；不计入当前界面覆盖。 此图可见旧耳机占位封面，保留当时真实 API、筛选或布局证据；不代表当前课程封面。 |
| 首页 · 旧封面样式 | 真实 API · H5 | /pages/tab/home | [mini-home.png](screenshots/mini-home.png) — 课程推荐、品牌导航与四个原生 Tab 此图可见旧耳机占位封面，保留当时真实 API、筛选或布局证据；不代表当前课程封面。 |
| 学习空间 | 真实 API · H5 | /pages/tab/learning | [mini-learning.png](screenshots/mini-learning.png) — 当前孩子、已报名课程与学习工具 |
| 原会员登录 · 独立浏览器 | 真实 API · H5 | /pages/edu/login | [mini-login-live.png](screenshots/mini-login-live.png) — 独立浏览器中的原会员登录表单；后续使用真实账号完成登录并访问业务 API，没有请求拦截。 |
| 学习资料 | 真实 API · H5 | /pages/edu/learning-list?type=materials | [mini-materials.png](screenshots/mini-materials.png) — 当前孩子有权益的课次资料；附件仍通过授权接口访问。 |
| 我的 | 真实 API · H5 | /pages/tab/me | [mini-me.png](screenshots/mini-me.png) — 原会员账户入口与消息/订单导航 |
| 消息中心 | 真实 API · H5 | /pages/edu/messages | [mini-messages.png](screenshots/mini-messages.png) — 原系统通知的会员收件列表与已读状态。 |
| 教学订单详情 | 真实 API · H5 | /pages/edu/orders?id=… | [mini-order-detail.png](screenshots/mini-order-detail.png) — 原 trade 订单明细与孩子、班期、售后入口。 |
| 订单 | 真实 API · H5 | /pages/edu/orders | [mini-orders.png](screenshots/mini-orders.png) — 原 trade 订单记录与教学服务状态 |
| 支付结果 · 已关闭 | 真实 API · H5 | /pages/pay/index | [mini-payment-closed.png](screenshots/mini-payment-closed.png) — 原 pay 已关闭状态，不继续发起支付。 |
| 支付结果 · 已退款 | 真实 API · H5 | /pages/pay/result | [mini-payment-refunded.png](screenshots/mini-payment-refunded.png) — 原 pay 已退款状态；仅本地支付测试通道。 |
| 支付结果 | 真实 API · H5 | /pages/pay/result | [mini-payment-result.png](screenshots/mini-payment-result.png) — 原 pay 订单状态；仅本地支付测试通道，不代表真实微信商户支付。 |
| 公开作品 | 真实 API · H5 | /pages/edu/works?public=1 | [mini-public-works.png](screenshots/mini-public-works.png) — 仅通过当前授权及审核发布条件的公开作品。 |
| 退款结果 · 原记录与学习权益 | 真实 API · H5 | /pages/edu/refunds | [mini-refund-results.png](screenshots/mini-refund-results.png) — 只读展示实际原 API 已有 KEEP / CANCEL 成功退款记录及取消资格；不是本轮通过 UI 发起或审批退款。 |
| 退款售后 | 真实 API · H5 | /pages/edu/refunds | [mini-refunds.png](screenshots/mini-refunds.png) — 原售后记录与 KEEP/CANCEL 权益说明 |
| 成长报告 | 真实 API · H5 | /pages/edu/learning-list?type=reports | [mini-reports.png](screenshots/mini-reports.png) — 真实已发布报告列表；字段展开另有学习 UI 回归。 |
| 请假与调班记录 | 真实 API · H5 | /pages/edu/learning-list?type=requests | [mini-request-history.png](screenshots/mini-request-history.png) — 真实申请状态及教务处理理由。 |
| 调班申请 | 真实 API · H5 | /pages/edu/requests | [mini-requests.png](screenshots/mini-requests.png) — 从有效报名进入，显示相容班期与原因表单。 |
| 老师反馈 | 真实 API · H5 | /pages/edu/learning-list?type=reviews | [mini-reviews.png](screenshots/mini-reviews.png) — 真实已发布点评列表或其空状态。 |
| 课前准备与课堂信息 | 真实 API · H5 | /pages/edu/session | [mini-session.png](screenshots/mini-session.png) — 报名权益下的课次详情、入会信息与请假入口。 |
| 体验预约 | 真实 API · H5 | /pages/edu/trials | [mini-trials.png](screenshots/mini-trials.png) — 体验预约状态与班期信息 |
| 作业附件 · 单项失败 | 浏览器故障注入 | /pages/edu/assignment | [mini-upload-partial-failure.png](screenshots/mini-upload-partial-failure.png) — 浏览器只中断第二个文件一次；第一项使用真实上传 API。验证失败项提示、保留成功项与提交禁用。 |
| 作业附件 · 单项重试 | 浏览器故障注入 | /pages/edu/assignment | [mini-upload-retried.png](screenshots/mini-upload-retried.png) — 承接第二文件单次浏览器中断，失败项重试走真实上传 API；两项均已就绪，旧失败提示已清除，文字和首项保留。尚未正式提交作业；不代表微信真机网络恢复测试。 |
| 孩子作品集 | 真实 API · H5 | /pages/edu/works | [mini-works.png](screenshots/mini-works.png) — 当前孩子作品与版本授权状态。 |
| 课程决策 · 首页三条路径 | 真实 API · H5 | /pages/tab/home | [benchmark-home-paths.png](screenshots/benchmark-home-paths.png) — 匿名首页的体验、系统班课和一对一入口区域；真实本地课程服务，截图保留 TEST 环境。 本图为浏览器内容区截图，采集时临时增大视口高度避开固定导航遮挡，未隐藏 UI 或改变业务响应；不是固定手机视口或真机截图。 |
| 课程决策 · 正式班筛选 | 真实 API · H5 | /pages/tab/courses | [benchmark-selected-courses.png](screenshots/benchmark-selected-courses.png) — 匿名查询实际 TEST 课程 28，正式班条件与搜索词保留；价格口径为正式班期起价。 |
| 课程决策 · 正式班详情价格 | 真实 API · H5 | /pages/edu/course?id=28&kind=REGULAR | [benchmark-regular-detail.png](screenshots/benchmark-regular-detail.png) — 匿名从正式班列表进入同一课程详情，筛选后的班期 62 起价为 ¥99；没有被该课程免费体验价覆盖。金额仅为 TEST 验收数据。 |
| 课程决策 · 体验与正式班分组 | 真实 API · H5 | /pages/edu/course?id=28&kind=REGULAR | [benchmark-cohort-choices.png](screenshots/benchmark-cohort-choices.png) — 匿名用户显式查看本课程全部班期后，正式班和体验班分组展示老师、课次、北京时间、地点、名额及每位孩子总价；返回列表仍保留原筛选。 本图为浏览器内容区截图，采集时临时增大视口高度避开固定导航遮挡，未隐藏 UI 或改变业务响应；不是固定手机视口或真机截图。 |
| 课程决策 · 真实零结果恢复 | 真实 API · H5 | /pages/tab/courses | [benchmark-filter-recovery.png](screenshots/benchmark-filter-recovery.png) — 匿名真实查询返回零条，逐项移除正式班条件后仍保留搜索词；完整页面区域可见空态说明和恢复入口。没有伪造空结果响应。 本图为浏览器内容区截图，采集时临时增大视口高度避开固定导航遮挡，未隐藏 UI 或改变业务响应；不是固定手机视口或真机截图。 |
| 课程决策 · 登录后继续班期 | 真实 API · H5 | /pages/edu/login?returnTo=%2Fpages%2Fedu%2Fcohort%3Fid%3D62 | [benchmark-login-continuation.png](screenshots/benchmark-login-continuation.png) — 匿名打开原会员密码登录表单，登录页刷新后仍保留目标班期。截图采集于填写手机号和密码之前，不含凭据；本轮没有发送短信。 |
| 课程决策 · 当前孩子与班期确认 | 真实 API · H5 | /pages/edu/cohort?id=62 | [benchmark-cohort-confirmation.png](screenshots/benchmark-cohort-confirmation.png) — 原会员密码登录后显示真实本地孩子、TEST 老师、¥99 班期总价和北京时间课表。此图是孩子查询恢复后的正常状态；另有单次孩子 GET 中断及真实孩子切换撤销勾选的流程验证，未预约、下单或付款。 |
<!-- EVIDENCE_MATRIX_END -->

后台初次真实 API 检查的 15 页还保留在 output/playwright/live-admin-*.png，早期前端拦截夹具在 apps/admin/output/playwright。只有移入本画廊并标明来源的文件才计入上述截图矩阵；早期夹具不能改标为真实 API。

## 明确未完成的设备与性能验收

| 尚未覆盖项 | 当前状态 |
| --- | --- |
| 微信开发者工具导入、审核与真实 AppID | 未完成；mp-weixin 编译通过仅是构建证据 |
| iOS / Android 微信真机 | 未完成；未声明刘海屏/横竖屏/大字号/键盘遮挡/后台恢复均通过 |
| 微信手机号授权、原微信登录授权分支 | 未用实际 AppID 与真实终端完成验收 |
| 原微信商户支付与真实退款回调 | 未完成；本地原支付测试通道不能替代实际商户联调 |
| 上传/下载合法域名、真机 openDocument/previewImage | 未完成；H5 的授权下载与文件字节验证已经通过 |
| 系统清理临时文件、杀进程后附件恢复、离线重连 | 未真机验证；浏览器单次 abort 和页面 reload 是不同场景 |
| 全站键盘、读屏、色彩对比度专项审计 | 未形成完整审计报告；已有部分焦点与语义状态实现 |
| 性能与容量 | 未运行可复现的 Lighthouse/Web Vitals、首屏、帧率、内存或业务负载基准；不把构建时长当作页面性能 |
| 生产部署与外部服务 | 需按 [运维文档](OPERATIONS.md) 和 [已知缺口](IMPLEMENTATION_GAPS.md) 完成最终配置与验收 |

## 刷新截图清单与画廊

先运行对应采集器，确认采集来源后再更新清单。[H5 批量截图](../tooling/browser-capture-miniapp.js) 通过原会员已登录的浏览器会话运行；[后台批量截图](../tooling/browser-capture-admin.js) 通过原管理员会话运行。调班等页面需要真实有效的报名/孩子参数。动态路由与异步数据必须等待目标响应与页面状态，不能仅靠变更 hash 后立即截图。

在仓库根目录运行下列 PowerShell，可重复扫描文件并同步本文件的矩阵。它保留已核实的标题/来源；新发现的文件一律标记“来源待核实”，不会仅凭文件名声称测试通过。补充来源时编辑 screenshots/index.html 中 evidence-manifest 的相应记录，再运行本段刷新。

~~~powershell
$evidenceRoot = (Get-Location).Path
$galleryPath = Join-Path $evidenceRoot 'docs/screenshots/index.html'
$matrixPath = Join-Path $evidenceRoot 'docs/DESIGN_AND_EVIDENCE.md'
$galleryText = [IO.File]::ReadAllText($galleryPath)
$pattern = '(?s)(<script id="evidence-manifest" type="application/json">).*?(</script>)'
$manifestMatch = [regex]::Match($galleryText, $pattern)
if (-not $manifestMatch.Success) { throw 'Gallery manifest marker missing' }
$oldRows = $manifestMatch.Value -replace '(?s)^<script[^>]*>|</script>$', ''
$known = @{}
foreach ($entry in ($oldRows | ConvertFrom-Json)) { $known[$entry.file] = $entry }
$rows = @(
  Get-ChildItem -LiteralPath (Join-Path $evidenceRoot 'docs/screenshots') -File |
    Where-Object { $_.Extension -in '.png', '.jpg', '.jpeg', '.webp' -or ($_.Extension -eq '.webm' -and $_.BaseName -like 'flow-*') } |
    Sort-Object Name | ForEach-Object {
      $file = $_
      $entry = $known[$file.Name]
      if (-not $entry) {
        $entry = [pscustomobject]@{
          file = $file.Name; title = $file.BaseName; route = '待登记'
          kind = 'pending'; note = '新发现文件，待核实来源与覆盖状态。'
          source = '待核实'
        }
      }
      $entry | Add-Member -Force NoteProperty modifiedAt $file.LastWriteTimeUtc.ToString('o')
      if ($file.Extension -eq '.png') {
        $bytes = [IO.File]::ReadAllBytes($file.FullName)
        $width = [BitConverter]::ToUInt32([byte[]]$bytes[19..16], 0)
        $height = [BitConverter]::ToUInt32([byte[]]$bytes[23..20], 0)
        $entry | Add-Member -Force NoteProperty imageWidth $width
        $entry | Add-Member -Force NoteProperty imageHeight $height
      }
      $entry
    }
)
$json = ConvertTo-Json -InputObject @($rows) -Depth 8
$replacement = '<script id="evidence-manifest" type="application/json">' + [Environment]::NewLine + $json + [Environment]::NewLine + '</script>'
$galleryText = ([regex]::new($pattern)).Replace($galleryText, [Text.RegularExpressions.MatchEvaluator]{ param($m) $replacement }, 1)
[IO.File]::WriteAllText($galleryPath, $galleryText, [Text.UTF8Encoding]::new($false))
$labels = @{ 'live-h5' = '真实 API · H5'; 'live-admin' = '真实 API · 后台'; fault = '浏览器故障注入'; history = '历史版本'; pending = '来源待核实' }
$lines = @('| 页面 / 状态 | 来源类别 | 路由 | 影像与观察 |', '| --- | --- | --- | --- |')
foreach ($entry in $rows) {
  $title = $entry.title.Replace('|', '\|')
  $route = $entry.route.Replace('|', '\|')
  $note = $entry.note.Replace('|', '\|')
  $label = $labels[$entry.kind]
  if (-not $label) { $label = '来源待核实' }
  $lines += "| $title | $label | $route | [$($entry.file)](screenshots/$($entry.file)) — $note |"
}
$matrixStart = '<!-- EVIDENCE_' + 'MATRIX_START -->'
$matrixEnd = '<!-- EVIDENCE_' + 'MATRIX_END -->'
$matrix = $matrixStart + [Environment]::NewLine + ($lines -join [Environment]::NewLine) + [Environment]::NewLine + $matrixEnd
$matrixText = [IO.File]::ReadAllText($matrixPath)
$matrixRegex = [regex]::new('(?s)' + [regex]::Escape($matrixStart) + '.*?' + [regex]::Escape($matrixEnd))
$matrixText = $matrixRegex.Replace($matrixText, [Text.RegularExpressions.MatchEvaluator]{ param($m) $matrix }, 1)
[IO.File]::WriteAllText($matrixPath, $matrixText, [Text.UTF8Encoding]::new($false))
Write-Output "Refreshed $($rows.Count) media records; newly discovered provenance remains pending."
~~~

若只分发 docs/screenshots 文件夹，图片画廊可以离线打开，但仓库外的报告、源码和构建日志链接不会随之复制。交付时保留仓库相对目录，或单独附上已脱敏的报告文件。
