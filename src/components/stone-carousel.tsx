"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "./icons";

type Item = { name: string; slug: string; caption: string; images: string[] };

/**
 * Karty kamieni w JEDNYM rzędzie, przewijane BEZ KOŃCA (po ostatnim kamieniu — pierwszy):
 * telefon — palcem (z „zaczepianiem” na karcie), komputer — strzałki ← → i gładzik.
 *
 * Jak działa pętla: lista jest powielona 3× [kopia | oryginał | kopia]. Po zatrzymaniu przewijania, gdy widok
 * wejdzie w kopię, przeskakujemy niewidocznie o długość jednej listy do oryginału. Kopie są ukryte przed
 * czytnikami ekranu i klawiaturą. Gdy wszystkie karty się mieszczą — zwykły rząd bez strzałek.
 */
export function StoneCarousel({ items }: { items: Item[] }) {
  const track = useRef<HTMLDivElement>(null);
  const [loop, setLoop] = useState(false);
  const settle = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Szerokość jednej pełnej listy (odległość między początkiem oryginału a początkiem następnej kopii). */
  const setWidth = useCallback(() => {
    const el = track.current;
    const cards = el?.querySelectorAll<HTMLElement>(".stone-card");
    if (!el || !cards || cards.length < items.length * 2) return 0;
    return cards[items.length].offsetLeft - cards[0].offsetLeft;
  }, [items.length]);

  // Czy karty się nie mieszczą (wtedy pętla + strzałki)?
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const check = () => {
      const card = el.querySelector<HTMLElement>(".stone-card");
      const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
      setLoop(!!card && items.length > 1 && items.length * (card.offsetWidth + gap) - gap > el.clientWidth + 4);
    };
    check();
    const resize = new ResizeObserver(check);
    resize.observe(el);
    return () => resize.disconnect();
  }, [items.length]);

  // Start w środkowej kopii (oryginale).
  useEffect(() => {
    const el = track.current;
    if (!loop || !el) return;
    const w = setWidth();
    if (w) el.scrollLeft = w;
  }, [loop, setWidth]);

  const recenter = useCallback(() => {
    const el = track.current;
    const w = setWidth();
    if (!el || !w) return;
    let target = el.scrollLeft;
    if (el.scrollLeft < w * 0.5) target += w;
    else if (el.scrollLeft >= w * 1.5) target -= w;
    if (target === el.scrollLeft) return;
    el.style.scrollSnapType = "none"; // przeskok bez animacji i bez „dociągania”
    el.scrollLeft = target;
    requestAnimationFrame(() => { el.style.scrollSnapType = ""; });
  }, [setWidth]);

  useEffect(() => {
    const el = track.current;
    if (!loop || !el) return;
    const onScroll = () => { if (settle.current) clearTimeout(settle.current); settle.current = setTimeout(recenter, 140); };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => { el.removeEventListener("scroll", onScroll); if (settle.current) clearTimeout(settle.current); };
  }, [loop, recenter]);

  function scrollByCard(direction: 1 | -1) {
    const el = track.current;
    const card = el?.querySelector<HTMLElement>(".stone-card");
    if (!el || !card) return;
    const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
    el.scrollBy({ left: direction * (card.offsetWidth + gap), behavior: "smooth" });
  }

  const copies = loop ? [0, 1, 2] : [1];
  return <div className="stone-carousel">
    <div className="stone-track" ref={track} role="group" aria-label="Kamienie naturalne">
      {copies.flatMap((copy) => items.map((item) => {
        const clone = copy !== 1;
        return <Link className="stone-card" key={`${copy}-${item.slug}`} href={`/kamienie/${item.slug}`} aria-hidden={clone || undefined} tabIndex={clone ? -1 : undefined} data-clone={clone || undefined}>
          <span className="stone-image"><img src={item.images[0] || "/images/necklace-jasper.svg"} alt={clone ? "" : `Kamień naturalny — ${item.name}`} loading="lazy" draggable={false}/><span><Icon name="arrow" size={22}/></span></span>
          <h3>{item.name}</h3>{item.caption && <p>{item.caption}</p>}
        </Link>;
      }))}
    </div>
    {loop && <div className="stone-carousel-nav">
      <button type="button" className="stone-arrow" onClick={() => scrollByCard(-1)} aria-label="Poprzednie kamienie"><Icon name="arrow-left" size={20}/></button>
      <button type="button" className="stone-arrow" onClick={() => scrollByCard(1)} aria-label="Następne kamienie"><Icon name="arrow" size={20}/></button>
    </div>}
  </div>;
}
