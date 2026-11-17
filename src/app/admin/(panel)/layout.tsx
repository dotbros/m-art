import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { requireAdmin } from "@/lib/auth";
import { AdminNav } from "@/components/admin/nav";
import { logoutAction } from "../actions";
import "../admin.css";

export const metadata: Metadata = { title: "Panel M.art", robots: { index: false, follow: false } };

export default async function PanelLayout({ children }: { children: ReactNode }) {
  const user = await requireAdmin();
  return <div className="adm">
    <header className="adm-top">
      <a href="/admin" className="adm-brand"><span className="adm-brand-mark">M.art</span><span className="adm-brand-sub">PANEL PRACOWNI</span></a>
      <div className="adm-top-actions">
        <a href="/" className="adm-link" target="_blank" rel="noreferrer">Sklep ↗</a>
        <form action={logoutAction}><button type="submit" className="adm-link" title={user.email}>Wyloguj</button></form>
      </div>
    </header>
    <AdminNav/>
    <main className="adm-main">{children}</main>
  </div>;
}
