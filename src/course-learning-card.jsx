import React from 'react';
import { Link } from 'react-router-dom';
import { Icon } from './components';

const learningStages = {
  1: { label: '初次接触', audience: '适合初次接触编程的孩子' },
  2: { label: '动手创作', audience: '适合想动手完成项目的孩子' },
  3: { label: '持续进阶', audience: '适合希望继续完善作品的孩子' },
};

/** Keep published course content as text; stages only describe the known learning paths. */
export default function CourseLearningCard({ course, headingLevel = 'h3' }) {
  const stage = [1, 2, 3, '1', '2', '3'].includes(course.stage) ? Number(course.stage) : undefined;
  const stageInfo = stage ? learningStages[stage] : undefined;
  const Heading = ['h2', 'h3', 'h4', 'h5', 'h6'].includes(headingLevel) ? headingLevel : 'h3';
  const steps = typeof course.outline === 'string'
    ? course.outline.split(/\r?\n/).map(step => step.trim()).filter(Boolean)
    : [];

  return <article className="edu-course glass-card course-learning-card" data-glass-card data-stage={stage}>
    <div className="edu-course-body course-learning-body">
      <header className="course-learning-header">
        <span className="course-learning-stage">{stageInfo?.label || '课程介绍'}</span>
        {stageInfo && <span className="course-learning-index" aria-label={`学习阶段 ${stage}`}>
          <span aria-hidden="true">{String(stage).padStart(2, '0')}</span>
        </span>}
      </header>
      <Heading>{course.title}</Heading>
      {stageInfo && <p className="course-learning-audience">{stageInfo.audience}</p>}
      {course.description && <p className="course-learning-description">{course.description}</p>}
      <div className="course-learning-path">
        <p className="course-learning-path-title">学习内容与路径</p>
        {steps.length ? <ol className="course-learning-steps" aria-label={`${course.title}学习路径`}>
          {steps.map((step, index) => <li className="course-learning-step" key={`${index}-${step}`}>
            <span className="course-learning-step-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
            <span className="course-learning-step-text">{step}</span>
          </li>)}
        </ol> : <p className="course-learning-empty">具体课程安排可通过咨询进一步了解。</p>}
      </div>
      <Link className="course-learning-link" to={`/courses/${encodeURIComponent(course.id)}`} aria-label={`了解${course.title}课程内容`}>
        了解课程内容<Icon name="ArrowRight" size={18} aria-hidden="true" />
      </Link>
    </div>
  </article>;
}
