"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import type { HeroSlide } from "@/lib/hero";
import { HERO_FOCUS_POSITION as FOCUS } from "@/lib/hero-shared";

/** Zdjęcie lub film w sekcji HERO. Kadrowanie (focus) działa na telefonach, gdzie obraz jest mocno przycinany. */
export function HeroMedia({ slide }: { slide: HeroSlide }) {
  const style = { "--hero-focus": FOCUS[slide.focus] } as CSSProperties;
  const alt = `${slide.title} ${slide.titleAccent}`.trim();
  if (slide.mediaType === "video") return <HeroVideo slide={slide} style={style} label={alt}/>;
  // eslint-disable-next-line @next/next/no-img-element
  return <img className="hero-image" src={slide.mediaUrl} alt={alt} style={style} fetchPriority="high"/>;
}

function HeroVideo({ slide, style, label }: { slide: HeroSlide; style: CSSProperties; label: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    // iOS odtwarza automatycznie tylko wyciszone wideo — React nie ustawia atrybutu `muted` przy renderowaniu na serwerze.
    video.muted = true;
    video.defaultMuted = true;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => { if (reduce.matches) video.pause(); else void video.play().catch(() => { /* np. tryb oszczędzania energii — zostaje kadr startowy */ }); };
    sync();
    reduce.addEventListener("change", sync);
    return () => reduce.removeEventListener("change", sync);
  }, []);
  return <video ref={ref} className="hero-image hero-video" style={style} src={slide.mediaUrl} poster={slide.posterUrl ?? undefined}
    muted autoPlay loop playsInline preload="metadata" aria-label={label} disablePictureInPicture disableRemotePlayback/>;
}
