import { createReadStream } from "node:fs";
import { Readable } from "node:stream";
import { locateMedia } from "@/lib/uploads";

const baseHeaders = (type: string) => ({ "Content-Type": type, "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff", "Accept-Ranges": "bytes" });
const stream = (file: string, start?: number, end?: number) => Readable.toWeb(createReadStream(file, { start, end })) as ReadableStream;

/**
 * Serwuje zdjęcia i filmy z UPLOAD_DIR. Obsługuje nagłówek Range (odpowiedź 206) —
 * bez tego Safari na iPhonie nie odtwarza wideo.
 */
export async function GET(request: Request, { params }: { params: Promise<{ file: string }> }) {
  const media = await locateMedia((await params).file);
  if (!media) return new Response("Nie znaleziono", { status: 404 });

  const range = request.headers.get("range")?.match(/^bytes=(\d*)-(\d*)$/);
  if (!range) return new Response(stream(media.file), { headers: { ...baseHeaders(media.type), "Content-Length": String(media.size) } });

  let start = range[1] ? Number(range[1]) : NaN;
  let end = range[2] ? Number(range[2]) : media.size - 1;
  if (Number.isNaN(start)) { start = Math.max(0, media.size - end); end = media.size - 1; } // „bytes=-500” = ostatnie 500 bajtów
  end = Math.min(end, media.size - 1);
  if (start > end || start >= media.size) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${media.size}` } });
  return new Response(stream(media.file, start, end), {
    status: 206,
    headers: { ...baseHeaders(media.type), "Content-Length": String(end - start + 1), "Content-Range": `bytes ${start}-${end}/${media.size}` },
  });
}
