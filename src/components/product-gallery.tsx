"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "./icons";

/**
 * Galeria w karcie produktu: zdjęcia przesuwane palcem (przewijanie z „zaczepianiem”), kropki, strzałki (komputer).
 * Każde zdjęcie jest pokazane W CAŁOŚCI; wolne miejsce w ramce wypełnia to samo zdjęcie — rozmyte (zamiast pustych pasów).
 */
function Slide({ src, alt, eager }: { src: string; alt: string; eager?: boolean }) {
  return <div className="pd-slide">
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img className="pd-blur" src={src} alt="" aria-hidden="true" loading={eager ? "eager" : "lazy"} draggable={false}/>
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img className="pd-img" src={src} alt={alt} loading={eager ? "eager" : "lazy"} draggable={false}/>
  </div>;
}

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

  if (images.length < 2) return <div className="pd-gallery pd-single-wrap"><Slide src={images[0]} alt={alt} eager/></div>;
  return <div className="pd-gallery" role="group" aria-roledescription="galeria" aria-label={`Zdjęcia: ${alt}`}>
    <div className="pd-track" ref={track}>
      {images.map((src, i) => <Slide key={src} src={src} alt={`${alt} — zdjęcie ${i + 1} z ${images.length}`} eager={i === 0}/>)}
    </div>
    <button type="button" className="pd-nav prev" onClick={() => go(index - 1)} aria-label="Poprzednie zdjęcie"><Icon name="arrow-left" size={18}/></button>
    <button type="button" className="pd-nav next" onClick={() => go(index + 1)} aria-label="Następne zdjęcie"><Icon name="arrow" size={18}/></button>
    <div className="pd-dots">{images.map((src, i) => <button key={src} type="button" className={i === index ? "active" : ""} aria-label={`Zdjęcie ${i + 1}`} aria-current={i === index || undefined} onClick={() => go(i)}/>)}</div>
  </div>;
}
