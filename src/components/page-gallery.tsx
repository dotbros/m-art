"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "./icons";

/** Galeria zdjęć podstrony: siatka miniatur; dotknięcie otwiera zdjęcie na pełnym ekranie (przesuwanie palcem, strzałki, Esc). */
export function PageGallery({ images, title }: { images: string[]; title: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const start = useRef<number | null>(null);
  const go = (dir: 1 | -1) => setOpen((i) => (i === null ? i : (i + dir + images.length) % images.length));

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(null); if (e.key === "ArrowRight") go(1); if (e.key === "ArrowLeft") go(-1); };
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = overflow; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open === null]);

  return <>
    <ul className="page-gallery">{images.map((src, i) => <li key={src}>
      <button type="button" onClick={() => setOpen(i)} aria-label={`Powiększ zdjęcie ${i + 1} z ${images.length}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={`${title} — zdjęcie ${i + 1}`} loading="lazy"/>
      </button>
    </li>)}</ul>
    {open !== null && <div className="lightbox" role="dialog" aria-modal="true" aria-label={`Zdjęcie ${open + 1} z ${images.length}`}
      onClick={(e) => { if (e.target === e.currentTarget) setOpen(null); }}
      onTouchStart={(e) => { start.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => { if (start.current === null) return; const dx = e.changedTouches[0].clientX - start.current; start.current = null; if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1); }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img key={images[open]} src={images[open]} alt={`${title} — zdjęcie ${open + 1}`}/>
      <button type="button" className="lightbox-close" onClick={() => setOpen(null)} aria-label="Zamknij"><Icon name="close"/></button>
      {images.length > 1 && <>
        <button type="button" className="lightbox-nav prev" onClick={() => go(-1)} aria-label="Poprzednie zdjęcie"><Icon name="arrow-left"/></button>
        <button type="button" className="lightbox-nav next" onClick={() => go(1)} aria-label="Następne zdjęcie"><Icon name="arrow"/></button>
        <span className="lightbox-count">{open + 1} / {images.length}</span>
      </>}
    </div>}
  </>;
}
