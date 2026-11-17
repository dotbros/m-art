import Link from "next/link";
import { asc, count, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { categories, products } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

export default async function CategoriesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireAdmin();
  const params = await searchParams;
  const db = await getDb();
  const rows = await db.select({ id: categories.id, name: categories.name, slug: categories.slug, position: categories.position, isActive: categories.isActive, productCount: count(products.id) })
    .from(categories).leftJoin(products, eq(products.categoryId, categories.id))
    .groupBy(categories.id).orderBy(asc(categories.position), asc(categories.name));
  return <>
    <div className="adm-head"><div><p className="adm-eyebrow">KATALOG</p><h1>Kategorie</h1></div><Link href="/admin/kategorie/nowa" className="adm-btn adm-btn-primary">+ Nowa</Link></div>
    {params.zapisano && <p className="adm-alert adm-alert-ok" role="status">Kategoria została zapisana.</p>}
    {params.usunieto && <p className="adm-alert adm-alert-ok" role="status">Kategoria została usunięta.</p>}
    {rows.length ? <ul className="adm-list adm-card">{rows.map((c) => <li key={c.id}><Link href={`/admin/kategorie/${c.id}`} className="adm-list-row">
      <span><strong>{c.name}</strong><small>/{c.slug} · kolejność {c.position}</small></span>
      <span className="adm-right"><span className="adm-count">{c.productCount} prod.</span>{!c.isActive && <span className="adm-badge s-cancelled">Ukryta</span>}</span>
    </Link></li>)}</ul> : <div className="adm-card adm-empty"><p>Nie masz jeszcze kategorii.</p><Link href="/admin/kategorie/nowa" className="adm-btn adm-btn-primary">Dodaj pierwszą kategorię</Link></div>}
  </>;
}
