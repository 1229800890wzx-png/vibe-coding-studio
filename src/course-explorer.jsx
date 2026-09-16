import React, { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon, ReserveButton } from './components';
import { getCourseLessons } from './course-lessons';
import LessonExercise from './lesson-exercises';

const stages = ['初次接触', '动手创作', '持续进阶'];
const views = [['explain', '这是什么'], ['practice', '动手试试'], ['goals', '学习目标']];

/** Selection is limited to published courses supplied by the shared backend. */
export default function CourseExplorer({ courses, initialCourseId = 'create', detail = false }) {
  const [selectedId, setSelectedId] = useState(initialCourseId);
  const regionId = useId();
  const course = courses.find(item => item.id === selectedId) || courses[0];
  if (!course) return null;
  const selectCourse = next => {
    setSelectedId(next);
    if (window.matchMedia('(max-width: 650px)').matches) window.requestAnimationFrame(() => {
      const panel = document.getElementById(regionId);
      panel?.querySelector('h2')?.focus({ preventScroll: true });
      panel?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
    });
  };

  return <div className={`course-explorer${detail ? ' ce-detail' : ''}`}>
    {!detail && <div className="ce-courses" role="group" aria-label="选择要了解的课程">
      {courses.map(item => {
        const selected = item.id === course.id;
        const stage = Number(item.stage);
        return <button key={item.id} type="button" className={`ce-course glass-card${selected ? ' is-selected' : ''}`} data-glass-card
          aria-pressed={selected} aria-controls={regionId} onClick={() => selectCourse(item.id)}>
          <span className="ce-course-top"><span className="ce-stage"><span />{stages[stage - 1] || '课程介绍'}</span>
            {stages[stage - 1] && <span className="ce-number" aria-hidden="true">{String(stage).padStart(2, '0')}</span>}</span>
          <span className="ce-course-title">{item.title}</span>
          <span className="ce-course-description">{item.description}</span>
          <span className="ce-course-action">{selected ? <><span className="ce-selection-dot" />正在了解</> : '了解这一阶段'}<Icon name={selected ? 'ChevronRight' : 'ArrowRight'} size={18} /></span>
        </button>;
      })}
    </div>}
    <CourseLessonPanel key={course.id} course={course} regionId={regionId} detail={detail} />
  </div>;
}

function CourseLessonPanel({ course, regionId, detail }) {
  const curriculum = getCourseLessons(course);
  const [selectedLesson, setSelectedLesson] = useState(curriculum.defaultLessonId);
  const [view, setView] = useState('practice');
  const outline = useRef(null);
  const topicHeading = useRef(null);
  const focusTopic = useRef(false);
  const id = useId();
  const lesson = curriculum.lessons.find(item => item.id === selectedLesson) || curriculum.lessons[0];
  const availableViews = views.filter(([key]) => (key !== 'practice' || lesson?.exercise) && (key !== 'goals' || lesson?.objectives.length));
  const currentView = availableViews.some(([key]) => key === view) ? view : availableViews[0][0];
  const changeLesson = next => { setSelectedLesson(next); setView('practice'); };
  const openTopic = next => { focusTopic.current = true; changeLesson(next); };
  useEffect(() => {
    if (!focusTopic.current) return;
    focusTopic.current = false;
    topicHeading.current?.focus({ preventScroll: true });
    topicHeading.current?.scrollIntoView({ behavior: 'instant', block: 'nearest' });
  }, [lesson?.id]);
  const showOutline = () => {
    if (!outline.current) return;
    outline.current.open = true;
    outline.current.scrollIntoView({ behavior: 'instant', block: 'center' });
    outline.current.querySelector('summary')?.focus({ preventScroll: true });
  };
  const tabKeyDown = (event, index) => {
    let next;
    if (event.key === 'ArrowRight') next = (index + 1) % availableViews.length;
    if (event.key === 'ArrowLeft') next = (index + availableViews.length - 1) % availableViews.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = availableViews.length - 1;
    if (next === undefined) return;
    event.preventDefault();
    setView(availableViews[next][0]);
    event.currentTarget.parentElement.querySelectorAll('[role="tab"]')[next]?.focus();
  };

  return <section className="ce-panel" id={regionId} aria-labelledby={`${id}-title`}>
    <div className="ce-panel-header"><div><p className="ce-eyebrow">{course.title} · 内容预览</p>
      <div className="ce-heading-line"><h2 id={`${id}-title`} tabIndex={-1}>走进一节课</h2><span className="ce-example-label">{lesson?.exercise ? '互动示例' : '课程介绍'}</span></div></div>
      <p className="ce-header-note">先理解原理，再学会使用工具。</p></div>
    <div className="ce-layout">
      <aside className="ce-sidebar" aria-label={`${course.title}知识点`}>
        <p className="ce-sidebar-label">学习内容</p>
        <div className="ce-lessons" role="group" aria-label="选择知识点">
          {curriculum.lessons.map((item, index) => <button type="button" key={item.id} className={`ce-lesson${item.id === lesson?.id ? ' is-selected' : ''}`}
            aria-pressed={item.id === lesson?.id} aria-controls={`${id}-lesson`} onClick={() => changeLesson(item.id)}>
            <span className="ce-lesson-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
            <span><strong>{item.title}</strong><span className="ce-lesson-subtitle">{item.subtitle}</span></span>
          </button>)}
        </div>
        <button type="button" className="ce-outline-link" onClick={showOutline}>查看完整课程大纲<Icon name="ArrowUpRight" size={17} /></button>
      </aside>
      <div className="ce-lesson-content" id={`${id}-lesson`}>
        {lesson ? <>
          <header className="ce-topic-header"><h3 ref={topicHeading} tabIndex={-1}>{lesson.heading}</h3><p>{lesson.intro}</p></header>
          <div className="ce-tabs" role="tablist" aria-label="知识点内容">
            {availableViews.map(([key, label], index) => <button type="button" role="tab" id={`${id}-tab-${key}`} aria-selected={currentView === key}
              aria-controls={`${id}-tab-panel`} tabIndex={currentView === key ? 0 : -1} key={key} onClick={() => setView(key)} onKeyDown={event => tabKeyDown(event, index)}>{label}</button>)}
          </div>
          <div role="tabpanel" id={`${id}-tab-panel`} aria-labelledby={`${id}-tab-${currentView}`} className="ce-tab-panel" tabIndex={0}>
            {lesson.exercise && <div hidden={currentView !== 'practice'}><LessonExercise key={lesson.id} type={lesson.exercise} /></div>}
            {currentView === 'explain' && <div className="ce-reading" key={`${lesson.id}-explain`}><p className="ce-eyebrow">从概念到理解</p>{lesson.explanation.map((text, index) => <p key={index}>{text}</p>)}<div className="ce-concepts">{lesson.concepts.map(text => <span key={text}>{text}</span>)}</div></div>}
            {currentView === 'goals' && <div className="ce-reading" key={`${lesson.id}-goals`}><h4>试着用自己的话说清楚</h4><ul className="ce-objectives">{lesson.objectives.map(text => <li key={text}><Icon name="Check" size={17} /><span>{text}</span></li>)}</ul><p className="ce-prerequisite">{curriculum.prerequisite}</p></div>}
          </div>
          {course.id === 'create' && lesson.id === 'vibe' && <div className="ce-topic-links">
            <button type="button" onClick={() => openTopic('skill')}><strong>Skill 是什么？</strong><span>把说明、步骤与参考资源，整理成可复用的方法包。</span><span className="ce-topic-cta">体验 Skill 如何复用<Icon name="ArrowRight" size={16} /></span></button>
            <button type="button" onClick={() => openTopic('mcp')}><strong>MCP 是什么？</strong><span>让 AI 应用按统一协议，连接外部工具与数据。</span><span className="ce-topic-cta">看看工具如何连接<Icon name="ArrowRight" size={16} /></span></button>
          </div>}
        </> : <p className="ce-no-lesson">课程内容正在准备中，可咨询了解具体安排。</p>}
        <div className="ce-panel-actions"><div className="button-row">
          {!detail && <Link to={`/courses/${encodeURIComponent(course.id)}`} className="button button-primary">了解{course.title}<Icon name="ArrowRight" size={17} /></Link>}
          <ReserveButton secondary={!detail} courseId={course.courseId} courseTitle={course.title} />
          {detail && <Link to="/courses" className="button button-secondary">查看其他课程<Icon name="ArrowRight" size={17} /></Link>}
        </div><p>学会使用，也能解释为什么。</p></div>
      </div>
    </div>
    <details className="ce-outline" ref={outline} open={detail || undefined}>
      <summary>完整课程大纲<Icon name="Plus" size={18} /></summary>
      <div className="ce-outline-body"><div><h3>{course.title}</h3><p>{course.description}</p><p>{curriculum.prerequisite}</p></div>
        <ol>{(course.outline || '').split(/\r?\n/).filter(item => item.trim()).map((item, index) => <li key={index}>{item}</li>)}{!course.outline?.trim() && <li>具体课程安排可通过咨询进一步了解。</li>}</ol></div>
    </details>
  </section>;
}
