/**
 * useFadeIn — Intersection Observer hook for scroll reveal animations.
 *
 * Returns a ref to attach to any element. The element fades in
 * when it enters the viewport (once).
 *
 * Usage:
 *   const ref = useFadeIn();
 *   <div ref={ref} className="fade-section"> ... </div>
 *
 * CSS is injected once via <style> tag.
 */
import { useCallback, useEffect, useRef, useState } from "react";

// ── Global CSS injection (once) ──
let injected = false;
function injectCSS() {
  if (injected || typeof document === "undefined") return;
  injected = true;
  const style = document.createElement("style");
  style.textContent = `
    html {
      scroll-behavior: smooth;
    }
    .fade-section {
      opacity: 0;
      transform: translateY(32px);
      transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1),
                  transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .fade-section.visible {
      opacity: 1;
      transform: translateY(0);
    }
    @keyframes pulse-glow {
      0%, 100% { opacity: 0.4; }
      50% { opacity: 0.7; }
    }
    .animate-pulse-glow {
      animation: pulse-glow 4s ease-in-out infinite;
    }
    @keyframes gradient-shift {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    .animate-gradient {
      background-size: 200% 200%;
      animation: gradient-shift 6s ease infinite;
    }
    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-8px); }
    }
    .animate-float {
      animation: float 6s ease-in-out infinite;
    }
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    .animate-shimmer {
      background: linear-gradient(90deg, transparent 0%, rgba(245,158,11,0.06) 50%, transparent 100%);
      background-size: 200% 100%;
      animation: shimmer 3s ease-in-out infinite;
    }
  `;
  document.head.appendChild(style);
}

export function useFadeIn<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    injectCSS();
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("visible");
          observer.unobserve(el);
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -60px 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return ref;
}

/** Hook: animates a number from 0 to target when element is visible */
export function useCountUp(target: number, duration = 1800) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  const animate = useCallback(() => {
    if (started.current) return;
    started.current = true;
    const start = performance.now();
    const step = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);

  useEffect(() => {
    injectCSS();
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          animate();
          observer.unobserve(el);
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [animate]);

  return { ref, value };
}

/** Hook: scroll-aware navbar visibility */
export function useScrollNavbar() {
  const [visible, setVisible] = useState(true);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let lastY = 0;
    const onScroll = () => {
      const y = window.scrollY;
      setVisible(y < 80 || y < lastY);
      setScrolled(y > 20);
      lastY = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return { visible, scrolled };
}
