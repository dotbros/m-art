import { describe, expect, it } from "vitest";
import { COURIER_PRICE, money, shippingCost, slugify } from "@/lib/catalog";
import { resolveDatabaseConfig } from "@/db";

describe("catalog", () => {
  it("formatuje kwoty w groszach jako złotówki", () => {
    expect(money(18900).replace(/\s/g, " ")).toBe("189,00 zł");
    expect(money(1490).replace(/\s/g, " ")).toBe("14,90 zł");
  });

  it("liczy koszt dostawy: kurier płatny poniżej progu, darmowy od 299 zł i przy odbiorze", () => {
    expect(shippingCost(29899, "courier")).toBe(COURIER_PRICE);
    expect(shippingCost(29900, "courier")).toBe(0);
    expect(shippingCost(100, "pickup")).toBe(0);
  });

  it("tworzy adresy (slug) z polskich nazw", () => {
    expect(slugify("Słoneczny splot")).toBe("sloneczny-splot");
    expect(slugify("  Pierścionki & Łańcuszki! ")).toBe("pierscionki-lancuszki");
    expect(slugify("Żółć")).toBe("zolc");
  });
});

describe("konfiguracja bazy", () => {
  it("bez DATABASE_URL używa lokalnego PGlite", () => {
    expect(resolveDatabaseConfig({})).toEqual({ kind: "pglite", target: "./data/pglite" });
  });
  it("z adresem postgres:// używa PostgreSQL", () => {
    expect(resolveDatabaseConfig({ DATABASE_URL: "postgres://u:p@h/db" }).kind).toBe("postgres");
    expect(resolveDatabaseConfig({ DATABASE_URL: "postgresql://u:p@h/db" }).kind).toBe("postgres");
  });
});
