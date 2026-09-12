import React, { useEffect, useId, useRef, useState } from "react";
import "./product-experiences.css";

function ProductIcon({ name }) {
  const paths = {
    arrow: "M5 12h14m-5-5 5 5-5 5",
    book: "M12 5c-3-2-6-2-9-1v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-3-1-6-1-9 1Zm0 0v15",
    download: "M12 3v12m-4-4 4 4 4-4M4 16v4h16v-4",
    plus: "M12 5v14M5 12h14",
  };
  return (
    <svg className="xp-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={paths[name]} />
    </svg>
  );
}

const finishes = [
  { id: "silver", name: "雾银", label: "雾银配色", detail: "银灰金属 × 浅灰织物", disclosure: "当前产品图为雾银配色" },
  { id: "carbon", name: "炭黑", label: "炭黑配色概念", detail: "深炭金属 × 炭灰织物 · 配色设想", disclosure: "已选炭黑概念；产品图仍展示雾银" },
  { id: "sand", name: "暖沙", label: "暖沙配色概念", detail: "暖沙金属 × 米色织物 · 配色设想", disclosure: "已选暖沙概念；产品图仍展示雾银" },
];

export function MonoExperience() {
  const [finishId, setFinishId] = useState("silver");
  const [materialOpen, setMaterialOpen] = useState(false);
  const materialId = useId();
  const materialTitleId = useId();
  const materialTrigger = useRef(null);
  const materialClose = useRef(null);
  const finish = finishes.find((item) => item.id === finishId);

  useEffect(() => {
    if (materialOpen) materialClose.current?.focus({ preventScroll: true });
  }, [materialOpen]);

  function closeMaterial() {
    setMaterialOpen(false);
    materialTrigger.current?.focus({ preventScroll: true });
  }

  function handleKeyDown(event) {
    if (event.key === "Escape" && materialOpen) {
      // Consume this Escape before the outer project dialog handles it.
      event.preventDefault();
      event.stopPropagation();
      closeMaterial();
    }
  }

  return (
    <section className="xp-preview xp-website" aria-label="MONO 原创产品网站设计练习" onKeyDownCapture={handleKeyDown}>
      <header className="xp-mono-nav">
        <span className="xp-mono-logo">MONO</span>
        <span className="xp-mono-nav-label">SOUND, CONSIDERED.</span>
        <span className="xp-mono-concept">原创产品概念</span>
      </header>
      <div className="xp-mono-main">
        <div className="xp-mono-copy">
          <p className="xp-mono-eyebrow">MONO / 01 · HEADPHONES</p>
          <h2 className="xp-mono-title">让声音，<br />更靠近。</h2>
          <p className="xp-mono-description">少一点干扰。<br />多一点，与声音独处的空间。</p>
          <button ref={materialTrigger} type="button" className="xp-mono-material" aria-expanded={materialOpen} aria-controls={materialId} onClick={() => materialOpen ? closeMaterial() : setMaterialOpen(true)}>
            探索材质 <ProductIcon name="arrow" />
          </button>
        </div>
        <figure className="xp-mono-figure">
          <img className="xp-mono-photo" src="/art/showcase/headphones.webp" alt="原创 MONO 雾银色头戴耳机的产品摄影质感概念图" loading="eager" />
          <figcaption className="xp-mono-photo-note">雾银 / 外观概念图</figcaption>
        </figure>
        <div id={materialId} className="xp-mono-material-panel" role="region" aria-labelledby={materialTitleId} hidden={!materialOpen}>
          <span className="xp-mono-panel-kicker">MATERIAL STUDY</span>
          <h3 id={materialTitleId} className="xp-mono-panel-title">克制的金属。<br />温和的织物。</h3>
          <p className="xp-mono-panel-text">铝合金外壳与编织耳垫的材质设想，让冷与暖在同一件物品上相遇。</p>
          <span className="xp-mono-panel-footnote">材质与结构均为本次外观设计提案。</span>
          <button ref={materialClose} className="xp-mono-panel-close" type="button" aria-label="关闭材质说明" onClick={closeMaterial}>×</button>
        </div>
      </div>
      <div className="xp-mono-bottom">
        <div className="xp-mono-finishes">
          <span className="xp-mono-color-label">{finish.name}</span>
          <div className="xp-mono-swatches" role="group" aria-label="选择配色概念">
            {finishes.map((item) => (
              <button key={item.id} className={`xp-mono-swatch xp-mono-swatch-${item.id}`} type="button" aria-label={item.label} aria-pressed={finishId === item.id} onClick={() => setFinishId(item.id)}><span /></button>
            ))}
          </div>
          <span className="xp-mono-color-detail" aria-live="polite">{finish.detail}</span>
        </div>
        <details className="xp-mono-specs">
          <summary>设计规格 <span aria-hidden="true">+</span></summary>
          <dl className="xp-mono-spec-list">
            <div><dt>产品形式</dt><dd>头戴式耳机外观概念</dd></div>
            <div><dt>结构设计</dt><dd>环形耳罩、弧形头梁与金属支架</dd></div>
            <div><dt>材质设想</dt><dd>铝合金外壳与编织织物</dd></div>
            <div><dt>项目状态</dt><dd>网站与产品外观设计练习，非在售产品</dd></div>
          </dl>
        </details>
      </div>
      <footer className="xp-mono-footer"><span>设计练习示例 · 非 Apple 官方网站或作品</span><span>{finish.disclosure}</span></footer>
    </section>
  );
}

const reading = [
  {
    id: 1,
    title: "能量从哪里来",
    text: "绿色植物通过光合作用，把光能转化为储存在有机物中的化学能。这个过程通常需要光、二氧化碳和水，并释放氧气。",
    summary: "植物利用光，把二氧化碳和水转化为有机物，并释放氧气。",
  },
  {
    id: 2,
    title: "叶片里的微型工厂",
    text: "叶片中许多细胞含有叶绿体。叶绿体中的叶绿素能够吸收光，为光合作用提供能量。根吸收的水通过植物体输送到叶片，二氧化碳主要通过气孔进入叶片。",
    summary: "叶绿素吸收光；水和二氧化碳通过不同路径来到叶片。",
  },
  {
    id: 3,
    title: "光越强，长得越快吗",
    text: "光照强度、二氧化碳浓度和温度等条件会影响光合作用。在其他条件合适时，一定范围内增强光照能提高光合作用速率；但光越强并不意味着速率会一直上升。",
    summary: "光合作用受多种条件影响，并不是光越强就越快。",
  },
];

function scrollToNote(scroller, node) {
  if (!node) return;
  const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
  if (scroller && scroller.scrollHeight > scroller.clientHeight + 1 && getComputedStyle(scroller).overflowY !== "visible") {
    const top = node.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop - 18;
    scroller.scrollTo({ top: Math.max(0, top), behavior });
  } else {
    node.scrollIntoView({ block: "nearest", behavior });
  }
}

function createStudyMarkdown(cards) {
  const notes = cards.map((card, index) => `### ${index + 1}. ${card.question.trim() || "待补充问题"}\n\n${card.answer.trim() || "待补充答案"}`);
  const summaries = reading.map((paragraph) => `- ${paragraph.summary}（来源：第 ${paragraph.id} 段）`);
  const sources = reading.map((paragraph) => `### 来源 ${paragraph.id} · ${paragraph.title}\n\n${paragraph.text}`);
  return `# 光合作用 · 学习笔记\n\n> 拾页学习资料助手 · 固定示例资料，本地编辑与导出。\n\n## 三个要点\n\n${summaries.join("\n")}\n\n## 我的知识卡\n\n${notes.join("\n\n") || "暂无知识卡。"}\n\n## 原始资料\n\n${sources.join("\n\n")}\n`;
}

export function NotesExperience() {
  const [activeSource, setActiveSource] = useState(1);
  const [cards, setCards] = useState([{ id: 1, question: "为什么说光合作用是能量的转化？", answer: "因为植物把光能转化为储存在有机物中的化学能。" }]);
  const [status, setStatus] = useState("可以修改知识卡，写下自己的理解");
  const root = useRef(null);
  const sourceScroller = useRef(null);
  const noteScroller = useRef(null);
  const sourceRefs = useRef(new Map());
  const cardRefs = useRef(new Map());
  const questionRefs = useRef(new Map());
  const addButton = useRef(null);
  const nextId = useRef(2);
  const pendingFocus = useRef(null);
  const downloads = useRef(new Map());
  const sourcePrefix = useId();

  useEffect(() => {
    const action = pendingFocus.current;
    if (!action) return;
    pendingFocus.current = null;
    const target = action.id ? questionRefs.current.get(action.id) : addButton.current;
    target?.focus({ preventScroll: true });
    if (action.scroll) scrollToNote(noteScroller.current, cardRefs.current.get(action.id));
  }, [cards]);

  useEffect(() => {
    const activeDownloads = downloads.current;
    return () => {
      activeDownloads.forEach((timer, url) => {
        window.clearTimeout(timer);
        URL.revokeObjectURL(url);
      });
      activeDownloads.clear();
    };
  }, []);

  function locateSource(id) {
    setActiveSource(id);
    const paragraph = sourceRefs.current.get(id);
    paragraph?.focus({ preventScroll: true });
    scrollToNote(sourceScroller.current, paragraph);
    setStatus(`已定位原始资料第 ${id} 段`);
  }

  function editCard(id, field, value) {
    setCards((current) => current.map((card) => card.id === id ? { ...card, [field]: value } : card));
    setStatus("笔记已在本页更新，可导出保存");
  }

  function addCard() {
    const id = nextId.current++;
    pendingFocus.current = { id, scroll: true };
    setCards((current) => [...current, { id, question: "", answer: "" }]);
    setStatus("已添加空白知识卡");
  }

  function removeCard(id) {
    const index = cards.findIndex((card) => card.id === id);
    const nextCard = cards[index + 1] || cards[index - 1];
    pendingFocus.current = { id: nextCard?.id, scroll: false };
    setCards((current) => current.filter((card) => card.id !== id));
    setStatus("已删除知识卡");
  }

  function exportNotes() {
    const url = URL.createObjectURL(new Blob([createStudyMarkdown(cards)], { type: "text/markdown;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "拾页-光合作用学习笔记.md";
    link.hidden = true;
    root.current.appendChild(link);
    link.click();
    link.remove();
    const timer = window.setTimeout(() => {
      URL.revokeObjectURL(url);
      downloads.current.delete(url);
    }, 3000);
    downloads.current.set(url, timer);
    setStatus("已导出 Markdown，包含笔记与全部来源");
  }

  return (
    <section ref={root} className="xp-preview xp-tool" aria-label="拾页学习资料助手，本地示例">
      <header className="xp-tool-header">
        <div className="xp-tool-brand"><span className="xp-tool-mark"><ProductIcon name="book" /></span><span className="xp-tool-wordmark">拾页<span className="xp-tool-brand-divider">/</span><span className="xp-tool-brand-description">学习资料助手</span></span></div>
        <span className="xp-tool-mode"><span className="xp-tool-status-dot" />示例资料 · 本地交互</span>
      </header>
      <div className="xp-tool-toolbar">
        <div><p className="xp-tool-breadcrumb">我的学习空间 <span>/</span> 科学阅读</p><h2 className="xp-tool-document-name">一束光，怎样变成生长的力量？</h2></div>
        <button type="button" className="xp-tool-export" aria-label="导出笔记" onClick={exportNotes}><ProductIcon name="download" /><span>导出笔记</span></button>
      </div>
      <div className="xp-tool-workspace">
        <article className="xp-source-pane">
          <div className="xp-pane-heading"><span>原始资料</span><span className="xp-pane-meta">3 段示例文字</span></div>
          <div className="xp-source-scroll" ref={sourceScroller}>
            <div className="xp-source-paper">
              <span className="xp-source-kicker">SCIENCE NOTES / 01</span>
              <h3 className="xp-source-title">光合作用</h3>
              <p className="xp-source-deck">读懂植物如何把光，变成生长所需的能量。</p>
              {reading.map((paragraph) => (
                <section key={paragraph.id} id={`${sourcePrefix}-${paragraph.id}`} ref={(node) => { if (node) sourceRefs.current.set(paragraph.id, node); else sourceRefs.current.delete(paragraph.id); }} className={`xp-source-paragraph${activeSource === paragraph.id ? " xp-source-active" : ""}`} tabIndex={-1} aria-label={`原始资料第 ${paragraph.id} 段`}>
                  <span className="xp-source-number">{String(paragraph.id).padStart(2, "0")}</span>
                  <div><h4 className="xp-source-subtitle">{paragraph.title}</h4><p className="xp-source-text">{paragraph.text}</p></div>
                </section>
              ))}
              <p className="xp-source-footnote">供交互体验使用的固定示例资料</p>
            </div>
          </div>
        </article>
        <aside className="xp-notes-pane">
          <div className="xp-pane-heading"><span>我的学习笔记</span><span className="xp-pane-meta">每个要点，都能找到出处</span></div>
          <div className="xp-notes-scroll" ref={noteScroller}>
            <div className="xp-summary-heading"><h3>先读懂这三件事</h3><span className="xp-summary-badge">示例摘要</span></div>
            <ol className="xp-summary-list">
              {reading.map((paragraph) => (
                <li key={paragraph.id}>
                  <span className="xp-summary-index">{paragraph.id}</span>
                  <div><p>{paragraph.summary}</p><button className={`xp-source-link${activeSource === paragraph.id ? " xp-source-link-active" : ""}`} type="button" aria-pressed={activeSource === paragraph.id} aria-controls={`${sourcePrefix}-${paragraph.id}`} onClick={() => locateSource(paragraph.id)}>来源 {String(paragraph.id).padStart(2, "0")} <ProductIcon name="arrow" /></button></div>
                </li>
              ))}
            </ol>
            <div className="xp-cards-heading"><h3>记成自己的话 <span>{String(cards.length).padStart(2, "0")}</span></h3><button ref={addButton} type="button" className="xp-add-card" onClick={addCard}><ProductIcon name="plus" /> 新建知识卡</button></div>
            <div className="xp-knowledge-cards">
              {cards.map((card) => (
                <div key={card.id} ref={(node) => { if (node) cardRefs.current.set(card.id, node); else cardRefs.current.delete(card.id); }} className="xp-knowledge-card">
                  <label className="xp-card-question-label"><span>问题</span><input ref={(node) => { if (node) questionRefs.current.set(card.id, node); else questionRefs.current.delete(card.id); }} className="xp-card-question" aria-label="知识卡问题" value={card.question} onChange={(event) => editCard(card.id, "question", event.target.value)} placeholder="写下一个你想记住的问题" maxLength={160} /></label>
                  <label className="xp-card-answer-label"><span>我的理解</span><textarea className="xp-card-answer" aria-label="知识卡答案" rows={2} maxLength={2000} value={card.answer} onChange={(event) => editCard(card.id, "answer", event.target.value)} placeholder="用自己的话回答……" /></label>
                  <button className="xp-card-remove" type="button" aria-label="删除这张知识卡" onClick={() => removeCard(card.id)}>×</button>
                </div>
              ))}
            </div>
          </div>
          <footer className="xp-notes-footer"><span className="xp-notes-live" aria-live="polite">{status}</span><span className="xp-notes-count">{cards.length} 张卡片</span></footer>
        </aside>
      </div>
    </section>
  );
}

export function ProductExperience({ id }) {
  if (id === "mono") return <MonoExperience />;
  if (id === "notes") return <NotesExperience />;
  return null;
}
