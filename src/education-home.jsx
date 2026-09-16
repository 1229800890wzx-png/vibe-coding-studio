import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Footer, Icon, ReserveButton, FAQ } from './components';
import { faqItems } from './content';
import { useCourses } from './education-api';
import { ShowcaseImage } from './showcase';
import CourseExplorer from './course-explorer';
import { getCourseSearchText } from './course-lessons';

const stages = ['全部课程', '初次接触', '动手创作', '持续进阶'];

export default function EducationHome() {
  const [stage, setStage] = useState(0);
  const [query, setQuery] = useState('');
  const {data,loading,error,reload}=useCourses();
  const courses = data.filter(s => (!stage || stage === Number(s.stage)) && getCourseSearchText(s).toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  return <div className="education-home">
    <div className="edu-topline"><div className="container">VIBE CODING · 让好奇心，成为创造力<span>编程启蒙 / AI 创作 / 项目实践</span></div></div>
    <section className="edu-hero">
      <div className="container edu-hero-grid">
        <div className="edu-hero-copy"><div className="edu-kicker"><span />面向孩子的编程与 AI 创作课程</div>
          <h1>从一个好奇的问号，<br />到自己的<span>第一个作品。</span></h1>
          <p>找到适合孩子的学习起点。<br />在动手探索中，学会思考、表达与创造。</p>
          <div className="button-row"><a href="#course-finder" className="button button-primary">找到适合的课程<Icon name="ArrowRight" size={18} /></a><ReserveButton secondary /></div>
          <div className="edu-hero-notes"><span><Icon name="Compass" size={17} />兴趣出发</span><span><Icon name="Code2" size={17} />项目实践</span><span><Icon name="Presentation" size={17} />看见成长</span></div>
          <p className="brand-script" lang="en">A little wonder.</p>
        </div>
        <div className="edu-hero-art"><div className="edu-art-label">THE NEXT LITTLE CREATOR</div><div className="edu-art-frame"><ShowcaseImage id="minecraft" thumbnail={false} priority /></div><div className="edu-art-caption"><span><Icon name="Lightbulb" size={21} />“我想创造一个自己的世界。”</span><Link to="/projects?project=minecraft#gallery">打开互动演示<Icon name="ArrowUpRight" size={18} /></Link></div><div className="edu-art-stamp">想一想<br /><strong>做出来</strong></div></div>
      </div>
    </section>
    <div className="container edu-paths">{[['01','了解课程','看看学什么、怎样学','/courses'],['02','走进课堂','了解项目式学习过程','/method'],['03','体验作品','亲手探索互动演示','/projects#gallery']].map(([n,title,desc,to])=><Link key={n} to={to}><span className="edu-path-no">{n}</span><div><strong>{title}</strong><p>{desc}</p></div><Icon name="ArrowUpRight" /></Link>)}</div>
    <section id="course-finder" className="container edu-section"><div className="edu-section-head"><div><div className="edu-kicker">COURSE EXPLORER / 课程体系</div><h2>每一种好奇，都有一个起点。</h2><p>按已有经验探索课程，具体安排可通过咨询进一步了解。</p><p className="brand-script" lang="en">Find their starting point.</p></div><Link to="/courses">查看完整课程体系<Icon name="ArrowRight" size={18}/></Link></div>
      <div className="edu-filter">
        <div className="edu-tabs" role="group" aria-label="按学习阶段筛选">
          {stages.map((s,i)=><button key={s} type="button" aria-pressed={stage===i} onClick={()=>setStage(i)} className={stage===i?'selected':''}>{s}</button>)}
        </div>
        <div className="edu-search" role="search" aria-label="课程搜索">
          <Icon name="Search" size={18} aria-hidden="true" />
          <input aria-label="搜索课程" value={query} onChange={e=>setQuery(e.target.value)} placeholder="搜索感兴趣的课程" />
          <button type="button" className="icon-button edu-search-clear" aria-label="清空搜索" disabled={!query} onClick={()=>setQuery('')} style={{minWidth:44,minHeight:44}}><Icon name="X" size={17} aria-hidden="true" /></button>
        </div>
      </div>
      {!loading && !error && <p className="edu-results-count" role="status">找到 {courses.length} 门课程</p>}
      <div className="edu-course-results" aria-busy={loading}>
        {loading ? <p className="course-status course-status-loading" role="status">正在加载课程…</p>
          : error ? <div className="course-status course-status-error" role="alert"><p>{error}</p><button type="button" className="button button-secondary" onClick={reload}>重新加载</button></div>
          : courses.length ? <CourseExplorer courses={courses} />
          : <div className="edu-empty course-status course-status-empty"><Icon name="Search" size={30}/><h3>暂未找到匹配课程</h3><p>可以换个关键词，或查看全部课程。</p><button type="button" className="button button-secondary" onClick={()=>{setQuery('');setStage(0)}}>清除筛选</button></div>}
      </div>
    </section>
    <section className="edu-method"><div className="container edu-method-grid"><div><div className="edu-kicker">LEARN BY CREATING / 教学方法</div><h2>让知识，<br />在一个作品里发生。</h2><p>从“我想做什么”开始，逐步拆解问题。<br />理解每一步，也学会解释自己的选择。</p><p className="brand-script" lang="en">Learning, by making.</p><Link to="/method" className="button button-secondary">走近我们的教学方法<Icon name="ArrowRight" size={18}/></Link></div><ol>{[['提出想法','从生活和兴趣里，找到一个值得动手的问题。'],['动手实现','把大想法拆成小步骤，在编程与 AI 工具中实践。'],['测试改进','看看哪里有效、哪里还能更好，尝试另一种办法。'],['分享表达','展示作品，也说清楚自己的设计和思考。']].map(([t,d],i)=><li key={t}><span>0{i+1}</span><div><h3>{t}</h3><p>{d}</p></div></li>)}</ol></div></section>
    <section className="container edu-section edu-project-section"><div className="edu-section-head"><div><div className="edu-kicker">IDEAS IN ACTION / 互动作品</div><h2>先体验，再想象更多可能。</h2><p>以下为课程方向演示，可点击体验。</p><p className="brand-script" lang="en">Made of possibilities.</p></div><Link to="/projects#gallery">探索全部作品<Icon name="ArrowRight" size={18}/></Link></div>
      <div className="edu-project-grid">
        {[['minecraft','创造一个小世界','游戏规则 × 逻辑思考'],['museum','设计一个会分支的故事','分支逻辑 × 交互叙事']].map(([id,t,d])=><article className="edu-project-card glass-card" data-glass-card key={id}>
          <div className="edu-project-image"><ShowcaseImage id={id}/></div>
          <Link className="edu-project-link" to={`/projects?project=${id}#gallery`} aria-label={`打开${t}的互动体验`}><div><h3>{t}</h3><p>{d}</p></div><Icon name="ArrowUpRight" size={26}/></Link>
        </article>)}
      </div>
    </section>
    <section className="container edu-section edu-faq"><div><div className="edu-kicker">BEFORE WE BEGIN / 开始之前</div><h2>家长关心的问题</h2><p>从了解孩子开始，一起找到适合的学习方向。</p><ReserveButton /></div><FAQ items={faqItems}/></section>
    <Footer title="孩子的下一个想法，从这里开始。" />
  </div>;
}
