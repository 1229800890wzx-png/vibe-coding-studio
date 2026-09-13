# 首期本地完整流程

更新：2026-09-13。范围：课程展示、咨询预约、课程发布和咨询跟进。不含在线支付、学习中心、直播与考试。

## 已完成

- 官网 http://127.0.0.1:4173/ ：橙色首页、阶段筛选与搜索、课程列表/详情、咨询表单，课程由后台读取；后台下架后不再展示。
- 管理端 http://127.0.0.1:4180/education/manage ：芋道 Vue 管理端及原有登录/权限；新增课程草稿、编辑、发布/下架、排序、咨询列表及内部跟进备注。
- 后端 http://127.0.0.1:48080 ：芋道 JDK17 版本，复用数据库连接、登录令牌、权限和限流。新增教育业务控制器及 service 在 yudao-module-infra 内，未启用商城/CRM/支付。没有将商城商品强行充当教学课程。
- 数据持久化在独立 MySQL 3308；Redis 6388。仅监听本机，不依赖 Docker，不触碰原有 MySQL80 数据。
- 预约成功提示以服务端落库为准；必填称呼/联系方式/同意联系，服务端校验长度与格式，同一 requestId 不重复写入，每 IP 每分钟最多 5 次提交。
- 匿名用户只能获取已发布课程、创建咨询，不能读取咨询、编辑课程或跟进；管理接口要求 education:manage 权限。

## 地址、账户与启动

管理账户 admin，随机密码保存在 C:/Users/xuehang/AppData/Local/CodexEducation/runtime/admin-account.json。不得复制进源码或提交版本库。默认管理员密码已修改，mock 登录关闭。

在教育工作区根目录，用 PowerShell 7 执行 ./start-education.ps1。它调用 start-education-data.ps1、start-education-backend.ps1，启动官网和管理端。启动脚本是本机运行配置，不是生产部署脚本。

后台源码位于 vendor/ruoyi-vue-pro-8e43004cf68a405cd3485f98f8a539b97ca6544a，锁定上游 commit 8e43004cf68a405cd3485f98f8a539b97ca6544a。管理端为本轮下载的 master 源码快照，位于 vendor/yudao-ui-admin-vue3-master。

重新构建后端：在后端目录 mvn.cmd -B -DskipTests package；替换运行进程前核实进程路径，仅停止本项目进程。前端构建 npm.cmd run build。管理端使用 education 环境，只监听 127.0.0.1:4180。

## 数据和备份

实际运行目录 C:/Users/xuehang/AppData/Local/CodexEducation/runtime，含 mysql、redis、数据库配置、管理员凭据及日志。数据库从上游 SQL 初始化，教育表为 edu_course / edu_inquiry。首次课程内容来自当前设计方案，可在后台修改，不是已经确认开班的信息。

工作区根目录 python backup-education.py 创建完整数据库备份至运行目录 backups/。恢复涉及覆盖数据库，应先停应用并另建空库核验备份，不要直接向现有数据库灌入未知 SQL。不得将含咨询联系方式的备份公开分享。

setup-education.py 为首次菜单和内容初始化；已有课程不重复覆盖。不要删除 database-initialized 标记来重跑上游导入，其 SQL 会重建表。

## 验证证据

- 芋道后端 Maven package 成功；前台 build 和 check 通过（checkJs=false，不能视为全部 JS 已做静态类型检查）。管理端 production build 通过，已排除本期未启用的 OA 页面，因为上游快照缺少其 constants 依赖。
- verify-education-api.py：15 项通过，覆盖匿名权限、草稿、发布/下架、必填同意、联系方式校验、重复提交、跟进持久化；测试课程和咨询已清理。
- scripts/verify-education.cjs：浏览器验证真实咨询提交成功、课程筛选/搜索/重置、弹窗、手机导航、375/768/1024/1440 无横向溢出及原页面路由。
- scripts/verify-admin.cjs：管理端页面、咨询详情及内部备注保存通过；随后从数据库确认备注存在，清理浏览器测试咨询。该脚本仅操作 browser-qa@example.invalid 测试记录，没有测试记录时跳过跟进写入。
- 管理页当前浏览器 0 错误、2 条上游 Vue Router next() 弃用警告；不是业务失败。
- 截图 output/playwright/education-admin-courses.png、education-admin-inquiries.png、education-home-desktop.png、education-home-mobile.png。含测试数据的截图只是验收证据。

## 当前限制

这是本机可运行版本，未部署公网。Redis 使用本机已有 Windows 5.0 开发实例；正式部署应使用受维护的 Redis/Linux 环境及 HTTPS。管理端当前通过 Vite preview 提供构建后的页面。

咨询列表展示最近 500 条；尚未做短信、邮件提醒或第三方 CRM 同步。课程封面先复用三种现有素材。机构联系方式、收费、真实师资与校区尚未提供，原有师资/作品示意仍需正式内容替换。不要将本轮结果描述成已经可以公开招生上线。
