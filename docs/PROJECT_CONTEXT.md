# 项目上下文

更新：2026-09-13。

## 当前执行状态（2026-09-13 完整接入）

以 docs/FIRST_RELEASE.md 为当前运行与验收依据。官网 4173、芋道管理端 4180、后端 48080、独立 MySQL 3308 和 Redis 6388 已运行。数据库在本机 AppData/Local/CodexEducation/runtime，不依赖 Docker；原有 MySQL80 未修改。

前台课程来自数据库，课程列表与详情可访问；咨询真实提交、去重、校验、后台读取与跟进均已验证。管理员密码已随机化，仅保存于运行目录 admin-account.json。后端复用芋道认证、权限和限流，在 infra 新增最小教育模块，未启动交易与 CRM。15 项 API 验证、浏览器真实提交和后台备注保存已通过，测试记录已清理，备份脚本已执行成功。

详见 FIRST_RELEASE.md 的启动、备份与限制；这是本机完整首期链路，不是已部署公网。真实课程资料、师资与机构内容仍待用户补充。

## 先前前端阶段记录（已被完整接入更新）

- 用户确认首期为课程展示 + 咨询预约，采用芋道完整方案；暂不做登录购课与学习中心。
- 已新增 src/education-home.jsx 与 education.css，首页改为橙色教育官网，含课程阶段筛选、搜索、教学方法、互动作品和咨询入口。保留现有 React 页面与作品，尚未接入芋道 API。
- 芋道 JDK17 源码锁定 commit 8e43004cf68a405cd3485f98f8a539b97ca6544a，已从官方 codeload 下载到上级 vendor/ruoyi-vue-pro-8e43004cf68a405cd3485f98f8a539b97ca6544a。源码未编译启动，管理端尚未下载。
- 实际阻塞：Docker Linux 引擎不存在，com.docker.service 停止；提升执行后 Start-Service 仍被 Windows 拒绝。已请用户手动启动 Docker Desktop。现有 MySQL80 在运行，但未连接或改动其数据库。
- 预约仍是带明确提示的本地预览，课程仍来自静态数据，不能宣称后台管理或真实接收已完成。
- 本轮 npm.cmd run build / check 通过。scripts/verify-education.cjs 使用 Playwright CLI 验证筛选、空态、重置、手机导航、弹窗/Escape、375/768/1024/1440 无溢出及四个原页面存在 h1，通过。checkJs=false，类型检查不等于完整 JS 静态校验。
- 下一步：Docker 就绪后启动独立 MySQL/Redis，核验芋道版本与编译，接课程数据和咨询后台；不要将静态改版称为完整平台完成。

## 定位与本次要求

- 原项目：VIBE CODING 少儿创造力实验室，React / Vite 五页官网与互动作品演示。
- 最新用户要求：先启动现有站点供查看；定位更像新东方教育官网；配色倾向滴滴橙色；调研开源后台，前端按自身需求定制。
- 橙色与教育官网定位是新方向，尚未修改界面；旧 IMPLEMENTATION.md 的蓝白设计要求为历史约束，不能阻止后续用户授权的改版。
- 后台尚未确定、安装或接入。调研结果见 PLATFORM_RESEARCH.md。
- 最新完整调研以 FULLSTACK_SHORTLIST.md 为准；PLATFORM_RESEARCH.md 保留早期背景。
- 最新选型要求：不限教育行业，优先高 Star，复用完整用户前台、业务后端、数据库和管理端；尽可能只改外观。2026-09-13 扩大核验后，优先验证芋道完整版商城组合，Bagisto 为桌面主题备选；尚未最终选定或部署。此前 Strapi + 自建业务前端不再为首选。

## 结构

- src/App.jsx：路由、预约弹窗状态、标题和滚动。
- src/pages.jsx：页面结构。
- src/content.js 与 showcase-content.js：静态业务与作品内容。
- src/components.jsx：通用组件、图片与本地预约意向。
- src/demos.jsx、tablet-showcase.jsx、game-experiences.jsx、product-experiences.jsx：互动展示。
- public/art：实际素材；scripts：预览服务器、启动器、验证脚本。

## 业务边界

预约仅 localStorage 保存与文件下载；没有发送到机构。真实教师、收费、年龄范围与正式接收渠道待补。作品演示不应描述为真实学生成果或实时 AI 服务。

## 获取与验证

Git HTTPS 克隆连接被重置，改用 GitHub 官方 codeload 的 master 源码 ZIP。该目录是源码快照，不是成功克隆的独立 Git 仓库。

启动与验证状态以本次 RUNBOOK.md 为准；仓库原文中的测试通过是历史记录。
