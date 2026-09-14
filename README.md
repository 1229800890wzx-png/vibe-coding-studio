# VIBE CODING · 少儿创造力实验室

这是朋友 PR #1 的橙色少儿教育官网，现已接入统一 Java 后端、管理后台、少儿端和业务数据库。官网保留原有橙色首页与互动内容，并从后台读取已发布课程。

## 官网体验

- `/`：橙色首页、课程方向筛选与搜索、教学方法、互动作品和咨询入口。
- `/courses`：后台已发布课程列表。
- `/courses/:id`：课程介绍与内容大纲；下架或不存在的课程不会显示详情。
- `/method`、`/mentors`、`/projects`：朋友版本保留的教学方法、导师和作品页面。

课程卡片由统一后台“教育管理 → 官网管理”创建、编辑、发布和撤下。咨询表单读取统一后端的授权与受理状态；后端成功回执后才显示提交成功，线索进入原 CRM，顾问可在官网管理或招生工作台查看状态和备注。同一请求重试不会重复创建线索。

## 本地开发

需要 Node.js 22.12 或更新版本。Windows 推荐使用 `npm.cmd`：

```powershell
npm.cmd ci
npm.cmd run dev
```

官网开发地址默认 `http://127.0.0.1:5173/`。生产构建与检查：

```powershell
npm.cmd run check
npm.cmd run build
npm.cmd start
```

构建版默认监听 `http://127.0.0.1:4173/`。`scripts/serve.mjs` 通过公开 allowlist 将课程与咨询 API 转发到 `VIBE_API_TARGET`，不会转发管理接口。

## 统一应用

- `apps/server`：Spring Boot 服务端，包含原会员、课程、交易、支付、CRM 和官网适配。
- `apps/admin`：Vue 管理后台；开发命令为 `npm.cmd --prefix apps/admin run dev-server`。
- `apps/miniapp`：少儿端 H5 / 微信小程序；开发命令为 `npm.cmd --prefix apps/miniapp run dev:h5`。
- `infra/migration`：生产数据库基线和前向迁移。

服务端启动前必须提供私有数据库、Redis、租户、密钥和回调配置。完整命令、部署边界、内容导入与回退见 [统一后端说明](docs/UNIFIED_BACKEND.md)。

`infra/website-content.json` 是三个课程方向的默认导入清单。导入工具默认只预览；应用时也只创建缺失 slug，不覆盖任何已有草稿或运营内容。旧独立教育栈已经退役，迁移背景与上游来源见 [platform/README.md](platform/README.md)。
