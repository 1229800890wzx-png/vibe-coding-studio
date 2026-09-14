import React from 'react';
import {Link,useParams} from 'react-router-dom';
import {useCourses} from './education-api';
import {Footer,ReserveButton} from './components';
import {ShowcaseImage} from './showcase';
export default function CourseCatalog(){
 const {id}=useParams();const {data,loading,error,reload}=useCourses();const course=data.find(c=>c.id===id);
 return <><section className="container edu-section"><div className="edu-kicker">COURSES / 课程体系</div><h1>{id?(course?.title||'课程详情'):'找到适合的学习起点'}</h1>
 {loading?<p role="status">正在加载课程…</p>:error?<div role="alert"><p>{error}</p><button className="button button-secondary" onClick={reload}>重新加载</button></div>:id?course?<div className="edu-method-grid" style={{marginTop:30}}><div><ShowcaseImage id={course.image}/></div><div><p>{course.description}</p><h2>课程内容</h2><ul>{(course.outline||'具体安排可通过咨询了解').split('\n').filter(Boolean).map((s,i)=><li key={i}>{s}</li>)}</ul><ReserveButton/><p style={{marginTop:20}}><Link to="/courses">返回全部课程</Link></p></div></div>:<div><p>该课程暂未发布或已下架。</p><Link to="/courses">查看其他课程</Link></div>:<div className="edu-course-grid" style={{marginTop:30}}>{data.length?data.map(c=><article className="edu-course" key={c.id}><Link to={'/courses/'+c.id} className="edu-course-image"><ShowcaseImage id={c.image}/></Link><div className="edu-course-body"><h2>{c.title}</h2><p>{c.description}</p><Link to={'/courses/'+c.id}>了解课程内容 →</Link></div></article>):<p>课程正在准备中，欢迎咨询了解。</p>}</div>}
 </section><Footer/></>;
}
