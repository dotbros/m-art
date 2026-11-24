import { randomUUID } from "node:crypto";
import { and, eq, gte, inArray, sql } from "drizzle-orm";
import type { Db } from "@/db";
import { orderItems, orders, products } from "@/db/schema";
import { shippingCost } from "./catalog";
import type { OrderInput } from "./validation";

/** Statusy, w których towar jest jeszcze w pracowni — usunięcie zamówienia zwraca go na stan. */
const STOCK_RESERVED = ["awaiting_confirmation", "confirmed", "paid"];

/**
 * Usuwa zamówienia (z pozycjami) w jednej transakcji. Dla zamówień, których towar nie wyszedł z pracowni,
 * zwraca produkty na stan; wysłane/zrealizowane — bez zwrotu, anulowane — stan zwrócono już przy anulowaniu.
 * Zwraca liczbę usuniętych zamówień.
 */
export async function deleteOrders(db: Db, ids: string[]) {
  if (!ids.length) return 0;
  return db.transaction(async (tx) => {
    const found = await tx.select({ id: orders.id, status: orders.status }).from(orders).where(inArray(orders.id, ids));
    const restore = found.filter((o) => STOCK_RESERVED.includes(o.status)).map((o) => o.id);
    if (restore.length) {
      const items = await tx.select().from(orderItems).where(inArray(orderItems.orderId, restore));
      for (const item of items) await tx.update(products).set({ stock: sql`${products.stock} + ${item.quantity}` }).where(eq(products.id, item.productId));
    }
    if (found.length) await tx.delete(orders).where(inArray(orders.id, found.map((o) => o.id))); // pozycje usuwa ON DELETE CASCADE
    return found.length;
  });
}

/** Błąd, którego treść można bezpiecznie pokazać klientowi. */
export class OrderError extends Error {}

export function orderNumber(id: string, date = new Date()) {
  return `MA-${date.toISOString().slice(0, 10).replaceAll("-", "")}-${id.replaceAll("-", "").slice(0, 6).toUpperCase()}`;
}

/**
 * Zapisuje zamówienie w jednej transakcji: sprawdza produkty, liczy kwoty po stronie serwera
 * (ceny z bazy, nie z przeglądarki) i atomowo zmniejsza stany magazynowe.
 */
export async function createOrder(db: Db, input: OrderInput) {
  return db.transaction(async (tx) => {
    const ids = input.items.map((item) => item.id);
    const found = await tx.select().from(products).where(and(inArray(products.id, ids), eq(products.isActive, true)));
    if (found.length !== ids.length) throw new OrderError("Niektóre produkty nie są już dostępne. Odśwież stronę.");

    let subtotal = 0;
    for (const item of input.items) {
      const product = found.find((p) => p.id === item.id)!;
      if (product.stock < item.quantity) throw new OrderError(`Produkt „${product.name}” jest dostępny w liczbie ${product.stock} szt.`);
      subtotal += product.price * item.quantity;
    }
    const shipping = shippingCost(subtotal, input.delivery);
    const id = randomUUID();
    const number = orderNumber(id);

    await tx.insert(orders).values({
      id, number, email: input.email, customerName: input.name, phone: input.phone,
      address: { street: input.street, postalCode: input.postalCode, city: input.city },
      delivery: input.delivery, subtotal, shipping, total: subtotal + shipping,
    });
    for (const item of input.items) {
      const product = found.find((p) => p.id === item.id)!;
      await tx.insert(orderItems).values({ orderId: id, productId: product.id, productName: product.name, quantity: item.quantity, unitPrice: product.price });
      // Warunek `stock >= quantity` chroni przed sprzedażą „na minus” przy równoległych zamówieniach.
      const updated = await tx.update(products).set({ stock: sql`${products.stock} - ${item.quantity}` })
        .where(and(eq(products.id, product.id), gte(products.stock, item.quantity))).returning({ id: products.id });
      if (!updated.length) throw new OrderError(`Produkt „${product.name}” właśnie się wyprzedał.`);
    }
    return { id, number, subtotal, shipping, total: subtotal + shipping };
  });
}
