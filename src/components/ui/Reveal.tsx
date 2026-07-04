"use client";

import { useEffect, useRef } from "react";

/**
 * Появление контента при попадании в вьюпорт (IntersectionObserver).
 * variant="stagger" анимирует детей по очереди — для сеток карточек.
 */
export function Reveal({
  children,
  variant = "block",
  className = "",
  as: Tag = "div",
}: {
  children: React.ReactNode;
  variant?: "block" | "stagger";
  className?: string;
  as?: "div" | "section" | "ul";
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -30px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <Tag ref={ref as any} className={`${variant === "stagger" ? "stagger" : "reveal"} ${className}`}>
      {children}
    </Tag>
  );
}
