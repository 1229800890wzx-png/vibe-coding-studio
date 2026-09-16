import { useEffect } from 'react';

/** Decorative surface feedback; navigation, touch and keyboard never depend on it. */
export default function SurfaceMotion() {
  useEffect(() => {
    const pointer = matchMedia('(hover: hover) and (pointer: fine)');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const styles = ['--glass-lift', '--glass-rx', '--glass-ry', '--glass-x', '--glass-y'];
    let active = null, bounds = null, frame = 0, position = null;
    const clear = () => {
      cancelAnimationFrame(frame); frame = 0;
      if (active) {
        styles.forEach(name => active.style.removeProperty(name));
        active.removeAttribute('data-glass-active');
      }
      active = null; bounds = null; position = null;
    };
    const paint = () => {
      frame = 0;
      if (!active?.isConnected || !position || !bounds) { clear(); return; }
      const x = Math.min(1, Math.max(0, (position.x - bounds.left) / bounds.width));
      const y = Math.min(1, Math.max(0, (position.y - bounds.top) / bounds.height));
      active.style.setProperty('--glass-x', `${(x * 100).toFixed(1)}%`);
      active.style.setProperty('--glass-y', `${(y * 100).toFixed(1)}%`);
      active.style.setProperty('--glass-rx', `${((.5 - y) * 1.6).toFixed(2)}deg`);
      active.style.setProperty('--glass-ry', `${((x - .5) * 2).toFixed(2)}deg`);
      active.style.setProperty('--glass-lift', '-6px');
      active.setAttribute('data-glass-active', '');
    };
    const move = event => {
      if (!pointer.matches || reduced.matches || event.pointerType === 'touch') return;
      const card = event.target instanceof Element ? event.target.closest('[data-glass-card]') : null;
      if (!card) { clear(); return; }
      if (card !== active) { clear(); active = card; bounds = card.getBoundingClientRect(); }
      position = { x: event.clientX, y: event.clientY };
      if (!frame) frame = requestAnimationFrame(paint);
    };
    const leave = event => { if (active && !(event.relatedTarget instanceof Node && active.contains(event.relatedTarget))) clear(); };
    const keyboard = event => {
      if (event.key === 'Tab') { document.documentElement.classList.add('keyboard-navigation'); clear(); }
    };
    const pointerDown = () => document.documentElement.classList.remove('keyboard-navigation');
    const visibility = () => { if (document.hidden) clear(); };
    document.addEventListener('pointermove', move, { passive: true });
    document.addEventListener('pointerout', leave, { passive: true });
    document.addEventListener('keydown', keyboard);
    document.addEventListener('pointerdown', pointerDown, { passive: true });
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('scroll', clear, { passive: true, capture: true });
    window.addEventListener('resize', clear, { passive: true });
    pointer.addEventListener('change', clear); reduced.addEventListener('change', clear);
    return () => {
      clear();
      document.removeEventListener('pointermove', move); document.removeEventListener('pointerout', leave);
      document.removeEventListener('keydown', keyboard); document.removeEventListener('pointerdown', pointerDown);
      document.removeEventListener('visibilitychange', visibility);
      window.removeEventListener('scroll', clear, true); window.removeEventListener('resize', clear);
      pointer.removeEventListener('change', clear); reduced.removeEventListener('change', clear);
      document.documentElement.classList.remove('keyboard-navigation');
    };
  }, []);
  return null;
}
