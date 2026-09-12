const icon = (path, extra = '') => `<svg class="xp-icon ${extra}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
const arrow = icon('<path d="M5 12h14m-5-5 5 5-5 5"/>');
const book = icon('<path d="M12 5c-3-2-6-2-9-1v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-3-1-6-1-9 1Zm0 0v15"/>');
const download = icon('<path d="M12 3v12m-4-4 4 4 4-4M4 16v4h16v-4"/>');
const plus = icon('<path d="M12 5v14M5 12h14"/>');

export const productPreviews = {
  website: `<section class="xp-preview xp-website" data-xp-website aria-label="MONO 原创产品网站设计练习">
    <header class="xp-mono-nav"><span class="xp-mono-logo">MONO</span><span class="xp-mono-nav-label">SOUND, CONSIDERED.</span><span class="xp-mono-concept">原创产品概念</span></header>
    <div class="xp-mono-main">
      <div class="xp-mono-copy"><p class="xp-mono-eyebrow">MONO / 01 · HEADPHONES</p><h2 class="xp-mono-title">让声音，<br>更靠近。</h2><p class="xp-mono-description">少一点干扰。<br>多一点，与声音独处的空间。</p><button type="button" class="xp-mono-material" data-xp-material aria-expanded="false">探索材质 ${arrow}</button></div>
      <figure class="xp-mono-figure"><img class="xp-mono-photo" src="examples-headphones.png" alt="原创 MONO 雾银色头戴耳机的产品摄影质感概念图" loading="eager"><figcaption class="xp-mono-photo-note">雾银 / 外观概念图</figcaption></figure>
      <div class="xp-mono-material-panel" data-xp-material-panel hidden><span class="xp-mono-panel-kicker">MATERIAL STUDY</span><h3 class="xp-mono-panel-title">克制的金属。<br>温和的织物。</h3><p class="xp-mono-panel-text">铝合金外壳与编织耳垫的材质设想，让冷与暖在同一件物品上相遇。</p><span class="xp-mono-panel-footnote">材质与结构均为本次外观设计提案。</span><button class="xp-mono-panel-close" data-xp-close-material type="button" aria-label="关闭材质说明">×</button></div>
    </div>
    <div class="xp-mono-bottom"><div class="xp-mono-finishes"><span class="xp-mono-color-label" data-xp-color-label>雾银</span><div class="xp-mono-swatches" role="group" aria-label="选择配色概念"><button class="xp-mono-swatch xp-mono-swatch-silver" type="button" data-xp-color="silver" aria-label="雾银配色" aria-pressed="true"><span></span></button><button class="xp-mono-swatch xp-mono-swatch-carbon" type="button" data-xp-color="carbon" aria-label="炭黑配色概念" aria-pressed="false"><span></span></button><button class="xp-mono-swatch xp-mono-swatch-sand" type="button" data-xp-color="sand" aria-label="暖沙配色概念" aria-pressed="false"><span></span></button></div><span class="xp-mono-color-detail" data-xp-color-detail aria-live="polite">银灰金属 × 浅灰织物</span></div><details class="xp-mono-specs"><summary>设计规格 <span>+</span></summary><dl class="xp-mono-spec-list"><div><dt>产品形式</dt><dd>头戴式耳机外观概念</dd></div><div><dt>结构设计</dt><dd>环形耳罩、弧形头梁与金属支架</dd></div><div><dt>材质设想</dt><dd>铝合金外壳与编织织物</dd></div><div><dt>项目状态</dt><dd>网站与产品外观设计练习，非在售产品</dd></div></dl></details></div>
    <footer class="xp-mono-footer"><span>设计练习示例 · 非 Apple 官方网站或作品</span><span data-xp-photo-disclosure>当前产品图为雾银配色</span></footer>
  </section>`,
  tool: `<section class="xp-preview xp-tool" data-xp-tool aria-label="拾页学习资料助手，本地示例">
    <header class="xp-tool-header"><div class="xp-tool-brand"><span class="xp-tool-mark">${book}</span><span class="xp-tool-wordmark">拾页<span class="xp-tool-brand-divider">/</span><span class="xp-tool-brand-description">学习资料助手</span></span></div><span class="xp-tool-mode"><span class="xp-tool-status-dot"></span>示例资料 · 本地交互</span></header>
    <div class="xp-tool-toolbar"><div><p class="xp-tool-breadcrumb">我的学习空间 <span>/</span> 科学阅读</p><h2 class="xp-tool-document-name">一束光，怎样变成生长的力量？</h2></div><button type="button" class="xp-tool-export" data-xp-export>${download}<span>导出笔记</span></button></div>
    <div class="xp-tool-workspace">
      <article class="xp-source-pane"><div class="xp-pane-heading"><span>原始资料</span><span class="xp-pane-meta">3 段示例文字</span></div><div class="xp-source-scroll" data-xp-source-scroll><div class="xp-source-paper"><span class="xp-source-kicker">SCIENCE NOTES / 01</span><h3 class="xp-source-title">光合作用</h3><p class="xp-source-deck">读懂植物如何把光，变成生长所需的能量。</p><section class="xp-source-paragraph xp-source-active" data-xp-paragraph="1" tabindex="-1"><span class="xp-source-number">01</span><div><h4 class="xp-source-subtitle">能量从哪里来</h4><p class="xp-source-text">绿色植物通过光合作用，把光能转化为储存在有机物中的化学能。这个过程通常需要光、二氧化碳和水，并释放氧气。</p></div></section><section class="xp-source-paragraph" data-xp-paragraph="2" tabindex="-1"><span class="xp-source-number">02</span><div><h4 class="xp-source-subtitle">叶片里的微型工厂</h4><p class="xp-source-text">叶片中许多细胞含有叶绿体。叶绿体中的叶绿素能够吸收光，为光合作用提供能量。根吸收的水通过植物体输送到叶片，二氧化碳主要通过气孔进入叶片。</p></div></section><section class="xp-source-paragraph" data-xp-paragraph="3" tabindex="-1"><span class="xp-source-number">03</span><div><h4 class="xp-source-subtitle">光越强，长得越快吗</h4><p class="xp-source-text">光照强度、二氧化碳浓度和温度等条件会影响光合作用。在其他条件合适时，一定范围内增强光照能提高光合作用速率；但光越强并不意味着速率会一直上升。</p></div></section><p class="xp-source-footnote">供交互体验使用的固定示例资料</p></div></div></article>
      <aside class="xp-notes-pane"><div class="xp-pane-heading"><span>我的学习笔记</span><span class="xp-pane-meta">每个要点，都能找到出处</span></div><div class="xp-notes-scroll" data-xp-notes-scroll><div class="xp-summary-heading"><h3>先读懂这三件事</h3><span class="xp-summary-badge">示例摘要</span></div><ol class="xp-summary-list"><li><span class="xp-summary-index">1</span><div><p>植物利用光，把二氧化碳和水转化为有机物，并释放氧气。</p><button class="xp-source-link xp-source-link-active" type="button" data-xp-source="1" aria-pressed="true">来源 01 ${arrow}</button></div></li><li><span class="xp-summary-index">2</span><div><p>叶绿素吸收光；水和二氧化碳通过不同路径来到叶片。</p><button class="xp-source-link" type="button" data-xp-source="2" aria-pressed="false">来源 02 ${arrow}</button></div></li><li><span class="xp-summary-index">3</span><div><p>光合作用受多种条件影响，并不是光越强就越快。</p><button class="xp-source-link" type="button" data-xp-source="3" aria-pressed="false">来源 03 ${arrow}</button></div></li></ol><div class="xp-cards-heading"><h3>记成自己的话 <span data-xp-card-count>01</span></h3><button type="button" class="xp-add-card" data-xp-add-card>${plus} 新建知识卡</button></div><div class="xp-knowledge-cards" data-xp-knowledge-cards><div class="xp-knowledge-card" data-xp-card><label class="xp-card-question-label"><span>问题</span><input class="xp-card-question" data-xp-question aria-label="知识卡问题" value="为什么说光合作用是能量的转化？" maxlength="160"></label><label class="xp-card-answer-label"><span>我的理解</span><textarea class="xp-card-answer" data-xp-answer aria-label="知识卡答案" rows="2" maxlength="2000">因为植物把光能转化为储存在有机物中的化学能。</textarea></label><button class="xp-card-remove" data-xp-remove-card type="button" aria-label="删除这张知识卡">×</button></div></div></div><footer class="xp-notes-footer"><span class="xp-notes-live" data-xp-tool-live aria-live="polite">可以修改知识卡，写下自己的理解</span><span class="xp-notes-count" data-xp-note-total>1 张卡片</span></footer></aside>
    </div>
  </section>`
};

export const productStyles = String.raw`
.xp-preview{box-sizing:border-box;width:100%;min-width:0;isolation:isolate;font-family:"Segoe UI","Microsoft YaHei",sans-serif;-webkit-font-smoothing:antialiased}.xp-preview *,.xp-preview *:before,.xp-preview *:after{box-sizing:border-box}.xp-preview button,.xp-preview input,.xp-preview textarea{font:inherit}.xp-preview button{cursor:pointer}.xp-preview button:focus-visible,.xp-preview summary:focus-visible{outline:2px solid #81b2ff;outline-offset:4px}.xp-preview .xp-icon{width:18px;height:18px;flex:0 0 auto;vertical-align:middle}.xp-preview [hidden]{display:none!important}
.xp-website{color:#f1f0ee;background:#111212;position:relative;overflow:hidden;border-radius:18px;height:640px;display:flex;flex-direction:column;border:1px solid #343535}.xp-mono-nav{height:66px;padding:0 44px;display:flex;align-items:center;justify-content:space-between;flex:none;border-bottom:1px solid #ffffff12;position:relative;z-index:3}.xp-mono-logo{font-size:24px;letter-spacing:-1.7px;font-weight:650}.xp-mono-logo-dot{font-size:10px;vertical-align:top;margin-left:5px;letter-spacing:0;font-weight:400}.xp-mono-nav-label{font-size:9px;letter-spacing:2.8px;color:#777b7b;margin-left:auto;margin-right:42px}.xp-mono-concept{font-size:11px;color:#bfc1bf;letter-spacing:.5px}.xp-mono-main{position:relative;flex:1;min-height:0;background:radial-gradient(ellipse at 69% 53%,#292b2b 0%,#191a1a 39%,#111212 77%)}.xp-mono-copy{position:relative;z-index:2;padding:55px 0 28px 62px;width:47%;pointer-events:none}.xp-mono-eyebrow{font-size:10px;letter-spacing:2.6px;color:#949996;margin:0 0 22px}.xp-mono-title{font-size:clamp(44px,5.1vw,62px);font-weight:600;letter-spacing:-2.2px;line-height:1.23;margin:0}.xp-mono-description{font-size:14px;line-height:1.85;letter-spacing:.5px;color:#a9adab;margin:20px 0 26px}.xp-mono-material{display:inline-flex;align-items:center;gap:19px;border:0;border-bottom:1px solid #9da39f;padding:0 0 10px;background:transparent;color:#ebedeb;font-size:12px!important;pointer-events:auto}.xp-mono-material:hover{border-color:white}.xp-mono-material .xp-icon{width:16px;height:16px}.xp-mono-figure{margin:0;position:absolute;inset:0 0 0 36%;overflow:hidden}.xp-mono-photo{display:block;width:100%;height:100%;object-fit:cover;object-position:center center;mix-blend-mode:lighten}.xp-mono-photo-note{position:absolute;right:44px;bottom:19px;font-size:9px;letter-spacing:1px;color:#949b97}.xp-mono-material-panel{position:absolute;inset:26px 32px 26px auto;width:39%;background:#242726ed;border:1px solid #ffffff2b;border-radius:12px;padding:37px 31px;box-shadow:0 20px 45px #0005;z-index:4;backdrop-filter:blur(18px)}.xp-mono-panel-kicker{font-size:9px;letter-spacing:2px;color:#a4ada7}.xp-mono-panel-title{font-size:28px;font-weight:500;line-height:1.55;letter-spacing:-.5px;margin:25px 0 17px}.xp-mono-panel-text{font-size:13px;line-height:1.95;color:#c5cbc7;max-width:260px}.xp-mono-panel-footnote{display:block;font-size:10px;line-height:1.6;color:#9ca69e;margin-top:32px}.xp-mono-panel-close{position:absolute;right:17px;top:13px;border:0;background:none;color:#c6ccc7;font-size:24px!important;line-height:1;width:32px;height:32px}.xp-mono-bottom{padding:18px 44px 15px;display:flex;align-items:center;gap:25px;border-top:1px solid #ffffff12;position:relative;z-index:5;min-height:78px;background:#151616}.xp-mono-finishes{display:flex;align-items:center;gap:19px;flex:1;min-width:0}.xp-mono-color-label{font-size:12px;min-width:28px}.xp-mono-swatches{display:flex;gap:7px;align-items:center}.xp-mono-swatch{width:28px;height:28px;padding:4px;border:1px solid transparent;border-radius:50%;background:none;display:grid;place-items:center}.xp-mono-swatch[aria-pressed=true]{border-color:#e0e4de}.xp-mono-swatch span{display:block;width:18px;height:18px;border-radius:50%;border:1px solid #ffffff26}.xp-mono-swatch-silver span{background:linear-gradient(130deg,#e3e4df,#949b98)}.xp-mono-swatch-carbon span{background:linear-gradient(130deg,#525956,#252d29)}.xp-mono-swatch-sand span{background:linear-gradient(130deg,#cdc0a9,#9f8e77)}.xp-mono-color-detail{font-size:10px;letter-spacing:.4px;color:#a9aeaa}.xp-mono-specs{width:128px;flex:none;font-size:12px}.xp-mono-specs summary{display:flex;align-items:center;justify-content:space-between;padding:9px 0;cursor:pointer;list-style:none;color:#dfe2df}.xp-mono-specs summary::-webkit-details-marker{display:none}.xp-mono-specs summary span{font-size:21px;font-weight:300}.xp-mono-specs[open] summary span{transform:rotate(45deg)}.xp-mono-spec-list{position:absolute;right:32px;bottom:calc(100% - 3px);margin:0;width:380px;padding:17px 24px;background:#242726;border:1px solid #ffffff29;border-radius:12px;box-shadow:0 15px 30px #0004}.xp-mono-spec-list div{display:grid;grid-template-columns:74px 1fr;gap:15px;padding:11px 0;border-bottom:1px solid #ffffff14;font-size:11px;line-height:1.7}.xp-mono-spec-list div:last-child{border:0}.xp-mono-spec-list dt{color:#9ea8a1}.xp-mono-spec-list dd{margin:0;color:#e2e7e1}.xp-mono-footer{display:flex;justify-content:space-between;gap:20px;align-items:center;min-height:35px;flex:none;padding:0 44px;background:#111212;font-size:9px;letter-spacing:.2px;color:#8f9691}
.xp-tool{height:640px;border-radius:16px;background:#fff;color:#252c2b;border:1px solid #dce0dc;overflow:hidden;display:flex;flex-direction:column;--xp-amber:#f1cd68;--xp-stroke:#e5e8e3}.xp-tool-header{height:57px;padding:0 28px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--xp-stroke);background:#fafbf8;flex:none}.xp-tool-brand{display:flex;align-items:center;gap:10px}.xp-tool-mark{height:29px;width:29px;display:grid;place-items:center;background:#edca6e;border-radius:7px;color:#403d2d}.xp-tool-mark .xp-icon{height:17px;width:17px}.xp-tool-wordmark{font-weight:650;font-size:19px;letter-spacing:-.6px}.xp-tool-brand-divider{font-size:15px;font-weight:300;margin:0 13px;color:#b1b8af}.xp-tool-brand-description{font-size:12px;font-weight:400;color:#687268;letter-spacing:.3px}.xp-tool-mode{font-size:10px;display:flex;align-items:center;gap:6px;color:#73806e}.xp-tool-status-dot{width:5px;height:5px;border-radius:50%;background:#788870}.xp-tool-toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:17px 28px 18px;min-height:91px;border-bottom:1px solid var(--xp-stroke);flex:none}.xp-tool-breadcrumb{font-size:9px;margin:0 0 7px;color:#849080;letter-spacing:.6px}.xp-tool-breadcrumb span{margin:0 8px;color:#c1c8bd}.xp-tool-document-name{font-size:17px;letter-spacing:-.25px;font-weight:600;margin:0;line-height:1.5}.xp-tool-export{display:inline-flex;align-items:center;gap:8px;color:#f6f7f0;background:#28332d;border:1px solid #28332d;padding:9px 13px;border-radius:7px;font-size:11px!important;white-space:nowrap}.xp-tool-export:hover{background:#3d4b40}.xp-tool-export .xp-icon{height:14px;width:14px}.xp-tool-workspace{display:grid;grid-template-columns:1fr 1fr;min-height:0;flex:1}.xp-source-pane,.xp-notes-pane{min-width:0;min-height:0;display:flex;flex-direction:column;margin:0}.xp-source-pane{background:#fafbf8;border-right:1px solid var(--xp-stroke)}.xp-pane-heading{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:0 25px;height:44px;flex:none;font-size:11px;font-weight:550;letter-spacing:.2px;border-bottom:1px solid var(--xp-stroke);background:#fff}.xp-pane-meta{font-size:9px;font-weight:400;color:#899184}.xp-source-scroll,.xp-notes-scroll{overflow:auto;overscroll-behavior:contain;scrollbar-width:thin;scrollbar-color:#dce0d6 transparent;min-height:0;flex:1}.xp-source-paper{margin:20px 22px 23px;background:#fff;border:1px solid #e9ece5;box-shadow:0 3px 10px #1c331306;padding:23px 25px 10px;min-height:390px}.xp-source-kicker{font-size:8px;letter-spacing:1.8px;color:#9aa293}.xp-source-title{font-size:25px;font-weight:600;letter-spacing:-.7px;margin:12px 0 6px;font-family:"Noto Serif CJK SC","Source Han Serif SC","Songti SC",SimSun,serif}.xp-source-deck{font-size:10px;color:#8a9383;line-height:1.8;margin:0 0 22px}.xp-source-paragraph{display:grid;grid-template-columns:20px 1fr;gap:7px;position:relative;border-radius:5px;padding:8px 8px 9px;margin:0 -8px 8px;scroll-margin:20px;outline:none;border-left:2px solid transparent;transition:background .2s ease,border-color .2s ease}.xp-source-active{background:#fcf7e9;border-left-color:#d9b854}.xp-source-number{font-size:9px;line-height:1.9;color:#a2a98f;font-variant-numeric:tabular-nums}.xp-source-active .xp-source-number{color:#9b813b}.xp-source-subtitle{font-size:12px;font-weight:600;margin:0 0 5px;line-height:1.6}.xp-source-text{font-size:11px;line-height:1.95;letter-spacing:.15px;color:#647060;margin:0}.xp-source-footnote{font-size:8px;color:#9da68f;border-top:1px solid #edf0e7;padding-top:15px;margin-top:20px}.xp-notes-scroll{padding:20px 24px 15px}.xp-summary-heading{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:10px}.xp-summary-heading h3{font-size:14px;font-weight:600;margin:0;letter-spacing:-.2px}.xp-summary-badge{font-size:8px;border:1px solid #e5e9df;border-radius:4px;padding:3px 5px;color:#8a9480;white-space:nowrap}.xp-summary-list{list-style:none;padding:0;margin:0 0 20px}.xp-summary-list li{display:grid;grid-template-columns:18px 1fr;gap:8px;padding:9px 0 10px;border-bottom:1px solid #edf0e7}.xp-summary-list li:last-child{border-bottom:0}.xp-summary-index{font-size:10px;color:#94a18b;line-height:1.9;font-variant-numeric:tabular-nums}.xp-summary-list p{font-size:11px;line-height:1.85;color:#485747;margin:0 0 4px}.xp-source-link{border:0;background:none;padding:2px 0;color:#87977c;font-size:9px!important;display:inline-flex;align-items:center;gap:5px}.xp-source-link .xp-icon{width:11px;height:11px}.xp-source-link-active{color:#917328}.xp-source-link:hover{color:#3b5031}.xp-cards-heading{display:flex;justify-content:space-between;gap:10px;align-items:center;margin:0 0 12px;padding-top:13px;border-top:1px solid var(--xp-stroke)}.xp-cards-heading h3{font-size:12px;font-weight:600;margin:0}.xp-cards-heading h3 span{font-size:9px;color:#9ca58f;font-weight:400;margin-left:7px}.xp-add-card{border:0;background:none;color:#7b8e70;display:inline-flex;align-items:center;gap:4px;font-size:9px!important;padding:5px 0}.xp-add-card .xp-icon{width:13px;height:13px}.xp-add-card:hover{color:#283e20}.xp-knowledge-cards{display:grid;gap:10px}.xp-knowledge-card{position:relative;padding:11px 14px 10px;border:1px solid #e7dec2;background:#fffcf2;border-radius:7px;box-shadow:0 2px 4px #9d843705}.xp-card-question-label,.xp-card-answer-label{display:block}.xp-card-question-label>span,.xp-card-answer-label>span{font-size:8px;letter-spacing:.3px;color:#a19673;display:block;margin-bottom:2px}.xp-card-question{width:calc(100% - 20px);font-size:11px!important;font-weight:600!important;border:0;background:transparent;color:#454a37;padding:4px 0;outline-offset:3px}.xp-card-answer-label{margin-top:8px}.xp-card-answer{width:100%;font-size:10px!important;color:#7b8168;line-height:1.8;border:0;background:transparent;padding:3px 0;resize:vertical;min-height:36px;max-height:140px;outline-offset:3px}.xp-card-question:focus,.xp-card-answer:focus{outline:1px solid #b6a66c;background:#ffffff70}.xp-card-remove{position:absolute;right:7px;top:7px;height:24px;width:24px;font-size:17px!important;color:#a99f83;background:none;border:0;border-radius:4px;line-height:1}.xp-card-remove:hover{background:#f4edd9;color:#695b39}.xp-notes-footer{height:34px;flex:none;border-top:1px solid var(--xp-stroke);background:#fdfefb;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:0 23px;font-size:8px;color:#99a18e}.xp-notes-count{white-space:nowrap}.xp-notes-live{line-height:1.6}.xp-tool button:focus-visible,.xp-tool input:focus-visible,.xp-tool textarea:focus-visible{outline-color:#9b8750}
@media(min-width:1250px){.xp-mono-title{font-size:62px}}
@media(max-width:760px){.xp-website{height:680px}.xp-mono-nav{padding:0 23px;height:58px}.xp-mono-nav-label{display:none}.xp-mono-logo{font-size:22px}.xp-mono-main{flex:1}.xp-mono-copy{padding:32px 0 0 29px;width:65%}.xp-mono-eyebrow{font-size:8px;margin-bottom:16px}.xp-mono-title{font-size:42px;letter-spacing:-1.5px}.xp-mono-description{font-size:12px;margin:14px 0 19px}.xp-mono-material{font-size:11px!important}.xp-mono-figure{inset:185px -30px -5px 11%}.xp-mono-photo{object-fit:contain}.xp-mono-photo-note{right:53px;bottom:10px;font-size:8px}.xp-mono-material-panel{inset:28px 20px 28px 20px;width:auto;padding:28px}.xp-mono-panel-title{font-size:30px}.xp-mono-bottom{padding:12px 22px;gap:10px;min-height:75px}.xp-mono-finishes{gap:9px;flex-wrap:wrap}.xp-mono-color-label{font-size:10px}.xp-mono-color-detail{font-size:8px;flex-basis:100%;order:3}.xp-mono-swatches{gap:3px}.xp-mono-specs{width:89px;font-size:10px}.xp-mono-spec-list{right:14px;max-width:calc(100% - 28px);width:350px;padding:12px 17px}.xp-mono-spec-list div{font-size:10px;grid-template-columns:66px 1fr;gap:10px}.xp-mono-footer{padding:8px 22px;gap:6px;align-items:flex-start;flex-direction:column;font-size:8px;min-height:48px}.xp-tool{height:auto;min-height:780px}.xp-tool-header{height:56px;padding:0 18px}.xp-tool-wordmark{font-size:18px}.xp-tool-brand-description{font-size:10px}.xp-tool-brand-divider{margin:0 7px}.xp-tool-mode{font-size:8px}.xp-tool-toolbar{padding:16px 18px;min-height:93px;align-items:flex-end}.xp-tool-document-name{font-size:14px;max-width:230px}.xp-tool-breadcrumb{font-size:8px}.xp-tool-export{padding:8px;font-size:10px!important}.xp-tool-export span{display:none}.xp-tool-workspace{grid-template-columns:1fr;display:block}.xp-source-pane{border-right:0;border-bottom:1px solid var(--xp-stroke);height:365px}.xp-notes-pane{height:486px}.xp-pane-heading{padding:0 18px;height:39px}.xp-pane-meta{font-size:8px}.xp-source-paper{margin:14px 16px;padding:19px 21px}.xp-source-title{font-size:24px}.xp-source-text{font-size:12px}.xp-source-deck{font-size:11px}.xp-source-subtitle{font-size:13px}.xp-notes-scroll{padding:18px}.xp-summary-list p{font-size:12px}.xp-source-link{font-size:10px!important}.xp-card-question{font-size:12px!important}.xp-card-answer{font-size:11px!important}.xp-notes-footer{padding:0 18px}}
@media(prefers-reduced-motion:reduce){.xp-preview *{scroll-behavior:auto!important;transition:none!important}}
`;

export const productScript = String.raw`
(() => {
  document.querySelectorAll('[data-xp-website]').forEach((root, index) => {
    if (root.dataset.xpReady) return;
    root.dataset.xpReady = 'true';
    const panel = root.querySelector('[data-xp-material-panel]');
    const trigger = root.querySelector('[data-xp-material]');
    const close = root.querySelector('[data-xp-close-material]');
    panel.id = 'xp-material-panel-' + index;
    trigger.setAttribute('aria-controls', panel.id);
    const setPanel = (open) => {
      panel.hidden = !open;
      trigger.setAttribute('aria-expanded', String(open));
      if (open) close.focus({ preventScroll: true });
      else trigger.focus({ preventScroll: true });
    };
    trigger.addEventListener('click', () => setPanel(panel.hidden));
    close.addEventListener('click', () => setPanel(false));
    root.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !panel.hidden) setPanel(false);
    });
    const colors = {
      silver: ['雾银', '银灰金属 × 浅灰织物', '当前产品图为雾银配色'],
      carbon: ['炭黑', '深炭金属 × 炭灰织物 · 配色设想', '已选炭黑概念；产品图仍展示雾银'],
      sand: ['暖沙', '暖沙金属 × 米色织物 · 配色设想', '已选暖沙概念；产品图仍展示雾银']
    };
    root.querySelectorAll('[data-xp-color]').forEach((button) => {
      button.addEventListener('click', () => {
        const color = colors[button.dataset.xpColor];
        root.querySelectorAll('[data-xp-color]').forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
        root.querySelector('[data-xp-color-label]').textContent = color[0];
        root.querySelector('[data-xp-color-detail]').textContent = color[1];
        root.querySelector('[data-xp-photo-disclosure]').textContent = color[2];
      });
    });
  });

  document.querySelectorAll('[data-xp-tool]').forEach((root) => {
    if (root.dataset.xpReady) return;
    root.dataset.xpReady = 'true';
    const cards = root.querySelector('[data-xp-knowledge-cards]');
    const live = root.querySelector('[data-xp-tool-live]');
    const cardTemplate = cards.firstElementChild.cloneNode(true);
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const scrollLocal = (scroller, node) => {
      const top = node.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop - 18;
      scroller.scrollTo({ top: Math.max(0, top), behavior: reducedMotion ? 'auto' : 'smooth' });
    };
    const updateCount = () => {
      const count = cards.querySelectorAll('[data-xp-card]').length;
      root.querySelector('[data-xp-card-count]').textContent = String(count).padStart(2, '0');
      root.querySelector('[data-xp-note-total]').textContent = count + ' 张卡片';
    };
    root.querySelectorAll('[data-xp-source]').forEach((button) => {
      button.addEventListener('click', () => {
        const paragraph = root.querySelector('[data-xp-paragraph="' + button.dataset.xpSource + '"]');
        root.querySelectorAll('[data-xp-paragraph]').forEach((item) => item.classList.toggle('xp-source-active', item === paragraph));
        root.querySelectorAll('[data-xp-source]').forEach((item) => {
          item.classList.toggle('xp-source-link-active', item === button);
          item.setAttribute('aria-pressed', String(item === button));
        });
        scrollLocal(root.querySelector('[data-xp-source-scroll]'), paragraph);
        paragraph.focus({ preventScroll: true });
        live.textContent = '已定位原始资料第 ' + button.dataset.xpSource + ' 段';
      });
    });
    cards.addEventListener('input', () => { live.textContent = '笔记已在本页更新，可导出保存'; });
    cards.addEventListener('click', (event) => {
      const button = event.target.closest('[data-xp-remove-card]');
      if (!button || !cards.contains(button)) return;
      const card = button.closest('[data-xp-card]');
      const remaining = card.nextElementSibling || card.previousElementSibling;
      card.remove();
      updateCount();
      live.textContent = '已删除知识卡';
      (remaining ? remaining.querySelector('[data-xp-question]') : root.querySelector('[data-xp-add-card]')).focus({ preventScroll: true });
    });
    root.querySelector('[data-xp-add-card]').addEventListener('click', () => {
      const card = cardTemplate.cloneNode(true);
      const question = card.querySelector('[data-xp-question]');
      const answer = card.querySelector('[data-xp-answer]');
      question.value = '';
      question.placeholder = '写下一个你想记住的问题';
      answer.value = '';
      answer.placeholder = '用自己的话回答……';
      cards.appendChild(card);
      updateCount();
      scrollLocal(root.querySelector('[data-xp-notes-scroll]'), card);
      question.focus({ preventScroll: true });
      live.textContent = '已添加空白知识卡';
    });
    root.querySelector('[data-xp-export]').addEventListener('click', () => {
      const notes = Array.from(cards.querySelectorAll('[data-xp-card]')).map((card, index) => {
        const question = card.querySelector('[data-xp-question]').value.trim() || '待补充问题';
        const answer = card.querySelector('[data-xp-answer]').value.trim() || '待补充答案';
        return '### ' + (index + 1) + '. ' + question + '\n\n' + answer;
      });
      const summaries = Array.from(root.querySelectorAll('.xp-summary-list li')).map((item) => {
        const source = item.querySelector('[data-xp-source]').dataset.xpSource;
        return '- ' + item.querySelector('p').textContent.trim() + '（来源：第 ' + source + ' 段）';
      });
      const sources = Array.from(root.querySelectorAll('[data-xp-paragraph]')).map((item) => {
        return '### 来源 ' + item.dataset.xpParagraph + ' · ' + item.querySelector('.xp-source-subtitle').textContent + '\n\n' + item.querySelector('.xp-source-text').textContent;
      });
      const markdown = '# 光合作用 · 学习笔记\n\n> 拾页学习资料助手 · 固定示例资料，本地编辑与导出。\n\n## 三个要点\n\n' + summaries.join('\n') + '\n\n## 我的知识卡\n\n' + (notes.join('\n\n') || '暂无知识卡。') + '\n\n## 原始资料\n\n' + sources.join('\n\n') + '\n';
      const url = URL.createObjectURL(new Blob([markdown], { type: 'text/markdown;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = '拾页-光合作用学习笔记.md';
      link.hidden = true;
      root.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 3000);
      live.textContent = '已导出 Markdown，包含笔记与全部来源';
    });
  });
})();
`;
