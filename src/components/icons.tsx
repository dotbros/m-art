import type { CSSProperties } from "react";

export type IconName = "search" | "bag" | "heart" | "arrow" | "arrow-left" | "arrow-down" | "chevron" | "close" | "menu" | "plus" | "minus" | "leaf" | "gift" | "truck" | "hand" | "check" | "filter" | "instagram" | "star" | "shield" | "mail" | "sparkle" | "trash" | "sound-on" | "sound-off";

export function Icon({ name, size = 22, className = "", style }: { name: IconName; size?: number; className?: string; style?: CSSProperties }) {
  const paths: Record<IconName, React.ReactNode> = {
    search: <><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.5 4.5"/></>,
    bag: <><path d="M5 7.5h14l1 13H4l1-13Z"/><path d="M8.5 8V6a3.5 3.5 0 0 1 7 0v2"/></>,
    heart: <path d="M20.2 5.8a5.2 5.2 0 0 0-7.4 0L12 6.6l-.8-.8a5.2 5.2 0 0 0-7.4 7.4L12 21l8.2-7.8a5.2 5.2 0 0 0 0-7.4Z"/>,
    arrow: <><path d="M3 12h17M14 6l6 6-6 6"/></>,
    "arrow-left": <path d="M21 12H4m6-6-6 6 6 6"/>,
    "arrow-down": <path d="M12 3v17m-6-6 6 6 6-6"/>,
    chevron: <path d="m7 10 5 5 5-5"/>,
    close: <path d="m6 6 12 12M6 18 18 6"/>,
    menu: <path d="M3 6h18M3 12h18M3 18h12"/>,
    plus: <path d="M12 5v14M5 12h14"/>,
    minus: <path d="M5 12h14"/>,
    leaf: <><path d="M20.5 3.5C10 1 3 6 4.5 13.5c1.2 6 8.5 7 12 3 3-3.5 2-8 4-13Z"/><path d="M3 22c1-7 6-11 12-14M7 14l5 1m-1-5 .5-4"/></>,
    gift: <><path d="M3 8h18v4H3zM5 12v9h14v-9M12 8v13"/><path d="M12 8C7 8 5 6.8 5 4.8 5 1.5 11 2 12 8Zm0 0c5 0 7-1.2 7-3.2 0-3.3-6-2.8-7 3.2Z"/></>,
    truck: <><path d="M2 5h12v12H2zM14 9h4l4 4v4h-8"/><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M18 9v4h4"/></>,
    hand: <><path d="m7 12 3-2c1.2-.8 2.3.5 1.3 1.5L10 13h5l3-3c2-2 4-.5 2 2l-4 5H8l-4 3-3-5 4-3Z"/><path d="m13 5 2-3 2 3-2 3-2-3Zm-5 0H6m13 1h2"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    filter: <><path d="M3 6h18M3 12h18M3 18h18"/><circle cx="8" cy="6" r="2" fill="currentColor" stroke="none"/><circle cx="16" cy="12" r="2" fill="currentColor" stroke="none"/><circle cx="9" cy="18" r="2" fill="currentColor" stroke="none"/></>,
    instagram: <><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".8" fill="currentColor"/></>,
    star: <path d="m12 2.8 2.8 5.7 6.3.9-4.6 4.5 1.1 6.3-5.6-3-5.6 3 1.1-6.3L3 9.4l6.2-.9L12 2.8Z"/>,
    shield: <><path d="m12 2 8 4v6c0 5-8 10-8 10S4 17 4 12V6l8-4Z"/><path d="m8 12 3 3 5-6"/></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="1"/><path d="m3 6 9 7 9-7"/></>,
    sparkle: <><path d="m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5L12 2Z"/></>,
    trash: <><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7"/></>,
    "sound-on": <><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></>,
    "sound-off": <><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="m17 9.5 5 5m0-5-5 5"/></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" className={className} style={style} aria-hidden="true">{paths[name]}</svg>;
}
