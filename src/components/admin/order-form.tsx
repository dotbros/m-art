"use client";

import { useActionState } from "react";
import { updateOrderAction } from "@/app/admin/actions";
import { ORDER_STATUSES, PAYMENT_STATUSES, type OrderStatus, type PaymentStatus } from "@/lib/statuses";
import { orderStatusLabels, paymentStatusLabels } from "@/app/admin/labels";
import { Field, FormMessage, SubmitButton } from "./ui";

export function OrderForm({ order }: { order: { id: string; status: OrderStatus; paymentStatus: PaymentStatus; trackingNumber: string; adminNote: string } }) {
  const [state, action] = useActionState(updateOrderAction, {});
  return <form action={action} className="adm-form adm-card">
    <h2>Obsługa zamówienia</h2>
    <FormMessage state={state}/>
    <input type="hidden" name="id" value={order.id}/>
    <div className="adm-grid-2">
      <Field label="Status zamówienia" name="status" hint="Anulowanie zwraca produkty na stan."><select id="status" name="status" defaultValue={order.status}>{ORDER_STATUSES.map((s) => <option key={s} value={s}>{orderStatusLabels[s]}</option>)}</select></Field>
      <Field label="Status płatności" name="paymentStatus"><select id="paymentStatus" name="paymentStatus" defaultValue={order.paymentStatus}>{PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{paymentStatusLabels[s]}</option>)}</select></Field>
    </div>
    <Field label="Numer przesyłki" name="trackingNumber"><input id="trackingNumber" name="trackingNumber" defaultValue={order.trackingNumber} maxLength={100} autoCapitalize="characters"/></Field>
    <Field label="Notatka wewnętrzna" name="adminNote" hint="Widoczna tylko w panelu."><textarea id="adminNote" name="adminNote" rows={3} maxLength={2000} defaultValue={order.adminNote}/></Field>
    <div className="adm-sticky-actions"><SubmitButton>Zapisz zmiany</SubmitButton></div>
  </form>;
}
