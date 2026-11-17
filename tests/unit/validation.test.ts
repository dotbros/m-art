import { describe, expect, it } from "vitest";
import { parsePrice, parseStones, validateCategory, validateOrder, validateProduct } from "@/lib/validation";

const order = { email: " Anna@Example.PL ", name: "Anna Kowalska", phone: "600 000 000", street: "Kwiatowa 1", postalCode: "00-001", city: "Warszawa", delivery: "courier", consent: true, items: [{ id: "a", quantity: 2 }] };

const form = (data: Record<string, string>) => { const f = new FormData(); for (const [k, v] of Object.entries(data)) f.set(k, v); return f; };

describe("validateOrder", () => {
  it("przyjmuje poprawne zamówienie i normalizuje e-mail", () => {
    const result = validateOrder(order);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.email).toBe("anna@example.pl");
  });
  it("odrzuca zły kod pocztowy, brak zgody i zły e-mail", () => {
    const result = validateOrder({ ...order, postalCode: "00001", consent: false, email: "x@" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(Object.keys(result.errors).sort()).toEqual(["consent", "email", "postalCode"]);
  });
  it("sumuje powtórzone pozycje i pilnuje limitu 10 sztuk", () => {
    const ok = validateOrder({ ...order, items: [{ id: "a", quantity: 4 }, { id: "a", quantity: 3 }] });
    expect(ok.ok && ok.data.items).toEqual([{ id: "a", quantity: 7 }]);
    expect(validateOrder({ ...order, items: [{ id: "a", quantity: 6 }, { id: "a", quantity: 5 }] }).ok).toBe(false);
  });
  it("odrzuca pusty koszyk, ujemne i ułamkowe ilości", () => {
    expect(validateOrder({ ...order, items: [] }).ok).toBe(false);
    expect(validateOrder({ ...order, items: [{ id: "a", quantity: -1 }] }).ok).toBe(false);
    expect(validateOrder({ ...order, items: [{ id: "a", quantity: 1.5 }] }).ok).toBe(false);
    expect(validateOrder({ ...order, delivery: "drone" }).ok).toBe(false);
  });
});

describe("parsePrice", () => {
  it("rozumie przecinek, kropkę i liczby całkowite", () => {
    expect(parsePrice("189,90")).toBe(18990);
    expect(parsePrice("189.9")).toBe(18990);
    expect(parsePrice("189")).toBe(18900);
    expect(parsePrice("1 299,00")).toBe(129900);
  });
  it("odrzuca błędne formaty", () => {
    for (const bad of ["", "abc", "-5", "1,999", "12,3,4"]) expect(parsePrice(bad)).toBeNaN();
  });
});

describe("validateCategory / validateProduct", () => {
  it("tworzy slug kategorii z nazwy", () => {
    const result = validateCategory(form({ name: "Pierścionki", isActive: "on" }));
    expect(result.ok && result.data).toMatchObject({ slug: "pierscionki", isActive: true, position: 0 });
  });
  it("wymaga nazwy, kategorii i poprawnej ceny produktu", () => {
    const result = validateProduct(form({ name: "", price: "zero" }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(Object.keys(result.errors)).toEqual(expect.arrayContaining(["name", "price", "categoryId"]));
  });
  it("cena przed obniżką musi być wyższa od ceny", () => {
    const result = validateProduct(form({ name: "Test", categoryId: "1", price: "100", compareAtPrice: "90" }));
    expect(!result.ok && result.errors.compareAtPrice).toBeTruthy();
  });
  it("przyjmuje poprawny produkt (cena w groszach, etykieta wielkimi literami)", () => {
    const result = validateProduct(form({ name: "Kropla światła", categoryId: "2", price: "159,00", stock: "3", badge: "nowość", isActive: "on" }));
    expect(result.ok && result.data).toMatchObject({ id: "kropla-swiatla", price: 15900, stock: 3, badge: "NOWOŚĆ", isActive: true, compareAtPrice: null });
  });
});

describe("kamienie (wielokrotny wybór)", () => {
  it("parseStones usuwa puste i duplikaty, ujednolica wielką literę, zachowuje kolejność", () => {
    expect(parseStones(["agat mszysty", " Perła  naturalna ", "", "Agat mszysty", "perła naturalna"])).toEqual(["Agat mszysty", "Perła naturalna"]);
  });
  it("produkt może mieć kilka kamieni lub żadnego", () => {
    const f = form({ name: "Naszyjnik mieszany", categoryId: "1", price: "200" });
    f.append("stones", "Agat mszysty"); f.append("stones", "Perła naturalna"); f.append("stones", "Jaspis cesarski");
    const many = validateProduct(f);
    expect(many.ok && many.data.stones).toEqual(["Agat mszysty", "Perła naturalna", "Jaspis cesarski"]);
    const none = validateProduct(form({ name: "Bez kamienia", categoryId: "1", price: "50" }));
    expect(none.ok && none.data.stones).toEqual([]);
  });
  it("odrzuca więcej niż 10 kamieni", () => {
    const f = form({ name: "Za dużo", categoryId: "1", price: "10" });
    for (let i = 0; i < 11; i++) f.append("stones", `Kamień ${i}`);
    const result = validateProduct(f);
    expect(!result.ok && result.errors.stones).toBeTruthy();
  });
});