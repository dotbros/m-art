import { describe, expect, it } from "vitest";
import { parseBody, validatePage } from "@/lib/pages";

const form = (data: Record<string, string>, images: string[] = []) => { const f = new FormData(); for (const [k, v] of Object.entries(data)) f.set(k, v); for (const i of images) f.append("images", i); return f; };

describe("treść podstrony", () => {
  it("akapity rozdzielone pustą linią, „## ” = śródtytuł, pojedynczy enter = nowa linia w akapicie", () => {
    expect(parseBody("## Pierwszy\nTekst a\nciąg dalszy\n\nDrugi akapit\r\n\r\n## Drugi\nOstatni")).toEqual([
      { type: "heading", text: "Pierwszy" },
      { type: "paragraph", lines: ["Tekst a", "ciąg dalszy"] },
      { type: "paragraph", lines: ["Drugi akapit"] },
      { type: "heading", text: "Drugi" },
      { type: "paragraph", lines: ["Ostatni"] },
    ]);
    expect(parseBody("")).toEqual([]);
  });
});

describe("walidacja podstrony", () => {
  it("przyjmuje treść i zdjęcia (bez duplikatów), puste zdjęcie zajawki = null", () => {
    const r = validatePage(form({ title: "O nas", body: "Tekst", teaserImage: "" }, ["/images/atelier.svg", "/images/atelier.svg", "/media/0123456789abcdef0123456789abcdef.jpg"]));
    expect(r.ok && r.data).toMatchObject({ title: "O nas", images: ["/images/atelier.svg", "/media/0123456789abcdef0123456789abcdef.jpg"], teaserImage: null });
  });
  it("wymaga tytułu; odrzuca obce adresy zdjęć (także zajawki) i filmy", () => {
    const r = validatePage(form({ title: "", teaserImage: "https://zly.pl/x.jpg" }, ["/media/0123456789abcdef0123456789abcdef.mp4"]));
    expect(!r.ok && Object.keys(r.errors).sort()).toEqual(["images", "teaserImage", "title"]);
  });
});
