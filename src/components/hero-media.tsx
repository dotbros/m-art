"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import type { HeroSlide } from "@/lib/hero";
import { HERO_FOCUS_POSITION as FOCUS } from "@/lib/hero-shared";
import { Icon } from "./icons";

type Sound = { on: boolean; set: (on: boolean) => void };

/** Zdjęcie lub film w sekcji HERO. Kadrowanie (focus) działa na telefonach, gdzie obraz jest mocno przycinany. */
export function HeroMedia({ slide, sound }: { slide: HeroSlide; sound: Sound }) {
  const style = { "--hero-focus": FOCUS[slide.focus] } as CSSProperties;
  const alt = `${slide.title} ${slide.titleAccent}`.trim();
  if (slide.mediaType === "video") return <HeroVideo slide={slide} style={style} label={alt} sound={sound}/>;
  // eslint-disable-next-line @next/next/no-img-element
  return <img className="hero-image" src={slide.mediaUrl} alt={alt} style={style} fetchPriority="high"/>;
}

/**
 * Film startuje WYCISZONY — przeglądarki (Safari, Chrome) pozwalają na autoodtwarzanie tylko bez dźwięku.
 * Jeśli film ma dźwięk, klient włącza go przyciskiem. Dźwięk wycisza się sam po przewinięciu strony dalej.
 */
function HeroVideo({ slide, style, label, sound }: { slide: HeroSlide; style: CSSProperties; label: string; sound: Sound }) {
  const ref = useRef<HTMLVideoElement>(null);
  const soundRef = useRef(sound);
  useEffect(() => { soundRef.current = sound; });
  const withSound = slide.hasAudio && sound.on;

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    // React nie ustawia atrybutu `muted` przy renderowaniu na serwerze — ustawiamy go ręcznie (wymóg iOS).
    video.defaultMuted = true;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => { if (reduce.matches) video.pause(); else void video.play().catch(() => { /* np. tryb oszczędzania energii — zostaje kadr startowy */ }); };
    sync();
    reduce.addEventListener("change", sync);
    // Przewinięcie poza HERO wycisza film, żeby dźwięk nie grał „w tle”.
    const observer = new IntersectionObserver(([entry]) => { if (!entry.isIntersecting && soundRef.current.on) soundRef.current.set(false); }, { threshold: 0.2 });
    observer.observe(video);
    return () => { reduce.removeEventListener("change", sync); observer.disconnect(); };
  }, []);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    video.muted = !withSound;
    if (withSound) void video.play().catch(() => { video.muted = true; soundRef.current.set(false); });
  }, [withSound]);

  return <>
    <video ref={ref} className="hero-image hero-video" style={style} src={slide.mediaUrl} poster={slide.posterUrl ?? undefined}
      muted autoPlay loop playsInline preload="metadata" aria-label={label} disablePictureInPicture disableRemotePlayback/>
    {slide.hasAudio && <button type="button" className={`hero-sound ${withSound ? "is-on" : ""}`} aria-pressed={withSound}
      aria-label={withSound ? "Wycisz film" : "Włącz dźwięk filmu"} onClick={() => sound.set(!withSound)}>
      <Icon name={withSound ? "sound-on" : "sound-off"} size={22}/>{!withSound && <span className="hero-sound-label" aria-hidden="true">Włącz dźwięk</span>}
    </button>}
  </>;
}
