import Link from "next/link";
import { and, count, desc, eq, lte } from "drizzle-orm";
import { getDb } from "@/db";
import { categories, orders, products } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { money } from "@/lib/catalog";
import { dateTime, orderStatusLabels } from "../labels";

export default async function Dashboard() {
  const user = await requireAdmin();
  const db = await getDb();
  const [[productCount], [categoryCount], [awaiting], [lowStock], recent] = await Promise.all([
    db.select({ value: count() }).from(products).where(eq(products.isActive, true)),
    db.select({ value: count() }).from(categories),
    db.select({ value: count() }).from(orders).where(eq(orders.status, "awaiting_confirmation")),
    db.select({ value: count() }).from(products).where(and(eq(products.isActive, true), lte(products.stock, 2))),
    db.select().from(orders).orderBy(desc(orders.createdAt)).limit(5),
  ]);
  return <>
    <div className="adm-head"><div><p className="adm-eyebrow">DZIEŃ DOBRY</p><h1>Witaj{user.name ? `, ${user.name}` : ""}</h1></div></div>
    <div className="adm-stats">
      <Link href="/admin/zamowienia?status=awaiting_confirmation" className={`adm-stat ${awaiting.value ? "is-alert" : ""}`}><strong>{awaiting.value}</strong><span>do potwierdzenia</span></Link>
      <Link href="/admin/produkty" className="adm-stat"><strong>{productCount.value}</strong><span>widocznych produktów</span></Link>
      <Link href="/admin/produkty?stan=niski" className={`adm-stat ${lowStock.value ? "is-warn" : ""}`}><strong>{lowStock.value}</strong><span>kończy się (≤ 2 szt.)</span></Link>
      <Link href="/admin/kategorie" className="adm-stat"><strong>{categoryCount.value}</strong><span>kategorii</span></Link>
    </div>
    <div className="adm-quick">
      <Link href="/admin/produkty/nowy" className="adm-btn adm-btn-primary">+ Nowy produkt</Link>
      <Link href="/admin/kategorie/nowa" className="adm-btn">+ Nowa kategoria</Link>
    </div>
    <section className="adm-card">
      <h2>Ostatnie zamówienia</h2>
      {recent.length ? <ul className="adm-list">{recent.map((o) => <li key={o.id}><Link href={`/admin/zamowienia/${o.id}`} className="adm-list-row">
        <span><strong>{o.number}</strong><small>{o.customerName} · {dateTime(o.createdAt)}</small></span>
        <span className="adm-right"><b>{money(o.total)}</b><span className={`adm-badge s-${o.status}`}>{orderStatusLabels[o.status]}</span></span>
      </Link></li>)}</ul> : <p className="adm-muted">Jeszcze nie ma zamówień.</p>}
    </section>
  </>;
}
