import React, {useState} from 'react';
import {Icon} from './components';
import {GameExperience} from './game-experiences';
import {ProductExperience} from './product-experiences';
import {showcaseProjects} from './showcase-content';

export function ShowcaseImage({id, thumbnail=true, className='', priority=false, alt}) {
 const [failed,setFailed]=useState(false);
 const [attempt,setAttempt]=useState(0);
 const project=showcaseProjects.find(p=>p.id===id);
 const imageName=thumbnail?`${id}-thumb`:id==='mono'?'headphones':id;
 return <div className={`showcase-image ${className}`}>
  {failed?<div className="showcase-image-error"><Icon name="ImageOff"/><span>图片加载失败</span><button type="button" onClick={e=>{e.preventDefault();e.stopPropagation();setFailed(false);setAttempt(n=>n+1)}}>重新加载</button></div>:
   <img src={`/art/showcase/${imageName}.webp${attempt?'?retry='+attempt:''}`} alt={alt||project?.title||'作品预览'} loading={priority?'eager':'lazy'} decoding="async" onError={()=>setFailed(true)}/>}
 </div>;
}
export function ShowcaseExperience({id}) {
 if(['minecraft','museum','tower'].includes(id))return <GameExperience id={id}/>;
 if(['mono','notes'].includes(id))return <ProductExperience id={id}/>;
 return null;
}
