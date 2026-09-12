import React,{useEffect,useRef,useState} from 'react';
import {Link} from 'react-router-dom';
import {Art,Icon} from './components';
import {ShowcaseImage} from './showcase';
import {featuredProjects,showcaseSlides} from './showcase-content';

function SlideArtwork({slide}) {
 if(slide.id==='notes')return <div className="tablet-notes-art"><div className="tablet-notes-brand"><Icon name="BookOpen"/><strong>拾页</strong><span>学习资料助手</span></div><div className="tablet-notes-columns"><div><small>原始资料 / 科学阅读</small><h3>光合作用</h3><p>植物怎样把一束光，<br/>变成生长所需的能量？</p><div className="tablet-source-lines"><i/><i/><i/></div></div><div><small>我的知识卡</small><h3>光越强，就长得越快吗？</h3><p>回到原文，找到依据。<br/>再记成自己的话。</p><span className="tablet-source-tag">来源 03 ↗</span></div></div></div>;
 return <ShowcaseImage id={slide.id} thumbnail={false} priority/>;
}

export function ShowcaseTablet({gallery=false}) {
 const [index,setIndex]=useState(0);
 const [playing,setPlaying]=useState(()=>!window.matchMedia('(prefers-reduced-motion: reduce)').matches);
 const [reduced,setReduced]=useState(()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches);
 const [hovered,setHovered]=useState(false);
 const [focused,setFocused]=useState(false);
 const [visible,setVisible]=useState(true);
 const [pageVisible,setPageVisible]=useState(!document.hidden);
 const screen=useRef(null),touch=useRef(null),swiped=useRef(false);
 const total=showcaseSlides.length;
 const slide=showcaseSlides[index];
 useEffect(()=>{const media=window.matchMedia('(prefers-reduced-motion: reduce)');const change=()=>{setReduced(media.matches);if(media.matches)setPlaying(false)};media.addEventListener('change',change);return()=>media.removeEventListener('change',change)},[]);
 useEffect(()=>{const change=()=>setPageVisible(!document.hidden);document.addEventListener('visibilitychange',change);const observer=new IntersectionObserver(entries=>setVisible(entries[0].isIntersecting),{threshold:.2});if(screen.current)observer.observe(screen.current);return()=>{document.removeEventListener('visibilitychange',change);observer.disconnect()}},[]);
 useEffect(()=>{if(gallery||!playing||reduced||hovered||focused||!visible||!pageVisible)return;const timer=setInterval(()=>{if(!document.querySelector('dialog[open]'))setIndex(n=>(n+1)%total)},6500);return()=>clearInterval(timer)},[gallery,playing,reduced,hovered,focused,visible,pageVisible,total]);
 const go=n=>{setIndex((n+total)%total);setPlaying(false)};
 return <div className="desk-stage refined-desk">
  <Art source="photo-hero" rect={[1170,145,366,317]} className="desk-plant-top"/>
  <Art source="photo-hero" rect={[0,462,1536,562]} className="desk-art" alt="真实摄影质感的白色书桌、陶瓷笔筒、植物与银色平板" priority/>
  <section ref={screen} className={`tablet-screen refined-screen ${gallery?'gallery-screen':''}`} aria-label={gallery?'创作示例精选':'平板作品轮播'} aria-roledescription={gallery?undefined:'轮播'} onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)} onFocusCapture={()=>setFocused(true)} onBlurCapture={e=>{if(!e.currentTarget.contains(e.relatedTarget))setFocused(false)}} onKeyDown={e=>{if(gallery||e.target.closest('input,textarea,select,[contenteditable]'))return;if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();go(index+(e.key==='ArrowRight'?1:-1))}}} onTouchStart={e=>{touch.current={x:e.touches[0].clientX,y:e.touches[0].clientY};swiped.current=false}} onTouchEnd={e=>{if(!touch.current||gallery)return;const dx=e.changedTouches[0].clientX-touch.current.x,dy=e.changedTouches[0].clientY-touch.current.y;if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)&&!e.target.closest('button,input')){go(index+(dx<0?1:-1));swiped.current=true}touch.current=null}} onClickCapture={e=>{if(swiped.current){e.preventDefault();swiped.current=false}}}>
  {gallery?<div className="tablet-gallery showcase-tablet-gallery">{featuredProjects.map(p=><Link key={p.id} to={`/projects?project=${p.id}#gallery`} aria-label={`查看${p.title}`}><ShowcaseImage id={p.id} priority/><span>{p.title}<Icon name="ArrowRight" size={16}/></span></Link>)}</div>:<>
   <Link key={slide.id} to={`/projects?project=${slide.id}#gallery`} className={`showcase-slide showcase-slide-${slide.id}`} role="group" aria-roledescription="幻灯片" aria-label={`${index+1} / ${total}：${slide.label}，${slide.action}`}>
    <SlideArtwork slide={slide}/><div className="showcase-slide-copy"><span>{slide.eyebrow}</span><h2>{slide.title}</h2><span className="showcase-slide-action">{slide.action}<Icon name="ArrowRight" size={16}/></span></div>
   </Link>
   <div className="carousel-controls refined-controls"><button type="button" className="carousel-arrow" aria-label="上一个作品" onClick={()=>go(index-1)}><Icon name="ChevronLeft" size={18}/></button><div className="carousel-categories" role="group" aria-label="选择作品类型">{showcaseSlides.map((s,i)=><button key={s.id} type="button" aria-pressed={index===i} onClick={()=>go(i)}><Icon name={s.icon} size={16}/><span>{s.label}</span></button>)}</div><span className="mobile-category">{slide.label}</span><span className="carousel-count" aria-live={playing?'off':'polite'}>0{index+1}<span> / 0{total}</span></span><button type="button" className="carousel-arrow" aria-label="下一个作品" onClick={()=>go(index+1)}><Icon name="ChevronRight" size={18}/></button><button type="button" className="carousel-play" disabled={reduced} aria-label={playing?'暂停自动轮播':reduced?'已按系统偏好停用自动轮播':'开始自动轮播'} aria-pressed={playing} onClick={()=>{setPlaying(p=>!p);setFocused(false);setHovered(false)}}><Icon name={playing?'Pause':'Play'} size={16}/></button></div>
  </>}
  </section>
 </div>;
}
