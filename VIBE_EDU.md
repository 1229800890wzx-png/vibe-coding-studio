# VIBE CODING · 少儿创造力实验室

面向 8—16 岁家庭的课程报名与教学服务小程序。固定芋道开源版本进行二次开发，原会员、员工/RBAC、商城交易、支付退款、文件、通知和 CRM 继续提供基础能力；教育模块补充孩子、课程版本、班期、学习资格、排课、作业、作品授权。

原有 React 官网仍在仓库根目录，本工程新增三个应用，未用小程序覆盖官网。

## 查看交付

- [逐页截图、交互录屏与证据画廊](docs/screenshots/index.html)
- [设计规范与逐页验证范围](docs/DESIGN_AND_EVIDENCE.md)
- [架构、开源复用边界与 ERD](docs/ARCHITECTURE.md)
- [教育数据字典：28 表](docs/DATA_DICTIONARY.md)
- [接口契约](docs/API_CONTRACT.md)、[交易及退款适配](docs/TRADE_EDUCATION.md)
- [验证报告索引](docs/verification/README.md)
- [运行与恢复手册](docs/OPERATIONS.md)、[生产专用 Liquibase 迁移包](infra/migration/README.md)
- [课程草案：6 门 × 8 课及体验模板](content/curriculum-drafts.json)
- [批准的实施合同](docs/IMPLEMENTATION_PLAN.md)、[差距收口与外部发布条件](docs/IMPLEMENTATION_GAPS.md)

## 本地入口

| 应用 | 目录 | 开发地址 |
| --- | --- | --- |
| UniApp 小程序 / H5 | apps/miniapp | http://127.0.0.1:5174 |
| Vue 3 管理后台 | apps/admin | http://localhost:49090 |
| Java 21 服务端 | apps/server | http://127.0.0.1:48080 |
| 只读证据画廊 | docs | http://127.0.0.1:49100/screenshots/index.html |

完整空开发库安装顺序见 [FOUNDATION.md](docs/FOUNDATION.md)。需要 Java 21、Node 22+、MySQL 8.4 和 Redis；仓库提供便携工具及独立 Docker/WSL 启动脚本。已有库增量更新与新生产库迁移使用不同入口，不能混用。

本机已配置的开发账号：原后台用户名 `admin`；原会员手机号 `13900000001`。密码仅在本机忽略文件 `.runtime/foundation.env`，未写入源码、截图或交付报告。生产迁移不预置可用密码，也不插入测试会员或 mock 支付渠道。

在两个终端分别启动前端：

首次先在仓库根执行 `node tooling/bootstrap/init-frontend.mjs`。它从随源码提供的公开模板生成被忽略的前端环境文件，保留已有配置；无需依赖本机未交付的 `.env`。生产模板使用同源 `/admin-api`，部署时配置 HTTPS 反向代理及机构域名。

```powershell
cd apps/admin
pnpm install --frozen-lockfile
pnpm dev
```

```powershell
cd apps/miniapp
npm ci
npm run dev:h5
```

构建微信包：在 apps/miniapp 执行 `npm run build:mp-weixin`，产物在 `dist/build/mp-weixin`。管理端活动范围检查为 `pnpm ts:check:active`；`pnpm build:prod` 构建实际发布图。原上游未启用领域的源码仍保留，其全模块检查不作为本次部署范围的通过声明。

画廊可以直接打开 HTML，也可以在仓库根执行 `node tooling/serve-evidence.mjs`。这里的页面数据是明确标记的本地测试记录；课程草稿不会自动成为生产在售课程。

## 本地完成范围与正式发布

本地实现包含选课筛选、原账号登录、多孩子档案、体验预约、购物车及原优惠券/交易支付链路、部分退款与权益处理、课表、私有材料、作业版本和反馈、成长报告、请假转班、作品授权发布、站内消息、原 CRM 招生跟进及品牌配置。关键并发、权限、恢复行为已对真实本地 MySQL/Redis/API 验证，页面另有浏览器操作证据。

正式发布仍需机构提供并验收：微信 AppID/主体及类目、商户与证书、域名、COS 配置、真实课程价格/师资/班期/协议，以及 iPhone、Android 微信真机和真实小额支付退款。H5 录屏和微信构建成功不代替这些步骤。当前没有部署生产、提交微信审核或承诺已通过生产性能指标。

## 固定开源来源

| 来源 | 固定提交 | 本地目录 |
| --- | --- | --- |
| YunaiV/ruoyi-vue-pro | 8e43004cf68a405cd3485f98f8a539b97ca6544a | apps/server |
| yudaocode/yudao-ui-admin-vue3 | aab14fb0e74720dd09e964ae066f8bbde9f9012e | apps/admin |
| yudaocode/yudao-mall-uniapp | 3c4bf3864415054a88fe616a414e098972329412 | apps/miniapp |

各仓库根 MIT 原文及版权声明保留；[上游锁](upstream.lock.json)记录来源。第三方依赖单独见 [许可证清单](infra/templates/license-inventory.json)，不能将上游根 MIT 推断为所有依赖 MIT。数据库由固定公开 SQL/模型推导，未使用受限商城初始化附件。后续升级先在独立分支对照公开源变更，保留教育 SPI/原服务差异，再复跑交易、权限和迁移验收；已应用的 Liquibase 变更集不得重写。

[实际后端包依赖](infra/templates/backend-artifact-dependencies.json)另逐项列出 281 个内嵌 JAR 的版本和许可来源。收集覆盖已通过；7 项 GPL/LGPL 家族声明（含双许可和 MySQL FOSS 例外）及 2 项未能自动识别的许可证明确留有审阅标记，不将完整构建等同于全部许可证适用结论。
