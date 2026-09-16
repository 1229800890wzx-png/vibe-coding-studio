import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useCourses } from './education-api';
import { Footer } from './components';
import CourseExplorer from './course-explorer';

export default function CourseCatalog() {
  const { id } = useParams();
  const { data, loading, error, reload } = useCourses();
  const course = data.find(item => item.id === id);
  return <>
    <section className={`container edu-section ${id ? 'course-detail-page' : 'course-catalog-page'}`}>
      <div className="course-catalog-heading">
        <div>
          <div className="edu-kicker">COURSES / 课程体系</div>
          <h1>{id ? (course?.title || '课程详情') : '找到起点，看见下一步。'}</h1>
          <p>{id ? (course?.description || '了解学习内容，找到适合孩子的起点。') : '从编程基础出发，理解 AI，学会用新工具创造。'}</p>
        </div>
        <p className="brand-script" lang="en">Small steps. Real understanding.</p>
      </div>
      {loading ? <p className="course-status course-status-loading" role="status">正在加载课程…</p>
        : error ? <div className="course-status course-status-error" role="alert"><p>{error}</p><button type="button" className="button button-secondary" onClick={reload}>重新加载</button></div>
        : id ? course ? <CourseExplorer courses={[course]} initialCourseId={course.id} detail />
          : <div className="course-status course-status-empty"><p>该课程暂未发布或已下架。</p><Link to="/courses">查看其他课程</Link></div>
        : data.length ? <CourseExplorer courses={data} />
          : <p className="course-status course-status-empty" role="status">课程正在准备中，欢迎咨询了解。</p>}
      {!loading && !error && (id ? course : data.length > 0) && <div className="course-catalog-closing">基础知识 · AI 新知 · 工具协作 · 项目实践</div>}
    </section>
    <Footer />
  </>;
}
