import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { count, eq } from "drizzle-orm";
import { categories, orderItems, orders, products } from "@/db/schema";
import { createOrder, OrderError } from "@/lib/orders";
import { seedDemoData } from "@/lib/seed";
import { getStorefront } from "@/lib/store";
import { validateOrder, type OrderInput } from "@/lib/validation";
import { createTestDb } from "../helpers/db";

let handle: Awaited<ReturnType<typeof createTestDb>>;
beforeAll(async () => { handle = await createTestDb(); });
afterAll(async () => { await handle?.close(); });

const input = (items: OrderInput["items"], delivery: OrderInput["delivery"] = "courier"): OrderInput => {
  const r = validateOrder({ email: "anna@example.pl", name: "Anna", phone: "600000000", street: "Kwiatowa 1", postalCode: "00-001", city: "Warszawa", delivery, consent: true, items });
  if (!r.ok) throw new Error(JSON.stringify(r.errors));
  return r.data;
};

describe("migracje i dane demo", () => {
  it("tworzą 5 kategorii i 8 produktów", async () => {
    const [{ value: c }] = await handle.db.select({ value: count() }).from(categories);
    const [{ value: p }] = await handle.db.select({ value: count() }).from(products);
    expect([c, p]).toEqual([5, 8]);
  });
  it("seed nie nadpisuje istniejących danych przy ponownym uruchomieniu", async () => {
    expect(await seedDemoData(handle.db)).toBe(false);
  });
});

describe("sklep (getStorefront)", () => {
  it("zwraca produkty z nazwą kategorii, posortowane wg kolejności", async () => {
    const { products: list, categories: cats } = await getStorefront(handle.db);
    expect(cats.map((c) => c.name)).toEqual(["Naszyjniki", "Kolczyki", "Bransoletki", "Pierścionki", "Komplety"]);
    expect(list[0]).toMatchObject({ id: "naszyjnik-jaspis", category: "Naszyjniki", categorySlug: "naszyjniki" });
  });
  it("ukrywa nieaktywne produkty i produkty z ukrytych kategorii", async () => {
    await handle.db.update(products).set({ isActive: false }).where(eq(products.id, "kolczyki-jaspis"));
    const [ring] = await handle.db.select().from(categories).where(eq(categories.slug, "pierscionki"));
    await handle.db.update(categories).set({ isActive: false }).where(eq(categories.id, ring.id));
    const { products: list, categories: cats } = await getStorefront(handle.db);
    expect(list.map((p) => p.id)).not.toContain("kolczyki-jaspis");
    expect(list.map((p) => p.id)).not.toContain("pierscionek-perla");
    expect(cats.map((c) => c.name)).not.toContain("Pierścionki");
    await handle.db.update(products).set({ isActive: true }).where(eq(products.id, "kolczyki-jaspis"));
    await handle.db.update(categories).set({ isActive: true }).where(eq(categories.id, ring.id));
  });
});

describe("zamówienia (createOrder)", () => {
  it("liczy kwoty z cen w bazie i zmniejsza stan magazynowy", async () => {
    const order = await createOrder(handle.db, input([{ id: "naszyjnik-jaspis", quantity: 2 }]));
    expect(order).toMatchObject({ subtotal: 37800, shipping: 0, total: 37800 });
    expect(order.number).toMatch(/^MA-\d{8}-[A-F0-9]{6}$/);
    const [p] = await handle.db.select().from(products).where(eq(products.id, "naszyjnik-jaspis"));
    expect(p.stock).toBe(10);
    const items = await handle.db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ productName: "Słoneczny splot", unitPrice: 18900, quantity: 2 });
  });
  it("dolicza 14,90 zł za kuriera poniżej progu, odbiór osobisty gratis", async () => {
    expect((await createOrder(handle.db, input([{ id: "pierscionek-perla", quantity: 1 }]))).total).toBe(9900 + 1490);
    expect((await createOrder(handle.db, input([{ id: "pierscionek-perla", quantity: 1 }], "pickup"))).total).toBe(9900);
  });
  it("odrzuca zamówienie ponad stan i niczego nie zapisuje (transakcja)", async () => {
    const [{ value: before }] = await handle.db.select({ value: count() }).from(orders);
    await expect(createOrder(handle.db, input([{ id: "pierscionek-perla", quantity: 1 }, { id: "komplet-jaspis", quantity: 7 }]))).rejects.toBeInstanceOf(OrderError);
    const [{ value: after }] = await handle.db.select({ value: count() }).from(orders);
    expect(after).toBe(before);
    const [ring] = await handle.db.select().from(products).where(eq(products.id, "pierscionek-perla"));
    expect(ring.stock).toBe(6); // 8 − 2 z poprzedniego testu, bez zmian po odrzuceniu
  });
  it("odrzuca nieistniejące i ukryte produkty", async () => {
    await expect(createOrder(handle.db, input([{ id: "nie-ma-takiego", quantity: 1 }]))).rejects.toThrow("nie są już dostępne");
    await handle.db.update(products).set({ isActive: false }).where(eq(products.id, "bransoletka-perla"));
    await expect(createOrder(handle.db, input([{ id: "bransoletka-perla", quantity: 1 }]))).rejects.toBeInstanceOf(OrderError);
  });
  it("historia zamówienia przetrwa usunięcie produktu", async () => {
    const order = await createOrder(handle.db, input([{ id: "kolczyki-perly", quantity: 1 }]));
    await handle.db.delete(products).where(eq(products.id, "kolczyki-perly"));
    const items = await handle.db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
    expect(items[0].productName).toBe("Perłowa opowieść");
  });
});
