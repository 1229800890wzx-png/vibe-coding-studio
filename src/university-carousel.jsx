import React, { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import './university-carousel.css';

const prefersReducedMotion = () => typeof window !== 'undefined'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const modulo = (value, length) => ((value % length) + length) % length;
const number = value => String(value).padStart(2, '0');

function ControlIcon({ name }) {
  const paths = {
    previous: <path d="m14 6-6 6 6 6" />,
    next: <path d="m10 6 6 6-6 6" />,
    pause: <><path d="M9 5v14" /><path d="M15 5v14" /></>,
    play: <path d="m9 5 10 7-10 7Z" />,
    external: <><path d="M7 17 17 7M7 7h10v10" /></>,
  };
  return <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function SchoolLogo({ school }) {
  const [failed, setFailed] = useState(false);
  const initials = school.english?.split(/\s+/).filter(word => !/^(of|the|and)$/i.test(word))
    .map(word => word[0]).join('').slice(0, 5).toUpperCase() || school.name;
  return <span className={`uc-logo${['wide', 'wordmark', 'landscape'].includes(school.logoShape) ? ' uc-logo-wide' : ''}`} aria-hidden="true">
    {failed || !school.logo ? <span className="uc-logo-fallback" lang="en">{initials}</span>
      : <img src={school.logo} alt="" width="176" height="104" decoding="async" onError={() => setFailed(true)} />}
  </span>;
}

/** The middle group is accessible; visual copies let either edge wrap seamlessly. */
export default function UniversityCarousel({ schools = [] }) {
  const id = useId();
  const rootRef = useRef(null);
  const trackRef = useRef(null);
  const metricsRef = useRef({ cycle: 0, step: 0 });
  const positionRef = useRef(0);
  const motionRef = useRef(null);
  const runningRef = useRef(false);
  const [looping, setLooping] = useState(schools.length > 1);
  const [reduced, setReduced] = useState(prefersReducedMotion);
  const [playing, setPlaying] = useState(() => !prefersReducedMotion());
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [moving, setMoving] = useState(false);
  const [inView, setInView] = useState(false);
  const [visible, setVisible] = useState(() => typeof document === 'undefined' || !document.hidden);
  const [announcement, setAnnouncement] = useState('');

  const writePosition = useCallback(value => {
    const track = trackRef.current;
    const { cycle } = metricsRef.current;
    if (!track || !cycle) return;
    const next = looping ? cycle + modulo(value - cycle, cycle) : 0;
    // Keep fractional pixels independently: scrollLeft can be rounded by the browser.
    positionRef.current = next;
    track.scrollLeft = next;
  }, [looping]);

  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track || !schools.length) return;
    const measure = () => {
      const originals = Array.from(track.querySelectorAll('[data-copy="0"]'));
      if (!originals.length) return;
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      const first = originals[0];
      const last = originals.at(-1);
      const width = last.getBoundingClientRect().right - first.getBoundingClientRect().left;
      const cycle = width + gap;
      const oldCycle = metricsRef.current.cycle;
      const phase = oldCycle ? modulo(positionRef.current - oldCycle, oldCycle) / oldCycle : 0;
      metricsRef.current = { cycle, step: cycle / schools.length };
      const overflow = width > track.clientWidth + 1;
      setLooping(overflow);
      motionRef.current = null;
      setMoving(false);
      writePosition(overflow ? cycle * (1 + phase) : 0);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    const onScroll = () => {
      if (runningRef.current || motionRef.current) return;
      writePosition(track.scrollLeft);
    };
    track.addEventListener('scroll', onScroll, { passive: true });
    return () => { observer.disconnect(); track.removeEventListener('scroll', onScroll); };
  }, [schools, writePosition]);

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onPreference = () => {
      setReduced(preference.matches);
      if (preference.matches) setPlaying(false);
    };
    const onVisibility = () => setVisible(!document.hidden);
    preference.addEventListener('change', onPreference);
    document.addEventListener('visibilitychange', onVisibility);
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0 });
    if (rootRef.current) observer.observe(rootRef.current);
    return () => {
      preference.removeEventListener('change', onPreference);
      document.removeEventListener('visibilitychange', onVisibility);
      observer.disconnect();
    };
  }, []);

  const running = playing && !hovered && !focused && visible && inView && looping;
  runningRef.current = running;
  useEffect(() => {
    if (!running && !moving) return;
    let frame;
    let previous = null;
    const tick = now => {
      const delta = previous === null ? 0 : Math.min(now - previous, 64);
      previous = now;
      const motion = motionRef.current;
      if (motion) {
        motion.start ??= now;
        const progress = Math.min((now - motion.start) / 380, 1);
        writePosition(motion.from + motion.distance * (1 - (1 - progress) ** 3));
        if (progress === 1) {
          motionRef.current = null;
          setMoving(false);
          const index = Math.floor(modulo(positionRef.current, metricsRef.current.cycle) / metricsRef.current.step);
          setAnnouncement(`正在浏览${schools[index]?.name || ''}，共 ${schools.length} 所学校。`);
        }
      } else if (runningRef.current) {
        const speed = trackRef.current.clientWidth < 520 ? 28 : 36;
        writePosition(positionRef.current + delta * speed / 1000);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running, moving, schools, writePosition]);

  function stopForInteraction() {
    runningRef.current = false;
    setPlaying(false);
    motionRef.current = null;
    setMoving(false);
  }

  function step(direction) {
    stopForInteraction();
    const distance = metricsRef.current.step * direction;
    if (reduced) {
      writePosition(positionRef.current + distance);
      const index = Math.floor(modulo(positionRef.current, metricsRef.current.cycle) / metricsRef.current.step);
      setAnnouncement(`正在浏览${schools[index]?.name || ''}，共 ${schools.length} 所学校。`);
    }
    else {
      motionRef.current = { from: positionRef.current, distance, start: null };
      setMoving(true);
    }
  }

  function focusSchool(index) {
    stopForInteraction();
    const item = trackRef.current.querySelector(`[data-copy="0"][data-university-index="${index}"]`);
    writePosition(metricsRef.current.cycle + metricsRef.current.step * index);
    item?.querySelector('.uc-card')?.focus({ preventScroll: true });
  }

  function onKeyDown(event) {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
      if (event.target === trackRef.current && ['PageUp', 'PageDown', ' '].includes(event.key)) stopForInteraction();
      return;
    }
    event.preventDefault();
    const current = event.target.closest('[data-university-index]');
    if (current) {
      const index = Number(current.dataset.universityIndex);
      focusSchool(event.key === 'Home' ? 0 : event.key === 'End' ? schools.length - 1
        : modulo(index + (event.key === 'ArrowRight' ? 1 : -1), schools.length));
    } else if (event.key === 'Home' || event.key === 'End') {
      stopForInteraction();
      writePosition(metricsRef.current.cycle + (event.key === 'End' ? metricsRef.current.step * (schools.length - 1) : 0));
    } else step(event.key === 'ArrowRight' ? 1 : -1);
  }

  if (!schools.length) return null;
  return <div ref={rootRef} className="university-carousel" role="region" aria-roledescription="轮播" aria-label="导师教育背景学校"
    onPointerEnter={event => { if (event.pointerType !== 'touch') setHovered(true); }} onPointerLeave={() => setHovered(false)}
    onFocusCapture={event => setFocused(Boolean(event.target.closest('.uc-track')))}
    onBlurCapture={event => setFocused(Boolean(event.relatedTarget?.closest?.('.uc-track')))} onKeyDown={onKeyDown}>
    <p className="uc-sr-only" id={`${id}-instructions`}>学校列表连续向左滚动，首尾相接。可暂停后横向滑动，也可使用左右方向键、Home 和 End。学校官网在新标签页打开。鼠标悬停或列表获得键盘焦点时暂缓，手动浏览会停止自动滚动。</p>
    <ul className="uc-track" id={`${id}-track`} ref={trackRef} tabIndex={0} aria-label={`${schools.length} 所学校官网`} aria-describedby={`${id}-instructions`}
      onPointerDown={stopForInteraction} onWheel={event => { if (Math.abs(event.deltaX) > 0 || event.shiftKey) stopForInteraction(); }}>
      {(looping ? [-1, 0, 1] : [0]).flatMap(copy => schools.map((school, index) => {
        const clone = copy !== 0;
        const linked = /^https?:\/\//i.test(school.sourceUrl || '');
        const Card = linked ? 'a' : 'article';
        return <li className="uc-item" key={`${copy}-${school.id}`} data-copy={copy} data-university-index={index} aria-hidden={clone || undefined}>
          <Card className="uc-card" href={linked ? school.sourceUrl : undefined} target={linked ? '_blank' : undefined} rel={linked ? 'noopener noreferrer' : undefined}
            tabIndex={clone || !linked ? -1 : undefined} onMouseDown={clone ? event => event.preventDefault() : undefined}
            onFocus={clone ? () => focusSchool(index) : undefined} onClick={linked ? stopForInteraction : undefined}
            aria-label={linked ? `${school.name}，${school.english}，${school.country}。学校官网，在新标签页打开` : undefined}>
            <span className="uc-card-top"><span>{school.country}</span><span className="uc-card-number" aria-hidden="true">{number(index + 1)}</span></span>
            <SchoolLogo key={school.logo} school={school} />
            <span className="uc-school-name">{school.name}</span><span className="uc-school-english" lang="en">{school.english}</span>
            {linked && <span className="uc-source">学校官网<ControlIcon name="external" /></span>}
          </Card>
        </li>;
      }))}
    </ul>
    <div className="uc-controls">
      <div className="uc-position"><span className="uc-count"><strong>{number(schools.length)}</strong><span> 所学府</span></span><span className="uc-rule" aria-hidden="true" /><span className="uc-status">{playing ? running ? '缓缓流动，让视野相连' : '停一停，认识这所学校' : '左右滑动，认识更多学校'}</span></div>
      <div className="uc-actions">
        <button className="uc-arrow" type="button" aria-label="向左浏览学校" aria-controls={`${id}-track`} disabled={!looping} onClick={() => step(-1)}><ControlIcon name="previous" /></button>
        <button className="uc-arrow" type="button" aria-label="向右浏览学校" aria-controls={`${id}-track`} disabled={!looping} onClick={() => step(1)}><ControlIcon name="next" /></button>
        <button className="uc-play" type="button" aria-controls={`${id}-track`} disabled={!looping} aria-label={playing ? '暂停连续滚动' : '开启连续滚动'}
          onClick={() => { motionRef.current = null; setMoving(false); setPlaying(value => !value); }}>
          <ControlIcon name={playing ? 'pause' : 'play'} /><span>{playing ? '暂停' : '播放'}</span>
        </button>
      </div>
    </div>
    <span className="uc-sr-only" role="status" aria-live="polite" aria-atomic="true">{announcement}</span>
  </div>;
}
