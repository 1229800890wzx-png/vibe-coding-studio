import React, { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import ScrollCylinder from "./components/ScrollCylinder";
import "./motion-preview.css";

const directions = [
  { id: "game", label: "游戏创造", english: "PLAY & BUILD", description: "从一条规则开始，让你想象中的世界动起来。", href: "/projects?category=game&project=tower" },
  { id: "story", label: "互动故事", english: "IMAGINE & TELL", description: "给故事一个新的选择，让结局由读者决定。", href: "/projects?category=story&project=museum" },
  { id: "website", label: "网站设计", english: "DESIGN & SHARE", description: "把自己的热爱，做成一个可以被看见的网站。", href: "/projects?category=website&project=mono" },
  { id: "tool", label: "实用工具", english: "NOTICE & MAKE", description: "发现生活里的小问题，亲手做一个解决它的工具。", href: "/projects?category=tool&project=notes" },
  { id: "ai", label: "AI 小实验", english: "ASK & EXPLORE", description: "带着问题认识 AI，用一次次实验检查自己的发现。", href: "/projects?project=classify" },
  { id: "growth", label: "作品成长", english: "REFINE & GROW", description: "分享、听取反馈、再改一点，让每个想法慢慢长大。", href: "/projects" },
];

const examples = [
  { id: "tower", category: "game", label: "游戏创造", title: "一座花园，一套自己的规则。", image: "/art/showcase/tower-thumb.webp", alt: "花园守卫战的彩色场景与角色示意" },
  { id: "museum", category: "story", label: "互动故事", title: "下一扇门，由你来打开。", image: "/art/showcase/museum-thumb.webp", alt: "午夜博物馆的星光与奇幻展厅示意" },
  { id: "mono", category: "website", label: "网站设计", title: "用一个网站，表达一种热爱。", image: "/art/showcase/mono-thumb.webp", alt: "银色耳机与 MONO 产品网站设计示意" },
  { id: "notes", category: "tool", label: "实用工具", title: "让凌乱的资料，变得有条理。", image: "/art/showcase/notes-thumb.webp", alt: "拾页学习资料助手的知识卡片界面示意" },
];

export default function MotionPreview() {
  const { hash } = useLocation();
  useEffect(() => {
    if (hash !== "#motion-projects") return;
    const frame = requestAnimationFrame(() => {
      document.getElementById("motion-projects")?.scrollIntoView({ behavior: "instant" });
    });
    return () => cancelAnimationFrame(frame);
  }, [hash]);
  return (
    <div className="motion-preview">
      <header className="mp-header">
        <Link to="/" className="mp-brand" aria-label="VIBE CODING 少儿创造力实验室首页">
          <span>VIBE<span className="mp-brand-star" aria-hidden="true">✳</span>CODING</span>
          <span className="mp-brand-caption">少儿创造力实验室</span>
        </Link>
        <span className="mp-edition">创作方向 <span aria-hidden="true">/</span> 06</span>
        <Link className="mp-back" to="/"><ArrowLeft size={16} aria-hidden="true" />返回首页</Link>
      </header>
      <h1 className="mp-sr-only">把好奇，变成作品。探索六个创作方向。</h1>
      <ScrollCylinder items={directions} />
      <section className="mp-examples" id="motion-projects" aria-labelledby="mp-examples-title">
        <div className="mp-section-intro">
          <div><span className="mp-eyebrow">从想象，到眼前。</span><h2 id="mp-examples-title">好奇之后，<br />动手试试看。</h2></div>
          <p>一个小游戏、一段故事、一个生活里的小帮手。<br />从感兴趣的方向开始，看看想法怎样变成作品。<span>以下为可操作的教学示例。</span></p>
        </div>
        <div className="mp-example-grid">
          {examples.map((project, index) => (
            <Link key={project.id} className="mp-example" to={`/projects?category=${project.category}&project=${project.id}`}>
              <div className="mp-example-image"><img src={project.image} alt={project.alt} loading="lazy" width="768" height="512" /><span className="mp-example-open" aria-hidden="true"><ArrowUpRight size={24} /></span></div>
              <div className="mp-example-meta"><span>0{index + 1} / {project.label}</span><h3>{project.title}</h3></div>
            </Link>
          ))}
        </div>
        <Link className="mp-all-projects" to="/projects">浏览全部创作示例<ArrowUpRight size={22} aria-hidden="true" /></Link>
      </section>
      <footer className="mp-footer"><span>创造，从一个小小的念头开始。</span><Link to="/courses">了解我们的课程 <ArrowUpRight size={16} aria-hidden="true" /></Link></footer>
    </div>
  );
}
