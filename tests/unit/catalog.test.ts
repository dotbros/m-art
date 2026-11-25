import { describe, expect, it } from "vitest";
import { COURIER_PRICE, money, productCountLabel, shippingCost, slugify } from "@/lib/catalog";
import { connectionOptions, resolveDatabaseConfig } from "@/db";

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

describe("liczba produktów (odmiana)", () => {
  it("1 produkt, 2–4 produkty, 5+ produktów, 12–14 produktów, 22–24 produkty", () => {
    expect([0, 1, 2, 4, 5, 11, 12, 14, 21, 22, 24, 25, 112, 122].map(productCountLabel)).toEqual([
      "0 produktów", "1 produkt", "2 produkty", "4 produkty", "5 produktów", "11 produktów", "12 produktów", "14 produktów",
      "21 produktów", "22 produkty", "24 produkty", "25 produktów", "112 produktów", "122 produkty",
    ]);
  });
});

describe("konfiguracja bazy", () => {
  it("bez DATABASE_URL (albo z innym adresem) zgłasza czytelny błąd", () => {
    expect(() => resolveDatabaseConfig({})).toThrow(/DATABASE_URL/);
    expect(() => resolveDatabaseConfig({ DATABASE_URL: "postgres://u:p@h/db" })).toThrow(/DATABASE_URL/);
  });
  it("adres mysql:// lub mariadb:// → MariaDB/MySQL", () => {
    expect(resolveDatabaseConfig({ DATABASE_URL: "mysql://u:p@h/db" })).toEqual({ kind: "mysql", target: "mysql://u:p@h/db" });
    expect(resolveDatabaseConfig({ DATABASE_URL: "mariadb://u:p@h/db" }).target).toBe("mysql://u:p@h/db");
  });
  it("hasło ze znakami specjalnymi i gniazdo UNIX z hostingu", () => {
    const o = connectionOptions("mysql://user_1:p%40ss%3Aw0rd@localhost:3306/marthmcl_sklep", { DATABASE_SOCKET: "/var/lib/mysql/mysql.sock" });
    expect(o).toMatchObject({ user: "user_1", password: "p@ss:w0rd", database: "marthmcl_sklep", socketPath: "/var/lib/mysql/mysql.sock", timezone: "Z" });
    expect(o.host).toBeUndefined();
  });
});
