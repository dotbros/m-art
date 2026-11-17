import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { orders, ORDER_STATUSES, type OrderStatus } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { money } from "@/lib/catalog";
import { dateTime, orderStatusLabels } from "../../labels";

export default async function OrdersPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireAdmin();
  const status = (await searchParams).status as OrderStatus | undefined;
  const valid = status && ORDER_STATUSES.includes(status) ? status : undefined;
  const rows = await (await getDb()).select().from(orders).where(valid ? eq(orders.status, valid) : undefined).orderBy(desc(orders.createdAt)).limit(200);
  return <>
    <div className="adm-head"><div><p className="adm-eyebrow">SPRZEDAŻ</p><h1>Zamówienia</h1></div></div>
    <nav className="adm-chips" aria-label="Filtr statusu">
      <Link href="/admin/zamowienia" className={!valid ? "active" : ""}>Wszystkie</Link>
      {ORDER_STATUSES.map((s) => <Link key={s} href={`/admin/zamowienia?status=${s}`} className={valid === s ? "active" : ""}>{orderStatusLabels[s]}</Link>)}
    </nav>
    {rows.length ? <ul className="adm-list adm-card">{rows.map((o) => <li key={o.id}><Link href={`/admin/zamowienia/${o.id}`} className="adm-list-row">
      <span><strong>{o.number}</strong><small>{o.customerName} · {dateTime(o.createdAt)}</small></span>
      <span className="adm-right"><b>{money(o.total)}</b><span className={`adm-badge s-${o.status}`}>{orderStatusLabels[o.status]}</span></span>
    </Link></li>)}</ul> : <div className="adm-card adm-empty"><p>Brak zamówień{valid ? " o tym statusie" : ""}.</p></div>}
  </>;
}
