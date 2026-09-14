# 本地运行指引

> 历史端口、PID、个人工作目录和 `platform/start-education*.ps1` 已失效。当前运行入口如下。

## 官网

```powershell
npm.cmd ci
npm.cmd run dev
```

构建版使用 `npm.cmd run build` 后执行 `npm.cmd start`。公开 API 目标由 `VIBE_API_TARGET` 配置。

## 管理后台

```powershell
npm.cmd --prefix apps/admin install
npm.cmd --prefix apps/admin run dev-server
```

## 少儿端 H5

```powershell
npm.cmd --prefix apps/miniapp install
npm.cmd --prefix apps/miniapp run dev:h5
```

## Java 后端与数据

服务端位于 `apps/server`，启动 `yudao-server` 前必须提供私有数据库、Redis、租户和第三方服务配置。不要把示例密钥用于真实环境，不要启动旧 `platform` 服务。

完整构建、迁移、官网代理、生产发布和回退步骤见 [UNIFIED_BACKEND.md](UNIFIED_BACKEND.md) 与 `infra/migration/README.md`。停止本地进程前必须核对命令行与工作目录，不能按历史 PID 或仅按端口结束进程。
