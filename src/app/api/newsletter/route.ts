import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { subscribers } from "@/db/schema";
import { isEmail } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!isEmail(email) || body.consent !== true) {
      return NextResponse.json({ error: "Podaj poprawny adres e-mail i zaakceptuj politykę prywatności." }, { status: 400 });
    }
    await (await getDb()).insert(subscribers).values({ email }).onConflictDoNothing();
    return NextResponse.json({ message: "Jesteś na liście! Dziękujemy, że dołączasz do świata M.art." });
  } catch (error) {
    console.error("[newsletter]", error);
    return NextResponse.json({ error: "Nie udało się zapisać adresu. Spróbuj ponownie za chwilę." }, { status: 500 });
  }
}
