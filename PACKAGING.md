# 网站打包

打包环境为 Windows，需 Node.js ≥ 22.12 和 Windows PowerShell。脚本只打包现有构建，不会安装依赖、构建网站或启动服务。

确认代码集成完成并已构建后运行：

```powershell
npm run build
node scripts/package-release.mjs
```

ZIP 和唯一的暂存目录保存在 `output/releases/`，名称包含北京时间日期。旧包不会被覆盖，暂存目录不会被删除。成功时标准输出只返回 JSON：`staging` 是本次暂存目录，`zip` 是 ZIP 文件，`path` 是可直接测试的网站根目录，`bytes` 是压缩包大小。

压缩包只有一个根文件夹 `vibe-coding-site`，包含已构建的 `dist`（排除 `dist/design-review`）、`src`、`public`、包与 TypeScript 配置、根 `index.html`、README、Windows 启动脚本和两份服务器脚本。不包含 `node_modules`、评审素材、日志和整个工作区。

包内 `START-HERE.md` 提供启动说明：完整解压，安装 Node.js ≥ 22.12，双击 `start-site.cmd` 即可查看网站；已带 `dist`，无需 `npm install`。只有开发源码时才需要 `npm ci` 与 `npm run dev`。

交付前应从 ZIP 解压到另一个目录，用独立端口验证，而不复用正在运行的旧版本。例如在解压后的根目录打开 PowerShell：

```powershell
$env:PORT = "4273"
.\start-site.cmd
```

检查首页、作品详情深链刷新及图片加载。默认服务只监听本机；公网部署请遵循 README 中的静态托管说明。
