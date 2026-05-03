"use client";

import { useEffect, useRef, useState } from "react";

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  format?: (n: number) => string;
  className?: string;
}

export function AnimatedNumber({ value, duration = 700, format, className }: AnimatedNumberProps) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);
  const prevValue = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          runAnimation(0, value);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (started.current && value !== prevValue.current) {
      runAnimation(prevValue.current, value);
    }
    prevValue.current = value;
  }, [value]);

  function runAnimation(from: number, to: number) {
    const start = performance.now();
    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  const formatted = format ? format(display) : display.toLocaleString();

  return <span ref={ref} className={className}>{formatted}</span>;
}
