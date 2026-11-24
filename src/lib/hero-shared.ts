// Bez zależności od bazy — może być importowane w komponentach klienckich.
export type HeroFocus = "left" | "center" | "right";
export const HERO_FOCUS: Record<HeroFocus, string> = { left: "Lewa strona", center: "Środek", right: "Prawa strona" };
export const HERO_FOCUS_POSITION: Record<HeroFocus, string> = { left: "20% 50%", center: "50% 50%", right: "78% 50%" };
export const MAX_HERO_SLIDES = 6;
/** Wartość listy „Dokąd prowadzi slajd” oznaczająca własną kolekcję wybranych produktów. */
export const TARGET_PRODUCTS = "__produkty__";
export const MAX_COLLECTION_PRODUCTS = 60;
/** Po tylu sekundach slajd ze zdjęciem przechodzi do następnego (film — po zakończeniu). */
export const HERO_IMAGE_SECONDS = 10;
/** Poniżej tej proporcji (szer./wys.) media są pionowe (9:16 = 0,56; 3:4 = 0,75) i na komputerze dostają węższą ramkę. */
export const PORTRAIT_BELOW = 0.9;