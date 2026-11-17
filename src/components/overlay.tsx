"use client";

import { useEffect, useRef, type ReactNode } from "react";
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

  return <div className={`overlay overlay-${kind}`} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className={`${kind === "drawer" ? "drawer" : "modal-panel"} ${className}`} ref={container} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1}>
      <div className="overlay-heading"><h2>{title}</h2><button className="icon-button close-button" aria-label="Zamknij okno" onClick={onClose}><Icon name="close"/></button></div>
      {children}
    </section>
  </div>;
}
