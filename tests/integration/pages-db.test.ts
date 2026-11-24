import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { getPage, parseBody } from "@/lib/pages";
import { createTestDb } from "../helpers/db";

let handle: Awaited<ReturnType<typeof createTestDb>>;
beforeAll(async () => { handle = await createTestDb(); });
afterAll(async () => { await handle?.close(); });

describe("podstrony z migracji 0007", () => {
  it("pracownia: treść ze wzoru, zdjęcie nagłówkowe i osobna zajawka na stronę główną", async () => {
    const page = await getPage(handle.db, "pracownia");
    expect(page).toMatchObject({ title: "Nie z fabryki.", titleAccent: "Z pasji.", images: ["/images/atelier.svg"], teaserImage: "/images/atelier.svg", teaserTitle: "Nie z fabryki." });
    expect(page!.teaserText).toContain("najpiękniejsze rzeczy powstają powoli");
    expect(parseBody(page!.body).filter((b) => b.type === "paragraph")).toHaveLength(2);
  });
  it("pielęgnacja: 3 śródtytuły z treści ze wzoru", async () => {
    const page = await getPage(handle.db, "pielegnacja");
    const headings = parseBody(page!.body).filter((b) => b.type === "heading").map((b) => (b as { text: string }).text);
    expect(headings).toEqual(["Ostatnia rzecz przed wyjściem", "Miękko i osobno", "Naturalnie czysta"]);
  });
});
