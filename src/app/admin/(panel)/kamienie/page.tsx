import Link from "next/link";
import { asc } from "drizzle-orm";
import { getDb } from "@/db";
import { products, stones } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

export default async function StonesAdminPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireAdmin();
  const params = await searchParams;
  const db = await getDb();
  const [rows, productStones] = await Promise.all([
    db.select().from(stones).orderBy(asc(stones.position), asc(stones.name)),
    db.select({ stones: products.stones }).from(products),
  ]);
  const usage = new Map<string, number>();
  for (const p of productStones) for (const s of p.stones) usage.set(s, (usage.get(s) || 0) + 1);

  return <>
    <div className="adm-head"><div><p className="adm-eyebrow">KATALOG</p><h1>Kamienie</h1></div><Link href="/admin/kamienie/nowy" className="adm-btn adm-btn-primary">+ Nowy</Link></div>
    {params.zapisano && <p className="adm-alert adm-alert-ok" role="status">Kamień został zapisany.</p>}
    {params.usunieto && <p className="adm-alert adm-alert-ok" role="status">Kamień został usunięty.</p>}
    <p className="adm-muted adm-intro">Opisy i zdjęcia kamieni tworzą strony „Każdy kamień ma swoją historię”. Kamień wpisany przy produkcie pojawi się tu sam — uzupełnij mu opis i zdjęcie.</p>
    {rows.length ? <ul className="adm-product-list">{rows.map((s) => {
      const missing = !s.description || !s.images.length;
      return <li key={s.id} className={`adm-product ${s.isActive ? "" : "is-hidden"}`}>
        <Link href={`/admin/kamienie/${s.id}`} className="adm-product-main">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {s.images[0] ? <img src={s.images[0]} alt="" width={64} height={80} loading="lazy"/> : <span className="adm-noimg">brak<br/>zdjęcia</span>}
          <span className="adm-product-info"><strong>{s.name}</strong><small>{s.caption || "bez podpisu"}</small>
            <span className="adm-product-meta"><span>{usage.get(s.name) || 0} prod.</span>
              {s.showOnHome && <span className="adm-badge s-confirmed">Strona główna</span>}
              {missing && <span className="adm-badge s-awaiting_confirmation">Uzupełnij opis/zdjęcie</span>}
              {!s.isActive && <span className="adm-badge s-cancelled">Ukryty</span>}</span></span>
        </Link>
      </li>;
    })}</ul> : <div className="adm-card adm-empty"><p>Nie ma jeszcze kamieni.</p><Link href="/admin/kamienie/nowy" className="adm-btn adm-btn-primary">Dodaj pierwszy kamień</Link></div>}
  </>;
}
