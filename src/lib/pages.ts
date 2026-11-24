import { eq } from "drizzle-orm";
import type { Db } from "@/db";
import { pages } from "@/db/schema";
import type { Result } from "./validation";

/** Podstrony edytowane w panelu: adres w sklepie i nazwa w panelu. */
export const CONTENT_PAGES = {
  pracownia: { path: "/pracownia", label: "Poznaj naszą pracownię", hasTeaser: true },
  pielegnacja: { path: "/pielegnacja", label: "Pielęgnacja biżuterii", hasTeaser: false },
} as const;

/**
 * Zalecane formaty zdjęć — wyświetlane w formularzu panelu. Muszą odpowiadać temu, jak strona kadruje zdjęcia
 * (luxe.css: zajawka pracowni 4:5; content-pages.css: nagłówek podstrony na pełną szerokość — telefon 4:3,
 * komputer 21:9 — dlatego zalecamy 5:4 z ważnym elementem w środku; miniatury galerii 4:5).
 */
export const IMAGE_FORMATS = {
  teaser: "Najlepiej pionowe 4:5, np. 1600 × 2000 px. Tak samo na komputerze i telefonie. Najważniejszy element umieść w środku kadru — w dolnych rogach zdjęcia jest napis „Małe rzeczy. Wielka uważność.” i znak M.art.",
  header: "Pierwsze zdjęcie (nagłówek podstrony): najlepiej poziome 5:4, np. 2000 × 1600 px. Wyświetla się na całą szerokość strony — na komputerze jako szeroki pas, więc górna i dolna część mogą zostać lekko przycięte; najważniejszy element umieść w środku kadru.",
  gallery: "Kolejne zdjęcia (galeria na dole strony): dowolny format — miniatury pokazują kadr 4:5, a po powiększeniu klient widzi całe zdjęcie.",
  common: "Pliki JPG, PNG, WEBP lub HEIC prosto z telefonu, do 25 MB — serwer sam je zmniejszy.",
} as const;
export type PageSlug = keyof typeof CONTENT_PAGES;
export const isPageSlug = (s: string): s is PageSlug => s in CONTENT_PAGES;

export type ContentPage = typeof pages.$inferSelect;
export const MAX_PAGE_IMAGES = 13; // zdjęcie nagłówkowe + do 12 w galerii

export async function getPage(db: Db, slug: PageSlug): Promise<ContentPage | null> {
  const [row] = await db.select().from(pages).where(eq(pages.slug, slug));
  return row ?? null;
}

/** Treść → bloki: akapity (rozdzielone pustą linią) i śródtytuły (linia zaczynająca się od „## ”). */
export type Block = { type: "heading"; text: string } | { type: "paragraph"; lines: string[] };
export function parseBody(body: string): Block[] {
  const blocks: Block[] = [];
  for (const chunk of body.replace(/\r\n/g, "\n").split(/\n\s*\n/)) {
    const lines = chunk.split("\n").map((l) => l.trim()).filter(Boolean);
    const para: string[] = [];
    for (const line of lines) {
      if (line.startsWith("## ")) {
        if (para.length) blocks.push({ type: "paragraph", lines: para.splice(0) });
        blocks.push({ type: "heading", text: line.slice(3).trim() });
      } else para.push(line);
    }
    if (para.length) blocks.push({ type: "paragraph", lines: para });
  }
  return blocks;
}

const str = (v: FormDataEntryValue | null) => (typeof v === "string" ? v.trim() : "");
const MEDIA_URL = /^\/(media\/[a-f0-9]{32}\.(jpg|png|webp)|images\/[a-z0-9-]+\.(svg|jpg|png|webp))$/;

export type PageInput = Omit<ContentPage, "slug" | "updatedAt">;

export function validatePage(form: FormData): Result<PageInput> {
  const errors: Record<string, string> = {};
  const title = str(form.get("title")), titleAccent = str(form.get("titleAccent")), eyebrow = str(form.get("eyebrow"));
  const intro = str(form.get("intro")), body = str(form.get("body")).replace(/\r\n/g, "\n");
  const images = [...new Set(form.getAll("images").map((v) => str(v)).filter(Boolean))];
  const teaserImage = str(form.get("teaserImage")) || null;
  const teaserTitle = str(form.get("teaserTitle")), teaserAccent = str(form.get("teaserAccent")), teaserText = str(form.get("teaserText")).replace(/\r\n/g, "\n");
  if (title.length < 2 || title.length > 80) errors.title = "Tytuł musi mieć od 2 do 80 znaków.";
  if (titleAccent.length > 80) errors.titleAccent = "Maksymalnie 80 znaków.";
  if (eyebrow.length > 60) errors.eyebrow = "Maksymalnie 60 znaków.";
  if (intro.length > 600) errors.intro = "Wstęp może mieć maksymalnie 600 znaków.";
  if (body.length > 10000) errors.body = "Treść może mieć maksymalnie 10 000 znaków.";
  if (images.length > MAX_PAGE_IMAGES) errors.images = `Maksymalnie ${MAX_PAGE_IMAGES} zdjęć.`;
  else if (images.some((u) => !MEDIA_URL.test(u))) errors.images = "Nieprawidłowe zdjęcie.";
  if (teaserImage && !MEDIA_URL.test(teaserImage)) errors.teaserImage = "Nieprawidłowe zdjęcie.";
  if (teaserTitle.length > 80 || teaserAccent.length > 80) errors.teaserTitle = "Maksymalnie 80 znaków.";
  if (teaserText.length > 800) errors.teaserText = "Maksymalnie 800 znaków.";
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, data: { eyebrow, title, titleAccent, intro, body, images, teaserImage, teaserTitle, teaserAccent, teaserText } };
}
