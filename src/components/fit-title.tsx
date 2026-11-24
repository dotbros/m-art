"use client";

import { useLayoutEffect, useRef } from "react";

/**
 * Tytuł HERO: KAŻDA linia osobno mieści się w jednym wierszu. Linia, która się nie mieści (np. „Spokój ukryty
 * w naturze.”), dostaje mniejszą czcionkę; linia, która się mieści (np. „Ametyst.”), zostaje w pełnym rozmiarze.
 * Poniżej `minScale` linia nie maleje dalej, tylko się zawija (czytelność ważniejsza niż jeden wiersz).
 */
export function FitTitle({ title, accent, minScale = 0.55 }: { title: string; accent?: string; minScale?: number }) {
  const ref = useRef<HTMLHeadingElement>(null);

  useLayoutEffect(() => {
    const h1 = ref.current;
    if (!h1) return;
    const fit = () => {
      const available = h1.clientWidth;
      const base = parseFloat(getComputedStyle(h1).fontSize);
      for (const line of h1.querySelectorAll<HTMLElement>(".fit-line")) {
        line.style.fontSize = "";
        line.classList.remove("is-wrapping");
        const width = line.scrollWidth;
        if (!available || !width || width <= available) continue;
        const scale = (available / width) * 0.98;
        if (scale < minScale) { line.style.fontSize = `${base * minScale}px`; line.classList.add("is-wrapping"); }
        else line.style.fontSize = `${base * scale}px`;
      }
    };
    fit();
    void document.fonts?.ready.then(fit);
    const observer = new ResizeObserver(fit);
    observer.observe(h1);
    return () => observer.disconnect();
  }, [title, accent, minScale]);

  return <h1 ref={ref} className="fit-title">
    <span className="fit-line">{title}</span>
    {accent && <em className="fit-line">{accent}</em>}
  </h1>;
}
