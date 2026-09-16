# 自托管字体资源

取得日期：2026-09-15。所有字体二进制来自 Google Fonts 官方 CSS 返回的 `fonts.gstatic.com`，未经修改；许可证与项目元信息来自 `google/fonts` 官方仓库。当前官网已通过 `src/design-system.css` 接入此目录的自托管字体，无需运行时访问外部字体服务。

## 直接使用

独立页面可通过网站根路径引入：

```html
<link rel="stylesheet" href="/fonts/font-faces.css">
```

```css
body {
  font-family: "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif;
  font-weight: 400;
  font-synthesis: none;
}
h1, h2, h3, .strong-label {
  font-weight: 600;
}
.art-english {
  font-family: "Cormorant Garamond", Georgia, serif;
  font-style: italic;
  font-weight: 500;
}
button, input, select, textarea { font: inherit; }
```

字体家族的 CSS 名称是 **`Noto Sans SC`** 和 **`Cormorant Garamond`**。本样式明确提供中文 normal 400、600 与英文字体 italic 500。请将标题设为600，而不是继续依赖旧版750；英文艺术字只用于英文短词或品牌引语，中文信息仍用中文家族。

## 文件与体积

| 字体/样式 | 文件数量 | 字节数 | 说明 |
| --- | ---: | ---: | --- |
| Noto Sans SC | 101 个 WOFF2 | 4,516,508 | 官方 unicode-range 分片；400和600共享同一组可变字体文件 |
| Cormorant Garamond Italic 500 | 5 个 WOFF2 | 78,740 | 拉丁及扩展等官方分片，不引入第三个字体家族 |
| 字体总计 | 106 个 WOFF2 | 4,595,248（约4.38MiB） | 小于12MB目标 |
| `font-faces.css` | 1 | 209,755 | 207条face规则，src已全部改为同目录相对路径 |

`google-fonts-original.css` 保留官方原始响应，仅作为来源证据，**不应在页面引入**。它包含原始远程URL；实际使用的 `font-faces.css` 不含远程字体URL、`@import` 或 `local()`，字体资源可离线读取。

## 已做的真实字体核验

- 所有106文件均检查 WOFF2 文件签名，逐文件 SHA-256 记入 [sources.json](sources.json)。CSS所有本地路径已核对存在。
- 用 fontTools 读取实际 WOFF2 的 `fvar`、`OS/2`、`name` 与 `cmap` 表，结果见 [font-table-verification.json](font-table-verification.json)。
- 中文文件为可变字体，实际 `wght` 轴范围100–900，包含真实400与600实例。其内部默认名称含 `Thin`、默认 `OS/2` 权重为100，这是变量字体默认实例元数据，**不表示 CSS 400/600 被伪造成细体**。浏览器应根据face声明选择400或600轴值。
- Cormorant文件的实际 `OS/2` 字重为500，内部样式为Italic，具有真实斜体轮廓；不是对正常字体加倾斜变换。
- 下载没有使用 `text=` 参数，没有裁剪成某一段网页文案。保留官方响应中的全部 unicode-range 分片，中文文件合并 `cmap` 含13,635个码点，已核对“基础理论编程人工智能课程孩子创造力测验数据模型数学微信你好，世界！0123456789 AI Coding”均覆盖。
- 13,635不是所有Unicode汉字；罕见姓名、扩展区汉字等可能回退系统字体。正文仍须保留中文系统fallback。字体范围由官方接口决定，不能宣称全汉字无回退。

## 加载策略

`font-display:swap` 与原始 `unicode-range` 保留。浏览器只请求当前页面文字实际用到的分片，不是首屏必须加载4.38MiB。确切请求数与流量取决于页面文案、缓存及字重使用，应由具体预览页网络记录验证；本文件不虚报页面实测字节数。

同一中文分片在400与600的face规则中引用同一URL，可以共享资源缓存。不建议把101片全preload；最多在已有请求数据后挑必要小片预载，或先不预载。当前字体CSS未压缩，正式集成可通过正常CSS构建压缩，不改字体二进制。

使用HTTP服务预览时建议字体资源正确提供 `font/woff2` 类型；同源引用不需要额外外域请求。加载期间会先用中文系统fallback显示，因此正式验收仍要观察字体替换后的换行与布局，不把`document.fonts.ready`等同于所有设备表现一致。

## 官方来源与许可

- [Google Fonts — Noto Sans SC](https://fonts.google.com/noto/specimen/Noto+Sans+SC)
- [Google Fonts — Cormorant Garamond](https://fonts.google.com/specimen/Cormorant+Garamond)
- [官方请求参数记录](google-fonts-request.json)、[原始CSS](google-fonts-original.css)、[逐文件来源与哈希](sources.json)
- [Noto Sans SC 官方项目](https://github.com/google/fonts/tree/main/ofl/notosanssc)，本地 [OFL许可证](LICENSE-Noto-Sans-SC.txt)、[METADATA.pb](notosanssc-METADATA.pb)
- [Cormorant Garamond 官方项目](https://github.com/google/fonts/tree/main/ofl/cormorantgaramond)，本地 [OFL许可证](LICENSE-Cormorant-Garamond.txt)、[METADATA.pb](cormorantgaramond-METADATA.pb)

两套字体均附原始 SIL Open Font License 1.1 文件，包含版权与许可条款。分发时一并保留这些文件。此任务只改了CSS资源路径，没有改字体轮廓或重新命名字体内部家族。

下载与校验脚本：[download-fonts.cjs](download-fonts.cjs)。它从保存的官方CSS下载完整资源集；重新生成前如需更新版本，应先保存新的官方CSS与请求记录，避免把时间不同的版本混合。
