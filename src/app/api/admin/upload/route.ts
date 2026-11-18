import { getCurrentAdmin } from "@/lib/auth";
import { processUpload, type MediaKind } from "@/lib/media";
import { UploadError } from "@/lib/uploads";

// Przetwarzanie filmu może potrwać kilkadziesiąt sekund.
export const maxDuration = 300;

/**
 * Wgrywanie zdjęć i filmów z panelu (surowe body = plik, wysyłane z paskiem postępu).
 * Zabezpieczenia: sesja administratora + nagłówek Origin zgodny z adresem strony (ochrona CSRF).
 *   POST /api/admin/upload?allow=image,video
 */
export async function POST(request: Request) {
  if (!(await getCurrentAdmin())) return Response.json({ error: "Zaloguj się ponownie." }, { status: 401 });
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  if (!origin || !host || new URL(origin).host !== host) return Response.json({ error: "Niedozwolone źródło żądania." }, { status: 403 });
  if (!request.body) return Response.json({ error: "Brak pliku." }, { status: 400 });

  const allow = (new URL(request.url).searchParams.get("allow") || "image").split(",").filter((k): k is MediaKind => k === "image" || k === "video");
  try {
    return Response.json(await processUpload(request.body, allow.length ? allow : ["image"]), { status: 201 });
  } catch (error) {
    if (error instanceof UploadError) return Response.json({ error: error.message }, { status: 400 });
    console.error("[upload]", error);
    return Response.json({ error: "Nie udało się zapisać pliku. Spróbuj ponownie." }, { status: 500 });
  }
}
