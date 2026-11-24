"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { deleteOrdersAction } from "@/app/admin/actions";
import { FormMessage, SubmitButton } from "./ui";

export type OrderRow = { id: string; number: string; customer: string; date: string; total: string; status: string; statusLabel: string; settled: boolean; returnsStock: boolean };

/**
 * Lista zamówień z zaznaczaniem do usunięcia (np. zamówienia testowe).
 * Pasek „Usuń zaznaczone” pojawia się po zaznaczeniu; usunięcie wymaga potwierdzenia.
 */
export function OrdersList({ rows }: { rows: OrderRow[] }) {
  const [state, action] = useActionState(deleteOrdersAction, {});
  const [selected, setSelected] = useState<string[]>([]);
  const [confirming, setConfirming] = useState(false);
  const toggle = (id: string) => { setConfirming(false); setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id])); };
  const all = selected.length === rows.length;
  const chosen = rows.filter((r) => selected.includes(r.id));
  const settled = chosen.filter((r) => r.settled).length;
  const restock = chosen.filter((r) => r.returnsStock).length;

  return <form action={action}>
    <FormMessage state={state}/>
    <label className="adm-switch adm-select-all"><input type="checkbox" checked={all} onChange={() => { setConfirming(false); setSelected(all ? [] : rows.map((r) => r.id)); }}/><span>Zaznacz wszystkie ({rows.length})</span></label>
    <ul className="adm-list adm-card">{rows.map((o) => <li key={o.id} className={`adm-select-row ${selected.includes(o.id) ? "is-selected" : ""}`}>
      <label className="adm-select-check"><input type="checkbox" name="id" value={o.id} checked={selected.includes(o.id)} onChange={() => toggle(o.id)} aria-label={`Zaznacz zamówienie ${o.number}`}/></label>
      <Link href={`/admin/zamowienia/${o.id}`} className="adm-list-row">
        <span><strong>{o.number}</strong><small>{o.customer} · {o.date}</small></span>
        <span className="adm-right"><b>{o.total}</b><span className={`adm-badge s-${o.status}`}>{o.statusLabel}</span></span>
      </Link>
    </li>)}</ul>

    {selected.length > 0 && <div className="adm-bulk-bar" role="region" aria-label="Działania na zaznaczonych zamówieniach">
      {confirming ? <div className="adm-bulk-confirm">
        <p>Usunąć {selected.length} {selected.length === 1 ? "zamówienie" : "zamówienia/zamówień"}? Tej operacji nie można cofnąć.
          {restock > 0 && ` Produkty z ${restock} niewysłanych zamówień wrócą na stan.`}
          {settled > 0 && <strong> UWAGA: {settled} z nich jest opłaconych lub zrealizowanych — to dokumenty sprzedaży, zwykle wymagane do księgowości.</strong>}</p>
        <div className="adm-row"><button type="button" className="adm-btn" onClick={() => setConfirming(false)}>Anuluj</button><SubmitButton className="adm-btn adm-btn-danger" pendingText="Usuwanie…">Tak, usuń</SubmitButton></div>
      </div> : <div className="adm-row adm-bulk-row">
        <span>Zaznaczono: <strong>{selected.length}</strong></span>
        <button type="button" className="adm-btn" onClick={() => setSelected([])}>Odznacz</button>
        <button type="button" className="adm-btn adm-btn-danger" onClick={() => setConfirming(true)}>Usuń zaznaczone</button>
      </div>}
    </div>}
  </form>;
}
