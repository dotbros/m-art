"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * „Czarodziejska różdżka”: zawartość (przycisk) pojawia się dopiero, gdy klientka przewinie do niej stronę —
 * nad ekranem przelatuje iskra ze smugą, rozbłyska złoty krąg i drobinki, a przycisk wyłania się z blasku.
 * Gdy przycisk jest widoczny od razu (duży ekran), czeka, aż skończy się pojawianie tekstów (minDelay).
 * Przy ustawieniu „ogranicz ruch” — od razu, bez efektów.
 */
export function MagicReveal({ children, minDelay = 0 }: { children: ReactNode; minDelay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setShown(true); return; }
    let timer: ReturnType<typeof setTimeout> | undefined;
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      // 1 s pauzy po przewinięciu — chwila oczekiwania przed „czarem”.
      timer = setTimeout(() => setShown(true), Math.max(1000, minDelay - performance.now()));
    }, { threshold: 0.75 });
    io.observe(el);
    return () => { io.disconnect(); if (timer) clearTimeout(timer); };
  }, [minDelay]);

  return (
    <div ref={ref} className={`w-magic${shown ? " is-on" : ""}`} data-shown={shown || undefined}>
      {children}
      <span className="w-wand" aria-hidden="true"><i /><i /><i /><i /><i /></span>
      <span className="w-flash" aria-hidden="true" />
      <span className="w-burst" aria-hidden="true">{Array.from({ length: 14 }, (_, i) => <i key={i} />)}</span>
    </div>
  );
}
