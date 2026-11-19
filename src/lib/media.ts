import { execFile } from "node:child_process";
import { randomBytes } from "node:crypto";
import { createWriteStream } from "node:fs";
import { mkdir, open, rm, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { ReadableStream as WebReadableStream } from "node:stream/web";
import ffmpegPath from "ffmpeg-static";
import { UploadError, uploadDir } from "./uploads";

/**
 * Wgrywanie zdjęć i filmów z telefonu (np. do slajdów HERO).
 * • plik przychodzi strumieniowo (bez trzymania 100 MB w pamięci),
 * • typ sprawdzamy po zawartości,
 * • ffmpeg zmniejsza zdjęcia i przerabia filmy (HEVC/MOV z iPhone'a, WebM…) na lekkie MP4 H.264,
 *   które odtworzy każdy telefon; z filmu wycina kadr startowy (poster).
 */
export const MAX_IMAGE_INPUT = 25 * 1024 * 1024;
export const MAX_VIDEO_INPUT = 200 * 1024 * 1024;
export const MAX_VIDEO_SECONDS = 20;

export type MediaKind = "image" | "video";
export type ProcessedMedia = { mediaType: MediaKind; url: string; posterUrl: string | null; hasAudio: boolean; aspect: number | null };

/** Rozpoznaje zdjęcie lub film po pierwszych bajtach. */
export function detectMediaKind(head: Uint8Array): MediaKind | null {
  const ascii = (from: number, to: number) => String.fromCharCode(...head.slice(from, to));
  if (head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) return "image"; // JPEG
  if (head[0] === 0x89 && ascii(1, 4) === "PNG") return "image";
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "image";
  if (ascii(4, 8) === "ftyp") {
    const brand = ascii(8, 12);
    return /^(heic|heix|mif1|msf1|avif)/.test(brand) ? "image" : "video"; // HEIC/AVIF to zdjęcia, reszta: mp4/mov/m4v/3gp
  }
  if (head[0] === 0x1a && head[1] === 0x45 && head[2] === 0xdf && head[3] === 0xa3) return "video"; // WebM/Matroska
  return null;
}

/** Zapisuje strumień do pliku tymczasowego, przerywa po przekroczeniu limitu. */
export async function receiveToTemp(body: ReadableStream<Uint8Array>, limit: number): Promise<string> {
  const dir = path.join(os.tmpdir(), "mart-uploads");
  await mkdir(dir, { recursive: true });
  const file = path.join(dir, randomBytes(16).toString("hex"));
  let received = 0;
  const counter = new Transform({
    transform(chunk: Buffer, _enc, done) {
      received += chunk.length;
      if (received > limit) done(new UploadError(`Plik jest za duży (maks. ${Math.round(limit / 1024 / 1024)} MB).`));
      else done(null, chunk);
    },
  });
  try {
    await pipeline(Readable.fromWeb(body as unknown as WebReadableStream), counter, createWriteStream(file));
  } catch (error) {
    await rm(file, { force: true });
    throw error;
  }
  if (received === 0) { await rm(file, { force: true }); throw new UploadError("Plik jest pusty."); }
  return file;
}

async function readHead(file: string) {
  const handle = await open(file, "r");
  try {
    const buffer = Buffer.alloc(16);
    await handle.read(buffer, 0, 16, 0);
    return new Uint8Array(buffer);
  } finally { await handle.close(); }
}

function ffmpeg(args: string[], timeoutMs = 180_000) {
  if (!ffmpegPath) throw new Error("Brak programu ffmpeg (pakiet ffmpeg-static).");
  return new Promise<void>((resolve, reject) => {
    execFile(ffmpegPath as unknown as string, ["-hide_banner", "-loglevel", "error", "-y", ...args], { timeout: timeoutMs, windowsHide: true }, (error, _out, stderr) => {
      if (error) reject(new UploadError(`Nie udało się przetworzyć pliku. ${String(stderr).split("\n")[0].slice(0, 160)}`.trim()));
      else resolve();
    });
  });
}

/**
 * Opis pliku z ffmpeg: czy ma dźwięk i jakie ma proporcje obrazu (szerokość / wysokość).
 * (ffmpeg -i wypisuje opis strumieni na stderr i kończy się kodem 1 — to normalne.)
 */
export function probe(input: string): Promise<{ hasAudio: boolean; aspect: number | null }> {
  if (!ffmpegPath) return Promise.resolve({ hasAudio: false, aspect: null });
  return new Promise((resolve) => {
    execFile(ffmpegPath as unknown as string, ["-hide_banner", "-i", input], { timeout: 30_000, windowsHide: true }, (_error, _out, stderr) => {
      const text = String(stderr);
      const size = text.match(/Stream #\d+:\d+[^\n]*: Video:[^\n]*?, (\d{2,5})x(\d{2,5})/);
      resolve({
        hasAudio: /Stream #\d+:\d+[^\n]*: Audio:/.test(text),
        aspect: size ? Math.round((Number(size[1]) / Number(size[2])) * 1000) / 1000 : null,
      });
    });
  });
}

export async function hasAudioTrack(input: string) {
  return (await probe(input)).hasAudio;
}

/** Zmniejsza tak, by DŁUŻSZY bok miał maks. `max` px (także pionowe filmy z telefonu); proporcje zachowane, wymiary parzyste. */
const fitLongSide = (max: number) => `scale='if(gte(iw,ih),min(${max},iw),-2)':'if(gte(iw,ih),-2,min(${max},ih))'`;

const newName = (ext: string) => `${randomBytes(16).toString("hex")}.${ext}`;

/** Zdjęcie: dłuższy bok maks. 2000 px, JPEG jakości ok. 85% (zwykle 200–600 KB zamiast kilku MB). */
async function processImage(input: string): Promise<ProcessedMedia> {
  const name = newName("jpg");
  await ffmpeg(["-i", input, "-vf", fitLongSide(2000), "-frames:v", "1", "-q:v", "3", path.join(uploadDir(), name)]);
  return { mediaType: "image", url: `/media/${name}`, posterUrl: null, hasAudio: false, aspect: (await probe(path.join(uploadDir(), name))).aspect };
}

/**
 * Film: MP4 H.264 + dźwięk AAC (działa w Safari, Chrome, Firefox), maks. 1280 px, maks. 20 s,
 * „faststart” — odtwarzanie zaczyna się przed pobraniem całości. Dźwięk zostaje w pliku: strona startuje
 * film wyciszony (wymóg autoodtwarzania w przeglądarkach), a klient może włączyć dźwięk przyciskiem.
 */
async function processVideo(input: string): Promise<ProcessedMedia> {
  const video = newName("mp4"), poster = newName("jpg");
  const hasAudio = await hasAudioTrack(input);
  const audio = hasAudio ? ["-map", "0:a:0", "-c:a", "aac", "-b:a", "128k", "-ac", "2"] : ["-an"];
  await ffmpeg(["-i", input, "-t", String(MAX_VIDEO_SECONDS), "-map", "0:v:0", ...audio, "-vf", `${fitLongSide(1280)},fps=30`, "-c:v", "libx264", "-preset", "veryfast", "-crf", "27", "-pix_fmt", "yuv420p", "-movflags", "+faststart", path.join(uploadDir(), video)], 300_000);
  await ffmpeg(["-ss", "0.3", "-i", path.join(uploadDir(), video), "-frames:v", "1", "-q:v", "4", path.join(uploadDir(), poster)]);
  return { mediaType: "video", url: `/media/${video}`, posterUrl: `/media/${poster}`, hasAudio, aspect: (await probe(path.join(uploadDir(), video))).aspect };
}

/** Pełna ścieżka: strumień → plik tymczasowy → weryfikacja → konwersja → /media/… */
export async function processUpload(body: ReadableStream<Uint8Array>, allow: MediaKind[]): Promise<ProcessedMedia> {
  const limit = allow.includes("video") ? MAX_VIDEO_INPUT : MAX_IMAGE_INPUT;
  const temp = await receiveToTemp(body, limit);
  try {
    const kind = detectMediaKind(await readHead(temp));
    if (!kind || !allow.includes(kind)) throw new UploadError(allow.includes("video") ? "Dozwolone są zdjęcia (JPG, PNG, WEBP, HEIC) i filmy (MP4, MOV, WEBM)." : "Dozwolone są zdjęcia JPG, PNG, WEBP, HEIC.");
    if (kind === "image" && (await stat(temp)).size > MAX_IMAGE_INPUT) throw new UploadError("Zdjęcie może mieć maksymalnie 25 MB.");
    await mkdir(uploadDir(), { recursive: true });
    return kind === "video" ? await processVideo(temp) : await processImage(temp);
  } finally {
    await rm(temp, { force: true });
  }
}
