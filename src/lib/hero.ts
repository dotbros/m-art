import { and, asc, eq } from "drizzle-orm";
import type { Db } from "@/db";
import { heroSlides } from "@/db/schema";
import type { Result } from "./validation";

import { MAX_HERO_SLIDES, type HeroFocus } from "./hero-shared";
export { HERO_FOCUS, MAX_HERO_SLIDES, type HeroFocus } from "./hero-shared";

/** Slajd w postaci dla sklepu. */
export type HeroSlide = {
  id: number; eyebrow: string; title: string; titleAccent: string; description: string;
  mediaType: "image" | "video"; mediaUrl: string; posterUrl: string | null; hasAudio: boolean; focus: HeroFocus; stone: string; productId: string | null;
};

/** Gdy w panelu nie ma żadnego aktywnego slajdu — strona główna nadal wygląda dobrze. */
export const FALLBACK_SLIDE: HeroSlide = {
  id: 0, eyebrow: "BIŻUTERIA INSPIROWANA NATURĄ", title: "Z natury", titleAccent: "wyjątkowa.",
  description: "Prawdziwe kamienie. Ręczna praca. Twoja historia.\nOdkryj biżuterię, która jest tak niepowtarzalna jak Ty.",
  mediaType: "image", mediaUrl: "/images/hero-jewelry.svg", posterUrl: null, hasAudio: false, focus: "right", stone: "", productId: null,
};

export async function getActiveHeroSlides(db: Db): Promise<HeroSlide[]> {
  const rows = await db.select().from(heroSlides).where(and(eq(heroSlides.isActive, true))).orderBy(asc(heroSlides.position), asc(heroSlides.id)).limit(MAX_HERO_SLIDES);
  return rows.map((r) => ({
    id: r.id, eyebrow: r.eyebrow, title: r.title, titleAccent: r.titleAccent, description: r.description, mediaType: r.mediaType,
    mediaUrl: r.mediaUrl, posterUrl: r.posterUrl, hasAudio: r.mediaType === "video" && r.hasAudio, focus: (["left", "center", "right"].includes(r.focus) ? r.focus : "center") as HeroFocus, stone: r.stone, productId: r.productId,
  }));
}

export type HeroSlideInput = Omit<HeroSlide, "id"> & { position: number; isActive: boolean };

const str = (value: FormDataEntryValue | null) => (typeof value === "string" ? value.trim() : "");
/** Dozwolone źródła mediów: pliki wgrane przez panel lub grafiki dołączone do sklepu. */
const MEDIA_URL = /^\/(media\/[a-f0-9]{32}\.(jpg|png|webp|mp4)|images\/[a-z0-9-]+\.(svg|jpg|png|webp))$/;

export function validateHeroSlide(form: FormData): Result<HeroSlideInput> {
  const errors: Record<string, string> = {};
  const title = str(form.get("title")), titleAccent = str(form.get("titleAccent")), eyebrow = str(form.get("eyebrow"));
  const description = str(form.get("description")).replace(/\r\n/g, "\n");
  const mediaUrl = str(form.get("mediaUrl")), posterUrl = str(form.get("posterUrl")) || null;
  const mediaType = form.get("mediaType") === "video" ? "video" : "image";
  const focus = (["left", "center", "right"].includes(str(form.get("focus"))) ? str(form.get("focus")) : "center") as HeroFocus;
  const position = Number(str(form.get("position")) || 0);
  if (title.length < 2 || title.length > 60) errors.title = "Tytuł musi mieć od 2 do 60 znaków.";
  if (titleAccent.length > 60) errors.titleAccent = "Maksymalnie 60 znaków.";
  if (eyebrow.length > 60) errors.eyebrow = "Maksymalnie 60 znaków.";
  if (description.length > 300) errors.description = "Opis może mieć maksymalnie 300 znaków.";
  if (!MEDIA_URL.test(mediaUrl)) errors.media = "Dodaj zdjęcie lub film.";
  else if ((mediaType === "video") !== mediaUrl.endsWith(".mp4")) errors.media = "Nieprawidłowy typ pliku.";
  if (posterUrl && !MEDIA_URL.test(posterUrl)) errors.media = "Nieprawidłowy kadr startowy filmu.";
  if (!Number.isInteger(position) || position < 0 || position > 999) errors.position = "Kolejność to liczba 0–999.";
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, data: {
    title, titleAccent, eyebrow, description, mediaUrl, mediaType, posterUrl: mediaType === "video" ? posterUrl : null, hasAudio: mediaType === "video" && form.get("hasAudio") === "on", focus,
    stone: str(form.get("stone")).slice(0, 60), productId: str(form.get("productId")) || null, position, isActive: form.get("isActive") === "on",
  } };
}
