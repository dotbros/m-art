import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { getActiveHeroSlides } from "@/lib/hero";
import { hasAudioTrack, processUpload } from "@/lib/media";
import { UploadError } from "@/lib/uploads";
import { heroSlides } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createTestDb } from "../helpers/db";

const fixture = (name: string) => readFile(path.resolve("tests/fixtures", name));
const toStream = (data: Uint8Array) => new ReadableStream<Uint8Array>({ start(c) { c.enqueue(data); c.close(); } });

let uploads: string;
beforeAll(async () => { uploads = await mkdtemp(path.join(os.tmpdir(), "mart-test-")); process.env.UPLOAD_DIR = uploads; });
afterAll(async () => { await rm(uploads, { recursive: true, force: true }); });

describe("przetwarzanie mediów (ffmpeg)", () => {
  it("film MOV → MP4 H.264 + kadr startowy JPG", async () => {
    const result = await processUpload(toStream(await fixture("hero.mov")), ["image", "video"]);
    expect(result.mediaType).toBe("video");
    expect(result.url).toMatch(/^\/media\/[a-f0-9]{32}\.mp4$/);
    expect(result.posterUrl).toMatch(/^\/media\/[a-f0-9]{32}\.jpg$/);
    const mp4 = await readFile(path.join(uploads, result.url.slice(7)));
    expect(String.fromCharCode(...mp4.subarray(4, 8))).toBe("ftyp");
    expect((await stat(path.join(uploads, result.posterUrl!.slice(7)))).size).toBeGreaterThan(500);
  }, 60_000);
  it("film z dźwiękiem zachowuje dźwięk (AAC), film bez dźwięku — bez ścieżki", async () => {
    const withAudio = await processUpload(toStream(await fixture("hero-audio.mov")), ["image", "video"]);
    expect(withAudio.hasAudio).toBe(true);
    expect(await hasAudioTrack(path.join(uploads, withAudio.url.slice(7)))).toBe(true);
    const silent = await processUpload(toStream(await fixture("hero.mov")), ["image", "video"]);
    expect(silent.hasAudio).toBe(false);
    expect(await hasAudioTrack(path.join(uploads, silent.url.slice(7)))).toBe(false);
  }, 60_000);
  it("zdjęcie → JPG", async () => {
    const result = await processUpload(toStream(await fixture("hero.jpg")), ["image", "video"]);
    expect(result).toMatchObject({ mediaType: "image", posterUrl: null });
    expect(result.url).toMatch(/\.jpg$/);
  });
  it("odrzuca film tam, gdzie dozwolone są tylko zdjęcia, oraz pliki niebędące mediami", async () => {
    await expect(processUpload(toStream(await fixture("hero.mov")), ["image"])).rejects.toBeInstanceOf(UploadError);
    await expect(processUpload(toStream(new TextEncoder().encode("<script>alert(1)</script>")), ["image", "video"])).rejects.toBeInstanceOf(UploadError);
    await expect(processUpload(toStream(new Uint8Array()), ["image"])).rejects.toThrow("pusty");
  });
});

describe("slajdy HERO w bazie", () => {
  let handle: Awaited<ReturnType<typeof createTestDb>>;
  beforeAll(async () => { handle = await createTestDb(); });
  afterAll(async () => { await handle?.close(); });

  it("migracja dodaje 3 dotychczasowe slajdy ze wzoru", async () => {
    const slides = await getActiveHeroSlides(handle.db);
    expect(slides.map((s) => s.title)).toEqual(["Z natury", "Małe perły,", "Blisko natury."]);
    expect(slides[0]).toMatchObject({ titleAccent: "wyjątkowa.", stone: "Jaspis cesarski", productId: "komplet-jaspis", mediaType: "image" });
  });
  it("ukryte slajdy nie trafiają na stronę, kolejność według pozycji", async () => {
    const [first] = await getActiveHeroSlides(handle.db);
    await handle.db.update(heroSlides).set({ isActive: false }).where(eq(heroSlides.id, first.id));
    await handle.db.insert(heroSlides).values({ title: "Film", mediaType: "video", mediaUrl: "/media/0123456789abcdef0123456789abcdef.mp4", position: 0 });
    const slides = await getActiveHeroSlides(handle.db);
    expect(slides.map((s) => s.title)).toEqual(["Film", "Małe perły,", "Blisko natury."]);
  });
});
