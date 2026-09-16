import React, { useEffect, useRef, useState } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { Header, ReservationContext } from "./components";
import { Method, NotFound, Projects } from "./pages";
import MentorPage from './mentor-page';
import EducationHome from './education-home';
import CourseCatalog from './course-catalog';
import InquiryForm from './inquiry-form';

const titles = {
  "/": "首页",
  "/courses": "教育理念与课程",
  "/method": "教学方法",
  "/mentors": "导师团队",
  "/projects": "作品展示",
};
export default function App() {
  const [reservation, setReservation] = useState(false);
  const location = useLocation();
  const previousPath = useRef(null);
  useEffect(() => {
    document.title = `${titles[location.pathname] || (location.pathname.startsWith('/courses/') ? '课程详情' : '页面未找到')} · VIBE CODING 少儿创造力实验室`;
    if (location.hash) {
      requestAnimationFrame(() =>
        document
          .getElementById(decodeURIComponent(location.hash.slice(1)))
          ?.scrollIntoView({ behavior: "instant", block: "start" }),
      );
    } else if (previousPath.current !== location.pathname)
      window.scrollTo({ top: 0, behavior: "instant" });
    previousPath.current = location.pathname;
    setReservation(false);
  }, [location.pathname, location.hash]);
  return (
    <ReservationContext.Provider value={(context = {}) => setReservation(context)}>
      <a className="skip-link" href="#main-content">
        跳转到主要内容
      </a>
      <Header />
      <main id="main-content" tabIndex={-1}>
        <Routes>
          <Route path="/" element={<EducationHome />} />
          <Route path="/courses" element={<CourseCatalog />} />
          <Route path="/courses/:id" element={<CourseCatalog />} />
          <Route path="/method" element={<Method />} />
          <Route path="/mentors" element={<MentorPage />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {reservation && <InquiryForm courseId={reservation.courseId} courseTitle={reservation.courseTitle} onClose={() => setReservation(false)} />}
    </ReservationContext.Provider>
  );
}
