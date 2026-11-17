import { readMedia } from "@/lib/uploads";

export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const media = await readMedia((await params).file);
  if (!media) return new Response("Nie znaleziono", { status: 404 });
  return new Response(new Uint8Array(media.data), {
    headers: { "Content-Type": media.type, "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" },
  });
}
