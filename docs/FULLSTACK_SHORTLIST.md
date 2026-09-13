# 高 Star 完整平台复用调研

核验：2026-09-13。用户最新要求：不限教育行业，优先高 Star，复用完整用户交互、后端、数据库和管理端，尽可能只改前端外观。官网与在线课程均可考虑。

## 结论

优先验证 **芋道 ruoyi-vue-pro 完整版商城组合**，以 **Bagisto** 为完整桌面网站与主题改造备选，**mall** 为高 Star Java 电商对照。若保留 React 很重要，再比较 **Medusa + 官方 Next.js 前台**。

这里的芋道是包含商城、会员、支付、CRM 的完整版，不是普通若依权限框架。此前 Strapi + 自建业务前端的建议不再为首选，因为会留下较多业务开发。

没有证据可以承诺任一候选只改 CSS 就满足全部需求。账户、订单、管理端可以复用；PC 教育官网布局、咨询接收、在线学习要分别核查。直播、考试、课时管理还不是确认的必需功能。

## 高 Star 候选比较

Star 是本次 GitHub API 返回的主仓库数，不跨仓库相加，也不等于生产成熟度。

| 项目 | Star | 已有组成 | 对我们的主要缺口 | 判断 |
| --- | ---: | --- | --- | --- |
| [芋道](https://github.com/YunaiV/ruoyi-vue-pro) | 39,235 | Java 后端、SQL、Vue 管理端、uni-app 商城；会员、支付、营销、CRM | PC 官网布局、预约接 CRM、课程特有字段 | 国内业务第一顺位 |
| [mall](https://github.com/macrozheng/mall) | 84,755 | Java 后端、SQL、管理端、用户商城；商品、购物车、订单 | 前端偏演示；支付生产链路、PC 布局需验证 | 高 Star Java 对照 |
| [Bagisto](https://github.com/bagisto/bagisto) | 28,112 | Laravel、数据库迁移、Shop/Admin/CMS、会员和交易 | 中文及国内支付；教学进度不属于商城原生能力 | 桌面主题备选 |
| [Medusa](https://github.com/medusajs/medusa) | 36,273 | 商业后端、管理台、迁移、独立 Next.js 前台 | 国内支付、分离部署、课程权益适配 | React 路线备选 |
| [Saleor](https://github.com/saleor/saleor) | 23,323 | GraphQL 商业后端，配套管理台与 storefront 分仓 | 本轮未深入核验配套交付和整合成本 | 次级候选 |
| [NocoBase](https://github.com/nocobase/nocobase) | 24,182 | 数据建模和内部业务后台 | 不能据此认定已有消费者官网完整流程 | 后台工具备选 |

前三项已检查源码树和关键文件；Medusa 检查了源码树、官方前台及许可；Saleor/NocoBase 仅做元数据与定位筛选。未部署上述候选，也没有运行真实支付。

## 1. 芋道：国内业务优先

完整组合为 [后端](https://github.com/YunaiV/ruoyi-vue-pro)、[管理端](https://github.com/yudaocode/yudao-ui-admin-vue3)、[用户商城](https://github.com/yudaocode/yudao-mall-uniapp)。后两者本次分别为 3,826 和 1,351 Star。主仓库存在 mall/member/pay/crm 模块及 [MySQL 初始化脚本](https://github.com/YunaiV/ruoyi-vue-pro/blob/master/sql/mysql/ruoyi-vue-pro.sql)，官方说明了三个工程的配套关系。[部署说明](https://doc.iocoder.cn/mall/build/)

已实际核对前端 [order.js](https://github.com/yudaocode/yudao-mall-uniapp/blob/master/sheep/api/trade/order.js)与后端 [AppTradeOrderController](https://github.com/YunaiV/ruoyi-vue-pro/blob/master/yudao-module-mall/yudao-module-trade/src/main/java/cn/iocoder/yudao/module/trade/controller/app/order/AppTradeOrderController.java)：结算、建单、详情接口对应；建单调用 TradeOrderUpdateService，返回订单和支付订单 ID；另有支付状态更新入口。这证明存在业务接口调用，不只是页面跳转。验签、重试与权限仍需运行验证。

可以保留账户、分类、价格、订单、营销、支付模块、后台角色及 CRM 现有模型。将课程映射商品前，要核对配送和履约规则；仅改名称不能自动形成课程权益。咨询表单接 CRM 需要字段映射、接口与权限验证，不是纯 CSS。

用户端偏移动商城，因此新东方式 PC 官网需要布局改造；视频授权、章节进度、考试不能默认已有。README 的 master 为 JDK 8 / Spring Boot 2.7，另有 master-jdk17/master-jdk25；本轮订单核验基于 master。试运行优先评估 JDK 17/21 分支并锁定前后台兼容版本。主项目 MIT。[版本说明](https://github.com/YunaiV/ruoyi-vue-pro/blob/master/README.md)

## 2. mall：高关注度，但要区分演示和生产

当前 master README 标示 Spring Boot 3.5 / JDK 17。有 mall-admin、mall-portal、mall-search、[mall.sql](https://github.com/macrozheng/mall/blob/master/document/sql/mall.sql)和 Docker Compose。涉及数据库、Redis、搜索、消息等服务，应按模块配置。

配套 [mall-admin-web](https://github.com/macrozheng/mall-admin-web) 为 12,622 Star，[mall-app-web](https://github.com/macrozheng/mall-app-web) 为 1,082 Star。已核对 [前端订单 API](https://github.com/macrozheng/mall-app-web/blob/master/src/apis/order.ts)与后端 [订单控制器](https://github.com/macrozheng/mall/blob/master/mall-portal/src/main/java/com/macro/mall/portal/controller/OmsPortalOrderController.java)：确认单、建单、订单列表与取消请求对应。

前端还存在 paySuccess 调用；不能凭命名认定可信支付已打通，采用前须验证网关结果和订单状态约束。官方明确前端偏演示，商城偏手机体验，因此不能由 8.5 万 Star 推断最少改造。[官方前端说明](https://www.macrozheng.com/mall/start/mall_deploy_web.html)

商品、订单和会员可复用；PC 官网、咨询与课程权益需适配。主仓库 Apache-2.0，配套仓库按各自许可。当前不优先选微服务 mall-swarm，额外部署组件不直接满足官网目标。

## 3. Bagisto：完整商店与主题改造

源码树有 Shop、Admin、CMS、Customer、Checkout、Sales、Theme 及 migrations，存在 customers、orders、order_items、order_payment、order_transactions 建表文件。前台有结算模板和用户订单控制器，后台有销售订单控制器。结构完整，但本轮未运行结算与数据库。

当前 2.4 分支要求 PHP >=8.3 <8.5、Laravel 12；正式试装需按稳定发行版重新核对。[composer.json](https://github.com/bagisto/bagisto/blob/2.4/composer.json)

适合保留商店模板、购物流程和后台，调整品牌及内容组织。不要为了统一 React 重写全部模板，反而降低复用率。官方支持虚拟及下载商品，购买后文件交付不等于视频学习进度。国内微信/支付宝本轮没有核实到可直接采用的第一方方案，需另查扩展质量。[官方能力](https://docs.bagisto.com/getting-started/introduction)、[下载商品](https://docs.bagisto.com/product-types/downloadable-product)

主项目 MIT，第三方主题和支付扩展不自动全部免费。

## 4. Medusa 与其他通用方案

Medusa 的 [官方 Next.js 前台](https://github.com/medusajs/nextjs-starter-medusa)为 2,791 Star，源码有账户、订单详情、下单完成页，并非只有 API。采用后仍要处理 Vite 到 Next.js 的迁移取舍、服务部署和国内支付；本轮未验证全部数据库启动和网关。

当前 [LICENSE](https://github.com/medusajs/medusa/blob/develop/LICENSE)规定企业版材料以外采用 MIT，企业材料另有许可，不能将整库写成无例外 MIT。

Saleor 与 NocoBase 暂不进入第一轮试装。前者配套工程尚未深入核验，后者主要解决内部业务后台，不能直接推导出访客网站完整流程。普通 RuoYi、Strapi 可作开发底座，但优先级低于已有用户前台的系统。

## 5. 教育与官网专项备选

| 项目 | 本轮源码证据 | 实际边界 |
| --- | --- | --- |
| [MeEdu](https://github.com/Qsnh/MeEdu) | API、React PC/H5、管理端、迁移、购课交付 | 中文网校匹配；旧环境和附加商用条件 |
| [WordPress + LearnPress](https://wordpress.org/plugins/learnpress/) | 模板、后台、结算代码、订单和学习建表 | 官网主题复用强；国内支付及部分扩展另配 |
| [PlayEdu](https://github.com/PlayEdu/PlayEdu) | Java API、React 前后台、内嵌迁移 SQL | 企业内训，不能默认已有对外商城 |
| [Frappe Learning](https://github.com/frappe/lms) | Python、Vue、DocType、报名与支付源码 | 教学能力；国内支付及本地化配套 |
| [领课](https://github.com/roncoo/roncoo-education) | 后端、独立门户/管理端、课程 API 对应 | SQL 和部署资料引向公众号，未取得完整数据库交付 |
| [EduSoho](https://github.com/EduSoho/EduSoho) | 课程、订单、教师模板及 API 文档 | 商用许可、版本功能与部署仍需核实 |

MeEdu 已追踪 PC 下单 → /api/v3/order → OrderController → 付款成功监听器 → DeliverService 插入 UserCourse；首页通过 viewBlock 获取轮播及课程模块，可以保留逻辑改布局。[交付服务](https://github.com/Qsnh/MeEdu/blob/main/xyz.meedu.api/app/Services/Member/Services/DeliverService.php)

其 Dockerfile 使用 PHP 7.4，该版本已停止官方支持；Compose 使用预制镜像而非本地 build，修改源码需重建。[Dockerfile](https://github.com/Qsnh/MeEdu/blob/main/Dockerfile)、[PHP 支持状态](https://www.php.net/eol.php)。[附加条款](https://github.com/Qsnh/MeEdu/blob/main/ADDITIONAL_TERMS.md)要求商用明确授权，自建售课有免费申请途径但有主体与域名条件。社区录播与商业直播/考试不能混算。

LearnPress 已核查 [建表配置](https://github.com/LearnPress/learnpress/blob/develop/config/table/tables-v4.php)、结算和订单源码，实际有订单项、章节与学习状态。通过 [主题模板覆盖](https://learnpresslms.com/docs/learnpress-developer-documentation/architecture-core-concepts/template-system/)可改页面。WooCommerce 对接等属于扩展；WordPress 主仓库 Star 不能算作 LearnPress Star。

排除：[畅阳](https://github.com/ChangyangOpenSource/education-training-system)当前公开树主要为 uni-app，未找到 Java 工程和数据库；仅说明当前仓库不足以证明完整交付，不断言作者没有其他源码。

## 定制与验收边界

| 工作 | 处理 |
| --- | --- |
| 橙色、字体、按钮、卡片、间距 | 样式/主题修改 |
| 标题、图片、分类、价格、介绍 | 优先后台配置 |
| PC 导航、找课、师资和教学布局 | 复用组件与 API，修改页面结构 |
| 登录、支付、订单、角色 | 保留原逻辑，先验证再改显示 |
| 咨询进入后台/CRM | 复用实体，补接口或字段映射 |
| 视频权益、进度、课时核销 | 底座没有则需要业务开发或 LMS |
| 现有 React 作品演示 | 可独立保留，不能跨技术栈直接照搬全部 JSX |

视觉采用白色/暖灰底与橙色重点按钮，突出找课路径；不声称已取得滴滴官方色号。师资、校区、收费与成果使用真实信息。

下一阶段先验证芋道完整组合，Bagisto 作为桌面主题备选，不同时安装全部候选。验收：空库初始化 → 后台发布 → 前台查询 → 注册登录 → 建单并持久化 → 测试支付成功/失败/重复通知 → 后台管理与用户隔离 → 一页橙色 PC 官网回归。若确定在线学习，再测购课权限、进度和退款权益。预约必须真实进入后台，当前 localStorage 不算完成。

这些是后续验收条件，不是本轮已通过测试。本轮未部署候选、未产生真实交易、未修改当前网站样式。
