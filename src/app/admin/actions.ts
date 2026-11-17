"use server";

import { and, count, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { categories, orderItems, orders, products, ORDER_STATUSES, PAYMENT_STATUSES, type OrderStatus, type PaymentStatus } from "@/db/schema";
import { requireAdmin, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";
import { authenticate, clearAttempts, createSession, deleteSession, isRateLimited, registerFailedAttempt } from "@/lib/auth/sessions";
import { deleteMedia, saveImage, UploadError } from "@/lib/uploads";
import { validateCategory, validateProduct } from "@/lib/validation";

export type FormState = { error?: string; errors?: Record<string, string>; message?: string; values?: Record<string, string>; ts?: number };

/** Błąd walidacji + wpisane wartości, żeby formularz ich nie zgubił (React 19 resetuje formularz po akcji). */
function fail(form: FormData, errors: Record<string, string>): FormState {
  const values: Record<string, string> = {};
  // Pola wielokrotne (np. kilka kamieni) łączymy znakiem nowej linii.
  for (const [key, value] of form.entries()) if (typeof value === "string" && !key.startsWith("$")) values[key] = key in values ? `${values[key]}\n${value}` : value;
  const count = Object.keys(errors).length;
  return { errors, error: count === 1 ? "Popraw zaznaczone pole." : `Popraw zaznaczone pola (${count}).`, values, ts: Date.now() };
}

function refreshStorefront() {
  revalidatePath("/");
  revalidatePath("/admin", "layout");
}

// ---------------- Logowanie ----------------
export async function loginAction(_prev: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") || "").trim().toLowerCase();
  const password = String(form.get("password") || "");
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const key = `${email}|${ip}`;
  if (isRateLimited(key)) return { error: "Zbyt wiele nieudanych prób. Spróbuj ponownie za 15 minut." };
  const db = await getDb();
  const user = email && password ? await authenticate(db, email, password) : null;
  if (!user) { registerFailedAttempt(key); return { error: "Nieprawidłowy e-mail lub hasło." }; }
  clearAttempts(key);
  const session = await createSession(db, user.id);
  (await cookies()).set(SESSION_COOKIE, session.token, sessionCookieOptions(session.expiresAt));
  redirect("/admin");
}

export async function logoutAction() {
  const store = await cookies();
  await deleteSession(await getDb(), store.get(SESSION_COOKIE)?.value);
  store.delete(SESSION_COOKIE);
  redirect("/admin/login");
}

// ---------------- Kategorie ----------------
export async function saveCategoryAction(_prev: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = validateCategory(form);
  if (!parsed.ok) return fail(form, parsed.errors);
  const db = await getDb();
  const id = Number(form.get("id") || 0);
  const [duplicate] = await db.select({ id: categories.id }).from(categories)
    .where(id ? and(eq(categories.slug, parsed.data.slug), ne(categories.id, id)) : eq(categories.slug, parsed.data.slug));
  if (duplicate) return fail(form, { slug: "Kategoria o takim adresie już istnieje." });
  if (id) await db.update(categories).set(parsed.data).where(eq(categories.id, id));
  else await db.insert(categories).values(parsed.data);
  refreshStorefront();
  redirect("/admin/kategorie?zapisano=1");
}

export async function deleteCategoryAction(_prev: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const id = Number(form.get("id"));
  const db = await getDb();
  const [{ value }] = await db.select({ value: count() }).from(products).where(eq(products.categoryId, id));
  if (value > 0) return { error: `Nie można usunąć — kategoria zawiera produkty (${value}). Przenieś je lub ukryj kategorię.` };
  await db.delete(categories).where(eq(categories.id, id));
  refreshStorefront();
  redirect("/admin/kategorie?usunieto=1");
}

// ---------------- Produkty ----------------
export async function saveProductAction(_prev: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const editingId = String(form.get("editingId") || "");
  if (editingId) form.set("slug", editingId); // adres istniejącego produktu się nie zmienia (koszyki, linki, historia zamówień)
  const parsed = validateProduct(form);
  if (!parsed.ok) return fail(form, parsed.errors);
  const db = await getDb();
  const [category] = await db.select({ id: categories.id }).from(categories).where(eq(categories.id, parsed.data.categoryId));
  if (!category) return fail(form, { categoryId: "Wybrana kategoria nie istnieje." });

  const [existing] = await db.select({ id: products.id, image: products.image }).from(products).where(eq(products.id, parsed.data.id));
  if (!editingId && existing) return fail(form, { slug: "Produkt o takim adresie już istnieje — zmień nazwę lub adres." });
  if (editingId && !existing) return { error: "Produkt nie istnieje." };

  let image = existing?.image ?? "";
  const file = form.get("imageFile");
  if (file instanceof File && file.size > 0) {
    try { image = await saveImage(file); } catch (error) {
      if (error instanceof UploadError) return fail(form, { imageFile: error.message });
      throw error;
    }
    if (existing?.image) await deleteMedia(existing.image);
  } else if (form.get("removeImage") === "on") {
    if (existing?.image) await deleteMedia(existing.image);
    image = "";
  }

  if (editingId) await db.update(products).set({ ...parsed.data, image }).where(eq(products.id, editingId));
  else await db.insert(products).values({ ...parsed.data, image });
  refreshStorefront();
  redirect("/admin/produkty?zapisano=1");
}

export async function toggleProductAction(form: FormData) {
  await requireAdmin();
  const id = String(form.get("id"));
  const db = await getDb();
  const [product] = await db.select({ isActive: products.isActive }).from(products).where(eq(products.id, id));
  if (product) await db.update(products).set({ isActive: !product.isActive }).where(eq(products.id, id));
  refreshStorefront();
}

/** Produkty, które były zamawiane, są tylko ukrywane — historia zamówień musi zostać kompletna. */
export async function deleteProductAction(_prev: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const id = String(form.get("id"));
  const db = await getDb();
  const [{ value }] = await db.select({ value: count() }).from(orderItems).where(eq(orderItems.productId, id));
  if (value > 0) {
    await db.update(products).set({ isActive: false }).where(eq(products.id, id));
    refreshStorefront();
    return { message: "Produkt występuje w zamówieniach, więc został ukryty zamiast usunięty." };
  }
  const [deleted] = await db.delete(products).where(eq(products.id, id)).returning({ image: products.image });
  if (deleted?.image) await deleteMedia(deleted.image);
  refreshStorefront();
  redirect("/admin/produkty?usunieto=1");
}

// ---------------- Zamówienia ----------------
export async function updateOrderAction(_prev: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const id = String(form.get("id"));
  const status = String(form.get("status")) as OrderStatus;
  const paymentStatus = String(form.get("paymentStatus")) as PaymentStatus;
  if (!ORDER_STATUSES.includes(status) || !PAYMENT_STATUSES.includes(paymentStatus)) return { error: "Nieprawidłowy status." };
  const trackingNumber = String(form.get("trackingNumber") || "").trim().slice(0, 100) || null;
  const adminNote = String(form.get("adminNote") || "").trim().slice(0, 2000);
  const db = await getDb();
  const [order] = await db.select({ status: orders.status }).from(orders).where(eq(orders.id, id));
  if (!order) return { error: "Zamówienie nie istnieje." };
  if (order.status === "cancelled" && status !== "cancelled") return { error: "Anulowanego zamówienia nie można przywrócić — produkty wróciły już na stan. Złóż nowe zamówienie." };
  await db.transaction(async (tx) => {
    // Anulowanie zamówienia zwraca produkty na stan magazynowy (tylko raz).
    if (status === "cancelled" && order.status !== "cancelled") {
      const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, id));
      for (const item of items) {
        const [product] = await tx.select({ stock: products.stock }).from(products).where(eq(products.id, item.productId));
        if (product) await tx.update(products).set({ stock: product.stock + item.quantity }).where(eq(products.id, item.productId));
      }
    }
    await tx.update(orders).set({ status, paymentStatus, trackingNumber, adminNote }).where(eq(orders.id, id));
  });
  refreshStorefront();
  return { message: "Zapisano zmiany zamówienia." };
}
