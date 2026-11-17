import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { messages } from "@/db/schema";
import { isEmail } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";
    if (name.length < 2 || name.length > 100 || !isEmail(email) || message.length < 10 || message.length > 4000) {
      return NextResponse.json({ error: "Wpisz imię, poprawny adres e-mail i wiadomość (10–4000 znaków)." }, { status: 400 });
    }
    await (await getDb()).insert(messages).values({ name, email, message });
    return NextResponse.json({ message: "Dziękujemy! Twoja wiadomość trafiła do pracowni. Odpowiemy na podany adres e-mail." });
  } catch (error) {
    console.error("[contact]", error);
    return NextResponse.json({ error: "Nie udało się wysłać wiadomości. Spróbuj ponownie." }, { status: 500 });
  }
}
