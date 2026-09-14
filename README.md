# VIBE CODING · 少儿创造力实验室

官网、小程序现已接入同一套 Java 后端、MySQL 和 Redis。官网管理迁入统一后台的「官网管理」，保留课程介绍编辑、发布、咨询状态与备注。官网布局与素材保持原样；部署、验证和回退见 [后端统一交付说明](docs/UNIFIED_BACKEND.md)。

仓库同时包含基于芋道二次开发的教学小程序、管理后台和 Java 服务端。运行方式见 [开源底座](docs/FOUNDATION.md)，页面说明见 [小程序](docs/MINIAPP.md)；新增的独立 [一对一高级课](docs/ONE_TO_ONE.md) 支持选择老师、孩子和期望时间，提交申请后由原 CRM 工作台沟通确认。验收记录见 [验证目录](docs/verification/README.md)。以下说明对应保留的 React 官网。

本轮对照新东方官方公开页面完善了课程类型分流、筛选和详情价格一致性、选班信息以及登录继续流程，具体差异与截图见 [对照与优化](docs/BENCHMARK_OPTIMIZATION.md)。原生微信小程序页面仍待核实。

根据已确认的五张蓝白效果图完成的 React 网站。保留原首页两行主标题、白色书桌、银色平板和摆件；图片负责摄影与插画，文字、卡片、图标、流程、日历和交互由真实组件组成。

## 本地打开

需要 Node.js 22.12 或更新版本。本机已用 Node.js 24 验证。

```powershell
npm install
npm run dev
```

开发地址：`http://127.0.0.1:5173/`。

使用构建版本：

```powershell
npm run build
npm start
```

构建版地址：`http://127.0.0.1:4173/`。Windows 推荐双击 `start-site.cmd`：它会在后台启动服务，确认页面可访问后再打开浏览器；启动窗口关闭不影响网站，重复启动会复用现有服务。电脑重启后需再次双击启动。后台日志位于 `output/server/`。

`npm start` 仍以前台方式运行，关闭该命令窗口会停止服务。如果文字可见而图片显示“图片暂时未加载”，请先双击 `start-site.cmd` 恢复服务，再刷新页面。

## 页面

| 路径        | 内容                                                 |
| ----------- | ---------------------------------------------------- |
| `/`         | 首页、平板屏幕内五个自动轮播画面、创作方向、课程服务、导师 |
| `/courses`  | 教育理念、基础理论、现代编程、AI 基础与知识路径、FAQ |
| `/method`   | 五步教学过程、可操作的植物照护提醒实验、学习观察     |
| `/mentors`  | 三类导师角色、教学引导与学习陪伴                     |
| `/projects` | 七个创作示例、分类筛选和可操作案例详情               |

作品分类与详情保存在 URL 参数中，例如 `/projects?category=tool&project=notes`。直接打开和刷新内页均可用。

## 组件与内容

- `src/content.js`：课程服务、作品、导师角色与 FAQ 的统一内容源。
- `src/components.jsx`：导航、品牌文字、按钮、卡片、流程、FAQ、弹窗和体验意向表单。
- `src/demos.jsx`：固定桌面与平板、轮播、日历、提醒逻辑、游戏/故事/网站/AI 概念演示。
- `src/pages.jsx`：五页结构，遵循已确认效果图的区块顺序。
- `src/styles.css`：颜色、字体、边缘、间距与响应式规则。
- `public/art/`：网站使用的无损 WebP 素材；通过 SVG 视窗准确取景。原稿 PNG 与独立高清插画保存在 output 中；逐像素核对后压缩体积 27.8%。
- `output/blue-white-site/`：原始效果图、详细审查与精修规格。
- `output/playwright/`：实际网页截图、布局与交互检查报告。

普通卡片使用单层细描边；材质与反光集中在原平板。首页默认每 6.5 秒自动轮播，支持暂停、方向键与触摸切换；悬停、键盘焦点、页面隐藏或打开弹窗时暂停，手动选择后停止自动播放。减少动态效果设置会关闭自动播放。

## 已实现的示例

- Minecraft 模组工坊：添加与开关预设模组、导出教学配置 JSON；没有连接实际游戏。
- 午夜博物馆：两条故事分支、线索背包与路径回看，可返回起点。
- MONO 产品官网：原创虚拟耳机的材质说明、配色概念与设计规格。
- 拾页学习资料助手：原文定位、知识卡编辑/增删、Markdown 导出；使用固定示例资料，没有调用 AI。
- 花园守卫战：关卡美术与三种角色规则切换，不含完整战斗循环。
- 植物照护提醒：统一采用 2026 年 9 月 10 日的模拟情境；时间未到、时间已到、检查完成、输入为空均有对应反馈。只提醒观察植物，不控制自动浇水。
- 分类与问答：明确标注预设演示与核查练习，没有调用或冒充实时 AI。

## 体验预约与正式资料

预约读取统一后端的受理状态与联系授权，家长提交后写入原 CRM，只有后端成功接收才显示成功回执。同一内容重试不会重复创建线索；后台可查看并跟进。系统未配置有效机构接待负责人时暂停受理，网络失败可重试。回执意向单仍支持下载，浏览器内的旧意向草稿可继续清除。

上线前需补齐真实团队资料、课程安排/费用/年龄范围、正式联系方式与预约接收方式。导师和作品的示意说明已在界面保留。没有虚构人物履历、招生效果或业务响应时间。

## 验证

```powershell
npm run build
npm run check
```

浏览器回归使用 Playwright CLI；相关脚本位于 `scripts/verify-*.js`。先运行构建版服务器（npm run build 与 npm start），再执行，例如：

```powershell
npx --package @playwright/cli playwright-cli -s=vibe open http://127.0.0.1:4173 --browser chrome
npx --package @playwright/cli playwright-cli -s=vibe run-code --filename scripts/verify-interactions.js --raw
```

这些文件是传给 CLI 的函数表达式，末尾不要加入分号。详细验收记录见 `output/playwright/VERIFICATION.md`。

## GitHub 下载

仓库包含运行所需的源码与图片，安装依赖后可直接构建。已构建的 Windows 运行包在仓库 Releases 中下载，解压后运行 `start-site.cmd`（需 Node.js 22.12+，无需安装项目依赖）。

`output/` 是本地设计过程和截图目录，不随源码提交。相关设计生成/截图脚本需要本地原始素材，日常 `npm run build` 和 `npm run dev` 不依赖它们。

## 静态托管

官网构建输出是 `dist/`，课程内容和预约依赖统一 Java 后端。设置服务端 `VIBE_API_TARGET`（默认 `http://127.0.0.1:48080`）与固定机构租户，托管服务将普通页面路径回退到 `index.html`，保留静态资源 404，并将公开 API 转发到后端。`scripts/serve.mjs` 和 Vite 已配置公开代理，管理接口不通过官网代理。公网发布使用 HTTPS 与 `infra/templates/website.nginx.example.conf`，完整交付见 `docs/UNIFIED_BACKEND.md`。


