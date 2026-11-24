import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { orders, ORDER_STATUSES, type OrderStatus } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { money } from "@/lib/catalog";
import { OrdersList } from "@/components/admin/orders-list";
import { dateTime, orderStatusLabels } from "../../labels";

export default async function OrdersPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireAdmin();
  const params = await searchParams;
  const status = params.status as OrderStatus | undefined;
  const valid = status && ORDER_STATUSES.includes(status) ? status : undefined;
  const rows = await (await getDb()).select().from(orders).where(valid ? eq(orders.status, valid) : undefined).orderBy(desc(orders.createdAt)).limit(200);
  const removed = Number(params.usunieto);
  return <>
    <div className="adm-head"><div><p className="adm-eyebrow">SPRZEDAŻ</p><h1>Zamówienia</h1></div></div>
    {removed > 0 && <p className="adm-alert adm-alert-ok" role="status">Usunięto zamówienia: {removed}.</p>}
    <nav className="adm-chips" aria-label="Filtr statusu">
      <Link href="/admin/zamowienia" className={!valid ? "active" : ""}>Wszystkie</Link>
      {ORDER_STATUSES.map((s) => <Link key={s} href={`/admin/zamowienia?status=${s}`} className={valid === s ? "active" : ""}>{orderStatusLabels[s]}</Link>)}
    </nav>
    {rows.length ? <OrdersList rows={rows.map((o) => ({
      id: o.id, number: o.number, customer: o.customerName, date: dateTime(o.createdAt), total: money(o.total), status: o.status, statusLabel: orderStatusLabels[o.status],
      settled: o.paymentStatus === "paid" || ["paid", "shipped", "completed"].includes(o.status),
      returnsStock: ["awaiting_confirmation", "confirmed", "paid"].includes(o.status),
    }))}/> : <div className="adm-card adm-empty"><p>Brak zamówień{valid ? " o tym statusie" : ""}.</p></div>}
  </>;
}
