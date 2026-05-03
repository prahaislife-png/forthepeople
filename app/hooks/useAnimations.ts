"use client";

import { useEffect, useRef, useState } from "react";

export function useCountUp(end: number, duration = 600, startOnView = true): { ref: React.RefObject<HTMLElement | null>; value: number } {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLElement | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (!startOnView) {
      animate();
      return;
    }

    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          animate();
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [end]);

  function animate() {
    const start = performance.now();
    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * end));
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  return { ref, value };
}

export function useInView(threshold = 0.1): { ref: React.RefObject<HTMLElement | null>; inView: boolean } {
  const ref = useRef<HTMLElement | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, inView };
}

export function useScrollProgress(): number {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    function onScroll() {
      const scrolled = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? scrolled / max : 0);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return progress;
}

export function useParallax(speed = 0.3): { y: number } {
  const [y, setY] = useState(0);
  useEffect(() => {
    function onScroll() {
      setY(window.scrollY * speed);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [speed]);
  return { y };
}
