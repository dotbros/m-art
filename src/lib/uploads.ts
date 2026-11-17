import { randomBytes } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Zdjęcia produktów zapisujemy poza katalogiem builda (UPLOAD_DIR), a serwujemy przez /media/[plik].
 * Dzięki temu działa to tak samo lokalnie i na serwerze po `next build`.
 * Później można tu podmienić zapis na S3/R2 bez zmian w reszcie aplikacji.
 */
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const MEDIA_NAME = /^[a-f0-9]{32}\.(jpg|png|webp)$/;
export const MEDIA_TYPES: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" };

export const uploadDir = () => path.resolve(/*turbopackIgnore: true*/ process.env.UPLOAD_DIR || "./storage/uploads");

/** Rozpoznaje format po „magicznych bajtach” — nie ufamy nazwie ani typowi z przeglądarki. */
export function detectImageType(bytes: Uint8Array): "jpg" | "png" | "webp" | null {
  if (bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg";
  if (bytes.length > 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "png";
  if (bytes.length > 12 && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP") return "webp";
  return null;
}

export class UploadError extends Error {}

/** Zapisuje plik i zwraca publiczny adres, np. /media/3f2a…c1.webp */
export async function saveImage(file: File): Promise<string> {
  if (file.size === 0) throw new UploadError("Plik jest pusty.");
  if (file.size > MAX_UPLOAD_BYTES) throw new UploadError("Zdjęcie może mieć maksymalnie 5 MB.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = detectImageType(bytes);
  if (!type) throw new UploadError("Dozwolone formaty zdjęć: JPG, PNG, WEBP.");
  const name = `${randomBytes(16).toString("hex")}.${type}`;
  await mkdir(uploadDir(), { recursive: true });
  await writeFile(path.join(/*turbopackIgnore: true*/ uploadDir(), name), bytes);
  return `/media/${name}`;
}

export async function readMedia(name: string) {
  if (!MEDIA_NAME.test(name)) return null;
  try {
    return { data: await readFile(path.join(/*turbopackIgnore: true*/ uploadDir(), name)), type: MEDIA_TYPES[name.split(".").pop()!] };
  } catch { return null; }
}

export async function deleteMedia(url: string) {
  const name = url.startsWith("/media/") ? url.slice(7) : "";
  if (MEDIA_NAME.test(name)) await unlink(path.join(/*turbopackIgnore: true*/ uploadDir(), name)).catch(() => {});
}
