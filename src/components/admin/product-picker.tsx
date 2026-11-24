"use client";

import { useMemo, useState } from "react";
import { money } from "@/lib/catalog";

export type PickerProduct = { id: string; name: string; image: string; price: number; isActive: boolean };
const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replaceAll("ł", "l").toLowerCase();

/**
 * Wybór produktów do kolekcji slajdu: wyszukiwarka, lista ze zdjęciem i ceną, pola do zaznaczenia,
 * licznik i „pokaż tylko zaznaczone”. Każdy zaznaczony produkt → ukryte pole `productIds` (w kolejności zaznaczenia).
 */
export function ProductPicker({ products, initial, error }: { products: PickerProduct[]; initial: string[]; error?: string }) {
  const [selected, setSelected] = useState<string[]>(initial.filter((id) => products.some((p) => p.id === id)));
  const [query, setQuery] = useState("");
  const [onlySelected, setOnlySelected] = useState(false);
  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const visible = useMemo(() => products.filter((p) => (!onlySelected || selected.includes(p.id)) && (!query.trim() || norm(p.name).includes(norm(query.trim())))), [products, query, onlySelected, selected]);

  return <div className={`adm-field adm-picker ${error ? "has-error" : ""}`}>
    {selected.map((id) => <input key={id} type="hidden" name="productIds" value={id}/>)}
    <div className="adm-picker-head">
      <label htmlFor="picker-search">Produkty w kolekcji</label>
      <span className="adm-badge s-confirmed" aria-live="polite">Wybrano: {selected.length}</span>
    </div>
    <div className="adm-picker-tools">
      <input id="picker-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Szukaj produktu…" autoComplete="off"/>
      <label className="adm-switch"><input type="checkbox" checked={onlySelected} onChange={(e) => setOnlySelected(e.target.checked)}/><span>Tylko zaznaczone</span></label>
    </div>
    <ul className="adm-picker-list" role="list">{visible.map((p) => <li key={p.id}>
      <label className={`adm-picker-item ${selected.includes(p.id) ? "is-selected" : ""}`}>
        <input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggle(p.id)} aria-label={`Dodaj do kolekcji: ${p.name}`}/>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {p.image ? <img src={p.image} alt="" width={48} height={60} loading="lazy"/> : <span className="adm-noimg">—</span>}
        <span className="adm-picker-info"><strong>{p.name}</strong><small>{money(p.price)}{!p.isActive && " · ukryty w sklepie"}</small></span>
      </label>
    </li>)}
      {!visible.length && <li className="adm-hint adm-picker-empty">Brak produktów dla tego wyszukiwania.</li>}
    </ul>
    {error ? <small className="adm-error" role="alert">{error}</small>
      : <small className="adm-hint">„Odkryj biżuterię” na tym slajdzie pokaże tylko zaznaczone produkty (ukryte w sklepie nie będą widoczne).</small>}
  </div>;
}
