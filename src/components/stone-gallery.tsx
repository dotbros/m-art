"use client";

import { useRef, useState } from "react";

/** Galeria zdjęć kamienia: duże zdjęcie + miniatury; na telefonie przesuwanie palcem w bok. */
export function StoneGallery({ images, name }: { images: string[]; name: string }) {
  const [index, setIndex] = useState(0);
  const start = useRef<number | null>(null);
  const go = (i: number) => setIndex((i + images.length) % images.length);
  return <div className="stone-gallery">
    <div className="stone-gallery-main"
      onTouchStart={(e) => { start.current = e.touches.length === 1 && e.touches[0].clientX > 24 ? e.touches[0].clientX : null; }}
      onTouchEnd={(e) => { if (start.current === null || images.length < 2) return; const dx = e.changedTouches[0].clientX - start.current; start.current = null; if (Math.abs(dx) > 50) go(index + (dx < 0 ? 1 : -1)); }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img key={images[index]} src={images[index]} alt={`${name} — zdjęcie ${index + 1} z ${images.length}`}/>
      {images.length > 1 && <span className="stone-gallery-count">{index + 1} / {images.length}</span>}
    </div>
    {images.length > 1 && <div className="stone-gallery-thumbs" role="tablist" aria-label="Zdjęcia kamienia">{images.map((src, i) => <button key={src} type="button" role="tab" aria-selected={i === index} aria-label={`Zdjęcie ${i + 1}`} className={i === index ? "active" : ""} onClick={() => go(i)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" loading="lazy"/>
    </button>)}</div>}
  </div>;
}
