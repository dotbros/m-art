import Link from "next/link";
import { and, asc, eq, ilike, lte, or, sql, type SQL } from "drizzle-orm";
import { getDb } from "@/db";
import { categories, products } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { money } from "@/lib/catalog";
import { toggleProductAction } from "../../actions";

export default async function ProductsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireAdmin();
  const params = await searchParams;
  const db = await getDb();
  const q = (params.q || "").trim().slice(0, 80);
  const filters: SQL[] = [];
  if (q) filters.push(or(ilike(products.name, `%${q}%`), sql`array_to_string(${products.stones}, ' ') ILIKE ${`%${q}%`}`, ilike(products.subtitle, `%${q}%`))!);
  if (params.kategoria) filters.push(eq(products.categoryId, Number(params.kategoria)));
  if (params.stan === "niski") filters.push(lte(products.stock, 2));
  const [rows, categoryRows] = await Promise.all([
    db.select({ p: products, category: categories.name }).from(products).leftJoin(categories, eq(products.categoryId, categories.id))
      .where(filters.length ? and(...filters) : undefined).orderBy(asc(products.position), asc(products.name)),
    db.select({ id: categories.id, name: categories.name }).from(categories).orderBy(asc(categories.position)),
  ]);

  return <>
    <div className="adm-head"><div><p className="adm-eyebrow">KATALOG</p><h1>Produkty</h1></div><Link href="/admin/produkty/nowy" className="adm-btn adm-btn-primary">+ Nowy</Link></div>
    {params.zapisano && <p className="adm-alert adm-alert-ok" role="status">Produkt został zapisany.</p>}
    {params.usunieto && <p className="adm-alert adm-alert-ok" role="status">Produkt został usunięty.</p>}
    <form className="adm-filters" role="search">
      <input type="search" name="q" defaultValue={q} placeholder="Szukaj: nazwa, kamień…" aria-label="Szukaj produktów"/>
      <select name="kategoria" defaultValue={params.kategoria || ""} aria-label="Kategoria"><option value="">Wszystkie kategorie</option>{categoryRows.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
      <button type="submit" className="adm-btn">Filtruj</button>
    </form>
    {rows.length ? <ul className="adm-product-list">{rows.map(({ p, category }) => <li key={p.id} className={`adm-product ${p.isActive ? "" : "is-hidden"}`}>
      <Link href={`/admin/produkty/${p.id}`} className="adm-product-main">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {p.image ? <img src={p.image} alt="" width={64} height={80} loading="lazy"/> : <span className="adm-noimg">brak<br/>zdjęcia</span>}
        <span className="adm-product-info"><strong>{p.name}</strong><small>{category || "bez kategorii"}{p.stones.length ? ` · ${p.stones.join(", ")}` : ""}</small>
          <span className="adm-product-meta"><b>{money(p.price)}</b><span className={p.stock <= 2 ? "adm-stock-low" : ""}>{p.stock} szt.</span>{!p.isActive && <span className="adm-badge s-cancelled">Ukryty</span>}</span></span>
      </Link>
      <form action={toggleProductAction}><input type="hidden" name="id" value={p.id}/><button type="submit" className="adm-toggle-btn" aria-label={p.isActive ? `Ukryj ${p.name} w sklepie` : `Pokaż ${p.name} w sklepie`}>{p.isActive ? "Ukryj" : "Pokaż"}</button></form>
    </li>)}</ul> : <div className="adm-card adm-empty"><p>{q || params.kategoria || params.stan ? "Brak produktów dla wybranych filtrów." : "Nie masz jeszcze produktów."}</p><Link href="/admin/produkty/nowy" className="adm-btn adm-btn-primary">Dodaj produkt</Link></div>}
  </>;
}
