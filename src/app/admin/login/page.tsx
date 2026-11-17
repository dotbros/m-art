import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth";
import { LoginForm } from "@/components/admin/login-form";
import "../admin.css";

export const metadata: Metadata = { title: "Logowanie — Panel M.art", robots: { index: false, follow: false } };

export default async function LoginPage() {
  if (await getCurrentAdmin()) redirect("/admin");
  return <main className="adm adm-login">
    <div className="adm-login-card">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/logo.svg" alt="M.art — Pracownia Biżuterii" width={120} height={120} className="adm-login-logo"/>
      <h1>Panel pracowni</h1>
      <p className="adm-muted">Zaloguj się, aby zarządzać produktami, kategoriami i zamówieniami.</p>
      <LoginForm/>
    </div>
    <Link href="/" className="adm-login-back">← Wróć do sklepu</Link>
  </main>;
}
