# 课程图片替换

2026-09-14：用六组原创课程创作图替换耳机及失效的演示占位图。图片采用自然光、写实电脑和可理解的软件项目画面，统一橙色点缀与克制的工作桌场景。它们是 AI 生成的课程示意，页面明确标注“创作示意”，不作为真实课堂或学员成果证明。

| 课程方向 | 新封面 |
| --- | --- |
| 实用工具 | [学习计划与习惯记录工具](../apps/miniapp/static/edu/courses/tools.jpg) |
| 创意小游戏 | [关卡、角色和规则](../apps/miniapp/static/edu/courses/game.jpg) |
| 互动故事 | [分支故事与场景草图](../apps/miniapp/static/edu/courses/story.jpg) |
| 个人网站 | [主题作品集与页面设计](../apps/miniapp/static/edu/courses/web.jpg) |
| AI 应用 | [植物识别的输入、候选结果和检查](../apps/miniapp/static/edu/courses/ai.jpg) |
| 综合产品项目 | [活动日程应用与产品流程](../apps/miniapp/static/edu/courses/product.jpg) |

使用内置 `image_gen` 制作；[完整提示词、尺寸与文件哈希](../content/course-image-manifest.json)随源码提供。交付 JPG 保留生成图的 1672×941 像素和完整构图，仅进行格式压缩。原始 PNG 保留于生成工具目录，本次工作副本位于忽略的 `.runtime/course-art-source`；重复编码可运行 `pwsh -File tooling/bootstrap/package-course-art.ps1`。

首页、选课和课程详情共享 [封面解析器](../apps/miniapp/edu/course-cover.js)。只替换空封面、精确匹配的旧本地占位路径和加载失败的图片；正常的自定义封面优先使用。已发布课程版本、孩子、订单、价格和课程文字均保持原数据。测试创建脚本也改为引用新资产，避免下次验收重新写入耳机 URL。

卡片和详情使用 16:9 框架完整展示作品，避免原来的固定高度裁切掉屏幕。标签采用清晰的浅底文字。若自定义图片失败，尝试对应课程示意；示意也失败时停止重试并显示原图形状态。

本次实际页面证据见 [图片验收报告](verification/course-image-ui-report.json)，六组素材与编译输出的哈希一致性和体积见 [图片打包报告](verification/course-image-package-report.json)。H5 与微信小程序均重新构建成功；后者原始主包为 1,983,205 字节，仍需在微信开发者工具完成实际上传校验。截图只反映本地 TEST 课程的图片替换；教学内容尚未被包装为正式在售资料。
