import React, { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Route, Routes, useLocation, useMatch } from "react-router-dom";
import { Header, Reservation, ReservationContext } from "./components";
import { Courses, Home, Mentors, Method, NotFound, Projects } from "./pages";
import { WebsiteContentProvider, WebsiteServiceAnchor } from './website-content';

const MotionPreview = lazy(() => import("./MotionPreview"));

const titles = {
  "/": "首页",
  "/courses": "教育理念与课程",
  "/method": "教学方法",
  "/mentors": "导师团队",
  "/projects": "作品展示",
  "/experiments/scroll-text": "创造力方向 · 动效体验",
};
export default function App() {
  const [reservation, setReservation] = useState(false);
  const location = useLocation();
  const isMotionPreview = Boolean(useMatch("/experiments/scroll-text"));
  const previousPath = useRef(null);
  useEffect(() => {
    document.title = `${isMotionPreview ? titles["/experiments/scroll-text"] : titles[location.pathname] || "页面未找到"} · VIBE CODING 少儿创造力实验室`;
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
  }, [location.pathname, location.hash, isMotionPreview]);
  return (
    <WebsiteContentProvider>
    <WebsiteServiceAnchor />
    <ReservationContext.Provider value={() => setReservation(true)}>
      <a className="skip-link" href="#main-content">
        跳转到主要内容
      </a>
      {!isMotionPreview && <Header />}
      <main id="main-content" tabIndex={-1}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/method" element={<Method />} />
          <Route path="/mentors" element={<Mentors />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/experiments/scroll-text" element={
            <Suspense fallback={<p style={{ padding: "100px 24px", minHeight: "100vh" }}>正在打开创作空间…</p>}>
              <MotionPreview />
            </Suspense>
          } />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {reservation && <Reservation onClose={() => setReservation(false)} />}
    </ReservationContext.Provider>
    </WebsiteContentProvider>
  );
}
