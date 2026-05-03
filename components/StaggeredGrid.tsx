"use client";

import { useRef, type ReactNode } from "react";
import { useInView } from "@/app/hooks/useAnimations";

interface StaggeredGridProps {
  children: ReactNode[];
  className?: string;
  staggerMs?: number;
}

export function StaggeredGrid({ children, className = "", staggerMs = 60 }: StaggeredGridProps) {
  return (
    <div className={className}>
      {children.map((child, i) => (
        <StaggerItem key={i} delay={i * staggerMs}>
          {child}
        </StaggerItem>
      ))}
    </div>
  );
}

function StaggerItem({ children, delay }: { children: ReactNode; delay: number }) {
  const { ref, inView } = useInView(0.1);

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className="transition-all duration-500 ease-out"
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0) scale(1)" : "translateY(20px) scale(0.96)",
        transitionDelay: inView ? `${delay}ms` : "0ms",
      }}
    >
      {children}
    </div>
  );
}
