"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "./icons";

/**
 * Galeria w karcie produktu: zdjęcia przesuwane palcem (przewijanie z „zaczepianiem”), kropki, strzałki (komputer).
 * Wypełnia ramkę `.product-detail-image` (plakietka i serce „ulubione” zostają na wierzchu).
 */
export function ProductGallery({ images, alt }: { images: string[]; alt: string }) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const onScroll = () => setIndex(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)));
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const go = (i: number) => {
    const el = track.current;
    if (!el) return;
    const next = (i + images.length) % images.length;
    el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
  };

  if (images.length < 2) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img className="pd-single" src={images[0]} alt={alt}/>;
  }
  return <div className="pd-gallery" role="group" aria-roledescription="galeria" aria-label={`Zdjęcia: ${alt}`}>
    <div className="pd-track" ref={track}>
      {images.map((src, i) => /* eslint-disable-next-line @next/next/no-img-element */
        <img key={src} src={src} alt={`${alt} — zdjęcie ${i + 1} z ${images.length}`} loading={i === 0 ? "eager" : "lazy"} draggable={false}/>)}
    </div>
    <button type="button" className="pd-nav prev" onClick={() => go(index - 1)} aria-label="Poprzednie zdjęcie"><Icon name="arrow-left" size={18}/></button>
    <button type="button" className="pd-nav next" onClick={() => go(index + 1)} aria-label="Następne zdjęcie"><Icon name="arrow" size={18}/></button>
    <div className="pd-dots">{images.map((src, i) => <button key={src} type="button" className={i === index ? "active" : ""} aria-label={`Zdjęcie ${i + 1}`} aria-current={i === index || undefined} onClick={() => go(i)}/>)}</div>
  </div>;
}
