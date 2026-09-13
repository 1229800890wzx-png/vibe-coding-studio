# 本地运行

实测日期：2026-09-13。

## 当前服务

- 地址：http://127.0.0.1:4173/
- 工作目录：D:\OneDrive\文档\ChatGPT\教育\vibe-coding-studio
- 使用生产构建，Node.js 22.22.0，npm 10.9.4。
- 由 `node scripts/start-site.mjs` 启动为隐藏后台进程，仅监听本机。此次启动 PID 33340；PID 后续可能变化。
- 日志：output/server/preview.log 与 preview-error.log。
- 停止时先核对进程命令行确属本项目的 scripts/serve.mjs，再停止对应进程，不能仅凭历史 PID 结束进程。

## 重启与更新

电脑重启后双击 start-site.cmd；或在项目目录执行 `node scripts/start-site.mjs`。启动器会检测端口，已有本站服务则复用。

修改代码后运行 `npm.cmd run build` 再刷新页面。需要热更新时执行 `npm.cmd run dev`，以终端实际输出地址为准。

首次依赖安装使用 `npm.cmd ci --no-audit --no-fund`，保留原锁文件。

## 本次实测

- npm ci：成功，安装 33 个包。
- npm run build：成功，Vite 输出生产资源。
- npm run check：通过。checkJs 仍为 false，不代表全面 JS 类型验证。
- 五个页面路径及两张主要图片：HTTP 200，内容类型正常。
- Playwright 可见 Chrome 会话 vibe-preview：成功打开首页，页面标题、主导航、主标题、平板轮播和作品卡片已渲染。
- 本次是启动与冒烟验证，没有复跑全套历史交互 / 可访问性回归。

源码通过官方 codeload ZIP 获取，非 Git 克隆；原业务代码、样式和依赖声明未修改。新增 docs 与项目 AGENTS.md 记录本次启动、用户新方向和选型依据。
# 2026-09-13 橙色官网验证补充

> 以下为前端阶段历史。现已接通芋道后台，最新启动、端口、数据目录与验收见 FIRST_RELEASE.md；Docker 阻塞已通过独立本地数据库方案解决。

地址仍为 http://127.0.0.1:4173/ ，本轮已重建 dist。构建与 check 通过，浏览器复验入口：npx.cmd --yes --package @playwright/cli playwright-cli -s=vibe-preview run-code --filename=scripts/verify-education.cjs。

截图 output/playwright/education-home-desktop.png 与 education-home-mobile.png。后台暂未接入：Docker 服务启动被 Windows 拒绝，需要本机 Docker 引擎运行后继续；不使用现有 MySQL80 的未知数据库。
