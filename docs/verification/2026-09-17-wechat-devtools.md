# 微信开发者工具验收

日期：2026-09-17。在 Windows 微信开发者工具 Stable `2.02.2608070` 中运行真实微信小程序产物，基础库 `3.17.2`，模拟设备 iPhone 12/13 (Pro)，390×844。使用官方 `miniprogram-automator@0.12.1` 操作模拟器；此记录不等同于微信真机或生产验收。

## 发现和修复

uni-app 构建通过后，微信模拟器仍因 WXSS 编译错误白屏。用开发者工具自带 `wcsc.exe` 复现：全局 `.stack > * + *`、状态组件 `.state > * + *` 中的通配选择器，以及班期详情 `.detail-row > :last-child` 的隐式通配选择器不被接受。

- 列表和状态组件改用纵向 flex 间距；班期详情使用显式 `.detail-value` 类。
- 减少动画样式按平台处理：H5 保留通配规则，小程序列出原生节点类型。
- 增加 `apps/miniapp/tooling/verify-wxss.mjs`，使用微信官方编译器检查全部构建 WXSS，而不是只检查 uni-app 构建退出码。修复前失败，修复后 61 份 WXSS 全部通过。

复现命令（在 `apps/miniapp` 目录；将路径替换为实际安装目录）：

```powershell
npm.cmd run build:mp-weixin
$env:WCSC_PATH='C:/Program Files (x86)/Tencent/微信web开发者工具/resources/app.asar.unpacked/node_modules/wcc-exec/wcsc.exe'
npm.cmd run verify:wxss
```

## 本地验收结果

- 首页在微信原生模拟器显示正常；选课页从本地统一后端加载 7 门已发布课程。
- 使用小程序密码登录表单输入本地演示账号并勾选协议，真实会员登录成功；未模拟登录响应。
- 家长中心正确显示小禾（演示）、学习课程、待上课次、老师反馈和通知数。
- 将本地 access token 设为无效测试值，保留 refresh token 后切入家长中心：真实自动续期成功，孩子和反馈继续展示。
- 课程详情显示创意启蒙（演示）的 12 次课大纲；点击班期按钮进入秋季周末班，课表、老师、价格、库存和课程规则正常。
- 未同意班期规则时，加入选课操作显示明确错误；触发原生 checkbox-group change 事件同意后，课程进入真实选课袋并绑定小禾。SDK 的 checkbox tap 本身不触发原生选中默认行为，因此该步骤明确使用 change 事件。
- 从选课袋点击“确认课程”，真实后端报价显示新加入的 1500 元课程和既有测试课程 100 元，共 1600 元，两项分别保留孩子归属。未同意确认页协议时提交按钮禁用；本轮没有提交订单、发起支付或退款。
- 从家长中心点击成长报告入口，可读取并展开本地阶段成长报告，显示优势和下一步建议。孩子档案、课表、既有订单记录均可读取。
- 首页和家长中心连续切换 3 轮，孩子数据保持显示；该轮自动化捕获的运行时 exception 为 0。
- 18 项既有小程序测试通过；最终微信小程序和 H5 构建通过。

截图位于忽略目录 `output/playwright/wechat-home.png`、`wechat-parent.png`、`wechat-checkout.png`、`wechat-report.png`，不提交私有登录态或测试账号密码。

## 配置和范围

开发者工具服务端口由用户开启；使用用户在工具中配置的 AppID，未写入源码 manifest。验收只连接本机 `http://127.0.0.1:48080`；本地项目 `project.private.config.json` 设置 `urlCheck: false`，允许模拟器请求 localhost，该文件和构建目录均不提交。源码中的正式域名校验仍为 true。

重新构建可能覆盖导入目录中的 AppID/私有设置，验收前需保留本机配置。正式发布必须配置实际 AppID、HTTPS 合法域名和生产后端，不能沿用 localhost 调试设置。

尚未验收微信真机、微信手机号授权、真实短信注册、真实支付及退款、上传发布与平台审核。原生模拟器通过不代表这些外部能力已开通。
