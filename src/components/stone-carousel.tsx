"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Icon } from "./icons";

type Item = { name: string; slug: string; caption: string; images: string[] };

/**
 * Karty kamieni w JEDNYM rzędzie przesuwanym w bok:
 * telefon — przesuwanie palcem (z „zaczepianiem” na karcie, widać kawałek następnej), komputer — strzałki ← →
 * (oraz gładzik / Shift + kółko). Strzałki są wyszarzone na początku i końcu; znikają, gdy wszystko się mieści.
 */
export function StoneCarousel({ items }: { items: Item[] }) {
  const track = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: true });

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const update = () => setEdges({ start: el.scrollLeft <= 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
    update();
    el.addEventListener("scroll", update, { passive: true });
    const resize = new ResizeObserver(update);
    resize.observe(el);
    return () => { el.removeEventListener("scroll", update); resize.disconnect(); };
  }, [items.length]);

  function scrollByCard(direction: 1 | -1) {
    const el = track.current;
    const card = el?.querySelector<HTMLElement>(".stone-card");
    if (!el || !card) return;
    const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
    el.scrollBy({ left: direction * (card.offsetWidth + gap), behavior: "smooth" });
  }

  const scrollable = !(edges.start && edges.end);
  return <div className="stone-carousel">
    <div className="stone-track" ref={track} role="group" aria-label="Kamienie naturalne">
      {items.map((item) => <Link className="stone-card" key={item.slug} href={`/kamienie/${item.slug}`}>
        <span className="stone-image"><img src={item.images[0] || "/images/necklace-jasper.svg"} alt={`Kamień naturalny — ${item.name}`} loading="lazy" draggable={false}/><span><Icon name="arrow" size={22}/></span></span>
        <h3>{item.name}</h3>{item.caption && <p>{item.caption}</p>}
      </Link>)}
    </div>
    {scrollable && <div className="stone-carousel-nav">
      <button type="button" className="stone-arrow" onClick={() => scrollByCard(-1)} disabled={edges.start} aria-label="Poprzednie kamienie"><Icon name="arrow-left" size={20}/></button>
      <button type="button" className="stone-arrow" onClick={() => scrollByCard(1)} disabled={edges.end} aria-label="Następne kamienie"><Icon name="arrow" size={20}/></button>
    </div>}
  </div>;
}
