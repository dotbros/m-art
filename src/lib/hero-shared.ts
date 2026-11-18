// Bez zależności od bazy — może być importowane w komponentach klienckich.
export type HeroFocus = "left" | "center" | "right";
export const HERO_FOCUS: Record<HeroFocus, string> = { left: "Lewa strona", center: "Środek", right: "Prawa strona" };
export const HERO_FOCUS_POSITION: Record<HeroFocus, string> = { left: "20% 50%", center: "50% 50%", right: "78% 50%" };
export const MAX_HERO_SLIDES = 6;