import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { orderItems, orders } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { money } from "@/lib/catalog";
import { OrderForm } from "@/components/admin/order-form";
import { DangerForm } from "@/components/admin/ui";
import { deleteOrdersAction } from "../../../actions";
import { deleteOrderWarning } from "../../../labels";
import { dateTime, deliveryLabels, orderStatusLabels, paymentStatusLabels } from "../../../labels";

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const id = (await params).id;
  const db = await getDb();
  const [[order], items] = await Promise.all([db.select().from(orders).where(eq(orders.id, id)), db.select().from(orderItems).where(eq(orderItems.orderId, id))]);
  if (!order) notFound();
  return <>
    <div className="adm-head"><div><Link href="/admin/zamowienia" className="adm-back">← Zamówienia</Link><h1>{order.number}</h1><p className="adm-muted">{dateTime(order.createdAt)} · <span className={`adm-badge s-${order.status}`}>{orderStatusLabels[order.status]}</span></p></div></div>
    <div className="adm-two-col">
      <section className="adm-card">
        <h2>Klient</h2>
        <dl className="adm-dl">
          <div><dt>Imię i nazwisko</dt><dd>{order.customerName}</dd></div>
          <div><dt>E-mail</dt><dd><a href={`mailto:${order.email}`}>{order.email}</a></dd></div>
          <div><dt>Telefon</dt><dd><a href={`tel:${order.phone.replace(/\s/g, "")}`}>{order.phone}</a></dd></div>
          <div><dt>Adres</dt><dd>{order.address.street}<br/>{order.address.postalCode} {order.address.city}</dd></div>
          <div><dt>Dostawa</dt><dd>{deliveryLabels[order.delivery] || order.delivery}</dd></div>
          <div><dt>Płatność</dt><dd>{paymentStatusLabels[order.paymentStatus]} ({order.paymentProvider})</dd></div>
        </dl>
      </section>
      <section className="adm-card">
        <h2>Produkty</h2>
        <ul className="adm-order-items">{items.map((item) => <li key={item.id}><span>{item.productName} <small>× {item.quantity}</small></span><b>{money(item.unitPrice * item.quantity)}</b></li>)}</ul>
        <dl className="adm-totals"><div><dt>Produkty</dt><dd>{money(order.subtotal)}</dd></div><div><dt>Dostawa</dt><dd>{order.shipping ? money(order.shipping) : "Gratis"}</dd></div><div className="total"><dt>Razem</dt><dd>{money(order.total)}</dd></div></dl>
      </section>
    </div>
    <OrderForm order={{ id: order.id, status: order.status, paymentStatus: order.paymentStatus, trackingNumber: order.trackingNumber ?? "", adminNote: order.adminNote }}/>
    <DangerForm action={deleteOrdersAction} id={order.id} label="Usuń zamówienie" confirmText={deleteOrderWarning(order.number, order.status, order.paymentStatus)}/>
  </>;
}
