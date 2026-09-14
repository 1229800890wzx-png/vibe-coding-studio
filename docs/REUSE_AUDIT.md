# 完整系统复用核验记录

本轮案头与源码核验已完成，最新结论见 FULLSTACK_SHORTLIST.md。下面保留分轮记录，其中“待核验”是当时进展；当前未实测项以最新报告为准。

2026-09-13 用户澄清：需要更详细调研，官网和在线课程平台均可。最高优先级是复用现成后端、数据库、前端业务逻辑，尽可能只改前端样式；不是限定线下教培。

## 核验计划

状态：本轮四项已完成，范围已扩展为不限行业的高 Star 完整平台。候选部署与支付验证不在本次已完成范围。

1. 筛选完整产品，剔除仅有界面 / 框架 / 截图的项目。
2. 检查数据库初始化、后端业务与前端调用是否对应，核查部署与许可。
3. 对主候选列出可复用模块、配置工作和不可仅靠样式完成的缺口。
4. 更新 PLATFORM_RESEARCH.md，明确最终建议与尚未实测范围。

## 已取得证据

- MeEdu main：完整树 2383 项，根含 xyz.meedu.api / admin / pc / h5、compose.yml、Dockerfile、ADDITIONAL_TERMS.md。有 Laravel migration 及课程、登录、订单后端控制器。待核对调用链与当前依赖。
- PlayEdu main：完整树 1033 项，含 API、管理端、PC、H5、Compose 与数据库迁移实现。产品定位企业培训，交易与招生能力待核验。
- 领课 roncoo-education master：完整树 1115 项，有课程服务和网关，但前端独立仓库，主仓库未直接发现 SQL；需要顺着官方文档确认配套源码与初始化数据。
- 畅阳 education-training-system main：完整树 1208 项，当前根为 uni-app 小程序源码，未见 Java 工程与数据库脚本。README 的完整解决方案描述不能据此认定该仓库包含全栈。

以上是目录证据，尚不能表述为部署通过。源码从官方 GitHub 连接器读取，没有执行候选仓库代码。

## 第二轮核验

- MeEdu：composer.json 为 Laravel 8，Dockerfile 使用 PHP 7.4 与 Node 20 构建；PC 前端为 React 18 / Vite 4 / Ant Design 5。compose.yml 使用现成 light:4.9.32 镜像而非本地 build，修改源码需调整构建方式。数据库支持迁移 / seeder，Docker 启动会执行 meedu:upgrade。业务源码核验继续。
- PlayEdu：数据库建表 SQL 内嵌在 MigrationCheck.java；并非缺少 .sql 就没有数据库初始化。Compose 含应用和 MySQL，并本地构建。PC API 明确有详情、播放授权、学习时长、ping、附件下载。
- 领课：官方 README 给出独立门户与管理端仓库；SQL 和部署资料引导到公众号。当前公开仓库及文档还需确认完整可获取性。README 额外声明商用需咨询，不能只看 GitHub 的 AGPL 标签。
- 调研已根据用户澄清扩大到官网与在线课程；当前未决定最终推荐，不部署任何候选系统。

## 第三轮：调用链与实际缺口

- MeEdu PC 的 course.ts 调用课程详情、播放授权和观看记录接口；order.ts 调用 POST /api/v3/order。后端对应路由加登录中间件，OrderController 调用 OrderService 建单，付款成功监听器调用 DeliverService 交付课程权限。首页读取 viewBlock 的 pc-page-index 配置，支持轮播、课程块与代码块，适合保留逻辑做主题。
- MeEdu 官方 Dockerfile 的 PHP 7.4 已被 PHP 官方列为停止支持；Laravel 8 也是旧版本。是否有可用的受维护商业交付或升级成本，需要在承诺“只改样式”前解决。
- 领课门户与管理端仓库均实际存在，门户 api/course.js 和后端 ApiCourseController 的 search/view 路径对应。数据库完整交付仍未证实。
- Frappe Learning 有 Vue 前端、Python 后端 DocType 模型、课程与报名/支付源码；Docker 开发初始化显式安装 payments 与 lms 并创建 MariaDB 站点。其开发 Compose 不能直接当作生产部署配置。
- 新增 WordPress + LearnPress 作为“官网 + 学习系统 + 主题”路线：官方支持主题/区块定制，基础课程与学习逻辑现成；WooCommerce 对接等为付费扩展，中国支付不能认定默认可用。待核验插件的数据库与模板代码。
