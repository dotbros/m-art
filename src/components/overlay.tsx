"use client";

import { useEffect, useRef, type ReactNode, type TouchEvent } from "react";
import { Icon } from "./icons";

export function Overlay({ children, title, onClose, kind = "drawer", className = "" }: { children: ReactNode; title: string; onClose: () => void; kind?: "drawer" | "modal"; className?: string }) {
  const container = useRef<HTMLElement>(null);
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; }, [onClose]);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const frame = requestAnimationFrame(() => {
      const first = container.current?.querySelector<HTMLElement>("[data-autofocus], input, button, [tabindex='0']");
      (first || container.current)?.focus();
    });
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") closeRef.current();
      if (event.key !== "Tab") return;
      const focusable = Array.from(container.current?.querySelectorAll<HTMLElement>("button:not([disabled]), a[href], input:not([disabled]), select, textarea, [tabindex='0']") || []).filter((el) => el.getClientRects().length > 0);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first) { event.preventDefault(); return; }
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    document.addEventListener("keydown", handleKey);
    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", handleKey);
      if (previous?.isConnected) previous.focus();
    };
  }, []);

  // Przeciągnięcie okna w dół (gdy treść jest przewinięta na samą górę) zamyka je — jak arkusze w aplikacjach mobilnych.
  const drag = useRef<{ startY: number; startX: number; dy: number; active: boolean } | null>(null);
  function onTouchStart(event: TouchEvent<HTMLElement>) {
    if (event.touches.length !== 1 || (container.current?.scrollTop ?? 0) > 0) { drag.current = null; return; }
    drag.current = { startY: event.touches[0].clientY, startX: event.touches[0].clientX, dy: 0, active: false };
  }
  function onTouchMove(event: TouchEvent<HTMLElement>) {
    const state = drag.current, panel = container.current;
    if (!state || !panel) return;
    const dy = event.touches[0].clientY - state.startY, dx = event.touches[0].clientX - state.startX;
    if (!state.active && (dy <= 0 || Math.abs(dx) > Math.abs(dy))) { drag.current = null; return; } // przewijanie w górę lub w bok
    state.active = true;
    state.dy = Math.max(0, dy);
    panel.style.transition = "none";
    panel.style.transform = `translateY(${state.dy}px)`;
  }
  function onTouchEnd() {
    const state = drag.current, panel = container.current;
    drag.current = null;
    if (!state?.active || !panel) return;
    panel.style.transition = "transform .22s ease-out";
    if (state.dy > Math.min(140, panel.offsetHeight * 0.25)) { panel.style.transform = "translateY(100%)"; setTimeout(() => closeRef.current(), 200); }
    else panel.style.transform = "";
  }

  return <div className={`overlay overlay-${kind}`} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className={`${kind === "drawer" ? "drawer" : "modal-panel"} ${className}`} ref={container} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} onTouchCancel={onTouchEnd}>
      <div className="overlay-heading"><span className="sheet-handle" aria-hidden="true"/><h2>{title}</h2><button className="icon-button close-button" aria-label="Zamknij okno" onClick={onClose}><Icon name="close"/></button></div>
      {children}
    </section>
  </div>;
}
