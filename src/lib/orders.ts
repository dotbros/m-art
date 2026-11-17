import { randomUUID } from "node:crypto";
import { and, eq, gte, inArray, sql } from "drizzle-orm";
import type { Db } from "@/db";
import { orderItems, orders, products } from "@/db/schema";
import { shippingCost } from "./catalog";
import type { OrderInput } from "./validation";

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
