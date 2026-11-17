import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { getSessionUser, type AdminUser } from "./sessions";

/** Na produkcji (HTTPS) prefiks __Host- wymusza Secure, Path=/ i brak Domain. */
export const SESSION_COOKIE = process.env.NODE_ENV === "production" && process.env.COOKIE_SECURE !== "false" ? "__Host-mart_admin" : "mart_admin";

export function sessionCookieOptions(expires: Date) {
  return { httpOnly: true, sameSite: "lax" as const, secure: SESSION_COOKIE.startsWith("__Host-"), path: "/", expires };
}

export const getCurrentAdmin = cache(async (): Promise<AdminUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return getSessionUser(await getDb(), token);
});

/**
 * Wywołuj na początku KAŻDEJ strony i Server Action panelu admina.
 * Layout nie chroni akcji — to osobne punkty wejścia POST.
 */
export async function requireAdmin(): Promise<AdminUser> {
  const user = await getCurrentAdmin();
  if (!user) redirect("/admin/login");
  return user;
}
