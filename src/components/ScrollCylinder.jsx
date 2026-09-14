import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowDown, ArrowRight, ArrowUp, List, Rotate3D } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./scroll-cylinder.css";

// Cylinder positioning adapted from David Faure's 3D Text Animation / Codrops.
// https://github.com/davidfaure/3d-text-animation-codrops/blob/master/src/cylinder/cylinder.ts
// MIT attribution and license: /licenses/3d-text-scroll-MIT.txt
gsap.registerPlugin(ScrollTrigger);

const reducedMotionQuery = "(prefers-reduced-motion: reduce)";
const numberLabel = (number) => String(number).padStart(2, "0");
const clamp = (number, min, max) => Math.min(max, Math.max(min, number));

export default function ScrollCylinder({ items = [] }) {
  const sectionRef = useRef(null);
  const viewRef = useRef(null);
  const cylinderRef = useRef(null);
  const triggerRef = useRef(null);
  const activeIndexRef = useRef(0);
  const restorePositionRef = useRef(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [motionEnabled, setMotionEnabled] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia(reducedMotionQuery).matches,
  );
  const isStatic = prefersReducedMotion || !motionEnabled || items.length < 2;
  const activeItem = items[Math.min(activeIndex, items.length - 1)];
  const spacing = Math.min(32, 180 / Math.max(items.length, 1));

  useEffect(() => {
    const media = window.matchMedia(reducedMotionQuery);
    const updatePreference = () => setPrefersReducedMotion(media.matches);
    media.addEventListener("change", updatePreference);
    return () => media.removeEventListener("change", updatePreference);
  }, []);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return undefined;

    const headerHeight = () =>
      parseFloat(getComputedStyle(section).getPropertyValue("--motion-header-height")) || 76;

    if (restorePositionRef.current) {
      restorePositionRef.current = false;
      window.scrollTo({
        top: Math.max(0, window.scrollY + section.getBoundingClientRect().top - headerHeight()),
        behavior: "instant",
      });
    }

    if (isStatic) return undefined;

    const cylinder = cylinderRef.current;
    const view = viewRef.current;
    if (!cylinder || !view) return undefined;

    let resizeFrame = 0;
    let mounted = true;
    const positionFaces = () => {
      // The front face stays at z = 0. Adjacent labels curve away around a
      // genuine cylinder instead of being flattened into a vertical slider.
      const radius = clamp(view.clientHeight * 0.65, 160, 370);
      section.style.setProperty("--sc-radius", `${radius}px`);
      gsap.set(cylinder, { z: -radius });
      cylinder.querySelectorAll("[data-sc-slot]").forEach((face) => {
        const angle = Number(face.dataset.scSlot) * spacing;
        const radians = (angle * Math.PI) / 180;
        face.style.transform = `translate(-50%, -50%) translate3d(0, ${Math.sin(radians) * radius}px, ${Math.cos(radians) * radius}px) rotateX(${-angle}deg)`;
      });
    };

    const context = gsap.context(() => {
      positionFaces();
      const animation = gsap.fromTo(
        cylinder,
        { rotationX: 0 },
        {
          rotationX: (items.length - 1) * spacing,
          ease: "none",
          onUpdate: () => {
            const rotation = Number(gsap.getProperty(cylinder, "rotationX"));
            const nextIndex = clamp(Math.round(rotation / spacing), 0, items.length - 1);
            if (nextIndex !== activeIndexRef.current) {
              activeIndexRef.current = nextIndex;
              setActiveIndex(nextIndex);
            }
          },
        },
      );

      triggerRef.current = ScrollTrigger.create({
        trigger: section,
        start: () => `top top+=${headerHeight()}`,
        end: "bottom bottom",
        animation,
        scrub: 0.65,
        invalidateOnRefresh: true,
      });
    }, section);

    const resize = () => {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(() => {
        if (!mounted) return;
        positionFaces();
        triggerRef.current?.refresh();
      });
    };
    const observer = new ResizeObserver(resize);
    observer.observe(view);
    window.addEventListener("resize", resize);
    // A late font load can alter the surrounding page and trigger positions.
    document.fonts?.ready.then(() => mounted && resize());

    return () => {
      mounted = false;
      cancelAnimationFrame(resizeFrame);
      observer.disconnect();
      window.removeEventListener("resize", resize);
      triggerRef.current?.kill();
      triggerRef.current = null;
      context.revert();
      section.style.removeProperty("--sc-radius");
    };
  }, [isStatic, items, spacing]);

  function goToItem(index) {
    const trigger = triggerRef.current;
    if (!trigger || isStatic) return;
    const nextIndex = clamp(index, 0, items.length - 1);
    window.scrollTo({
      top: trigger.start + (nextIndex / (items.length - 1)) * (trigger.end - trigger.start),
      behavior: "smooth",
    });
  }

  function toggleMotion() {
    if (prefersReducedMotion) return;
    restorePositionRef.current = true;
    setMotionEnabled((enabled) => !enabled);
  }

  if (!activeItem) return null;

  // Continue the end labels around the cylinder so its first and last stops
  // still have visible curvature. These decorative copies are aria-hidden.
  const faces = Array.from({ length: items.length + 4 }, (_, index) => {
    const slot = index - 2;
    const itemIndex = ((slot % items.length) + items.length) % items.length;
    return { slot, itemIndex, item: items[itemIndex] };
  });

  return (
    <section
      ref={sectionRef}
      className={`sc-experience ${isStatic ? "sc-experience--static" : "sc-experience--motion"}`}
      aria-label="探索你的创作方向"
      data-active-index={activeIndex}
      data-motion-mode={isStatic ? "static" : "scroll"}
    >
      <div className="sc-stage" data-testid="scroll-cylinder-stage">
        <div className="sc-stage-top">
          <p className="sc-kicker">每一种好奇，都有一个方向。</p>
          <button
            className="sc-mode-switch"
            type="button"
            onClick={toggleMotion}
            disabled={prefersReducedMotion || items.length < 2}
            aria-describedby={prefersReducedMotion ? "sc-reduced-motion-note" : undefined}
          >
            {isStatic ? <Rotate3D size={15} /> : <List size={15} />}
            {isStatic ? "开启滚动动效" : "切换为静态浏览"}
          </button>
        </div>

        {isStatic ? (
          <>
            {prefersReducedMotion && (
              <p className="sc-reduced-motion-note" id="sc-reduced-motion-note">
                已按照你的系统偏好减少动态效果。
              </p>
            )}
            <ol className="sc-static-list">
              {items.map((item, index) => (
                <li className="sc-static-item" key={item.id}>
                  <span className="sc-static-number">{numberLabel(index + 1)}</span>
                  <div className="sc-static-heading">
                    <h2>{item.label}</h2>
                    <p className="sc-static-english" lang="en">{item.english}</p>
                  </div>
                  <div className="sc-static-copy">
                    <p>{item.description}</p>
                    <Link className="sc-project-link" to={item.href} aria-label={`看看${item.label}作品`}>
                      看看这类作品 <ArrowRight size={17} />
                    </Link>
                  </div>
                </li>
              ))}
            </ol>
          </>
        ) : (
          <>
            <div className="sc-cylinder-view" ref={viewRef} aria-hidden="true">
              <div className="sc-axis" />
              <span className="sc-side-label">IDEAS INTO REALITY</span>
              <div className="sc-perspective">
                <div className="sc-cylinder" ref={cylinderRef}>
                  {faces.map(({ slot, itemIndex, item }) => (
                    <div
                      key={slot}
                      className={`sc-face${itemIndex === activeIndex ? " sc-face--active" : ""}`}
                      data-sc-slot={slot}
                    >
                      {item.label}
                    </div>
                  ))}
                </div>
              </div>
              <span className="sc-side-count">{numberLabel(activeIndex + 1)} / {numberLabel(items.length)}</span>
            </div>

            <div className="sc-stage-bottom">
              <div className="sc-details">
                <div className="sc-active-heading">
                  <span className="sc-eyebrow">方向 {numberLabel(activeIndex + 1)} / {numberLabel(items.length)}</span>
                  <h2 className="sc-active-english" lang="en">{activeItem.english}</h2>
                </div>
                <div className="sc-active-copy">
                  <p>{activeItem.description}</p>
                  <Link className="sc-project-link" to={activeItem.href} aria-label={`看看${activeItem.label}作品`}>
                    看看这类作品 <ArrowRight size={17} />
                  </Link>
                </div>
              </div>
              <div className="sc-controls">
                <p className="sc-scroll-hint"><ArrowDown size={15} /> 向下滚动，发现更多可能</p>
                <div className="sc-stops" aria-label="选择创作方向">
                  {items.map((item, index) => (
                    <button
                      className={`sc-stop${index === activeIndex ? " sc-stop--active" : ""}`}
                      key={item.id}
                      type="button"
                      onClick={() => goToItem(index)}
                      aria-label={`第 ${index + 1} 个方向：${item.label}`}
                      aria-current={index === activeIndex ? "step" : undefined}
                    ><span /></button>
                  ))}
                </div>
                <div className="sc-step-controls">
                  <button type="button" onClick={() => goToItem(activeIndex - 1)} disabled={activeIndex === 0} aria-label="上一个创作方向">
                    <ArrowUp size={19} />
                  </button>
                  <button type="button" onClick={() => goToItem(activeIndex + 1)} disabled={activeIndex === items.length - 1} aria-label="下一个创作方向">
                    <ArrowDown size={19} />
                  </button>
                </div>
              </div>
              <span className="sc-sr-only" aria-live="polite" aria-atomic="true">
                {activeIndex + 1} / {items.length}，{activeItem.label}。{activeItem.description}
              </span>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
