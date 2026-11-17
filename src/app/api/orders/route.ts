import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { createOrder, OrderError } from "@/lib/orders";
import { validateOrder } from "@/lib/validation";

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Nieprawidłowe dane." }, { status: 400 }); }
  const parsed = validateOrder(body ?? {});
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.errors.items || "Sprawdź dane kontaktowe, adres dostawy i zgodę na regulamin.", fields: parsed.errors }, { status: 400 });
  }
  try {
    const order = await createOrder(await getDb(), parsed.data);
    revalidatePath("/");
    return NextResponse.json({ number: order.number, total: order.total }, { status: 201 });
  } catch (error) {
    if (error instanceof OrderError) return NextResponse.json({ error: error.message }, { status: 409 });
    console.error("[orders] ", error);
    return NextResponse.json({ error: "Nie udało się zapisać zamówienia. Spróbuj ponownie za chwilę." }, { status: 500 });
  }
}
