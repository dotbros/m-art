import Link from "next/link";
import { asc } from "drizzle-orm";
import { getDb } from "@/db";
import { heroSlides, pages } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { MAX_HERO_SLIDES } from "@/lib/hero-shared";
import { CONTENT_PAGES, isPageSlug } from "@/lib/pages";
import { dateTime } from "../../labels";
import { toggleHeroSlideAction } from "../../actions";

export default async function HomepageAdminPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireAdmin();
  const params = await searchParams;
  const db = await getDb();
  const [slides, pageRows] = await Promise.all([
    db.select().from(heroSlides).orderBy(asc(heroSlides.position), asc(heroSlides.id)),
    db.select({ slug: pages.slug, images: pages.images, teaserImage: pages.teaserImage, updatedAt: pages.updatedAt }).from(pages),
  ]);
  const active = slides.filter((s) => s.isActive).length;
  return <>
    <div className="adm-head"><div><p className="adm-eyebrow">STRONA GŁÓWNA</p><h1>Slajdy HERO</h1></div><Link href="/admin/strona/nowy" className="adm-btn adm-btn-primary">+ Nowy</Link></div>
    {params.zapisano && <p className="adm-alert adm-alert-ok" role="status">Slajd został zapisany — zmiana jest już widoczna w sklepie.</p>}
    {params.usunieto && <p className="adm-alert adm-alert-ok" role="status">Slajd został usunięty.</p>}
    {params["zapisano-strone"] && <p className="adm-alert adm-alert-ok" role="status">Podstrona została zapisana — zmiana jest już widoczna w sklepie.</p>}
    <p className="adm-muted adm-intro">Pierwsza sekcja strony głównej. Widoczne slajdy: <strong>{active}</strong> z maks. {MAX_HERO_SLIDES}. Klient przełącza je kreskami pod tekstem.</p>
    {slides.length ? <ul className="adm-product-list">{slides.map((s) => <li key={s.id} className={`adm-product ${s.isActive ? "" : "is-hidden"}`}>
      <Link href={`/admin/strona/${s.id}`} className="adm-product-main">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={s.mediaType === "video" ? (s.posterUrl || "/images/hero-jewelry.svg") : s.mediaUrl} alt="" width={64} height={80} loading="lazy"/>
        <span className="adm-product-info"><strong>{s.title} {s.titleAccent && <em>{s.titleAccent}</em>}</strong>
          <small>{s.eyebrow || "bez nadtytułu"}</small>
          <span className="adm-product-meta"><span className="adm-badge">{s.mediaType === "video" ? "▶ Film" : "Zdjęcie"}</span><span>kolejność {s.position}</span>{!s.isActive && <span className="adm-badge s-cancelled">Ukryty</span>}</span></span>
      </Link>
      <form action={toggleHeroSlideAction}><input type="hidden" name="id" value={s.id}/><button type="submit" className="adm-toggle-btn" aria-label={s.isActive ? `Ukryj slajd ${s.title}` : `Pokaż slajd ${s.title}`}>{s.isActive ? "Ukryj" : "Pokaż"}</button></form>
    </li>)}</ul> : <div className="adm-card adm-empty"><p>Nie ma jeszcze slajdów — sklep pokazuje slajd domyślny.</p><Link href="/admin/strona/nowy" className="adm-btn adm-btn-primary">Dodaj pierwszy slajd</Link></div>}

    <div className="adm-head adm-head-section"><div><p className="adm-eyebrow">TREŚCI</p><h2 className="adm-h1-like">Podstrony</h2></div></div>
    <ul className="adm-product-list">{pageRows.filter((p) => isPageSlug(p.slug)).map((p) => {
      const meta = CONTENT_PAGES[p.slug as keyof typeof CONTENT_PAGES];
      const thumb = p.teaserImage || p.images[0];
      return <li key={p.slug} className="adm-product">
        <Link href={`/admin/strona/podstrony/${p.slug}`} className="adm-product-main">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {thumb ? <img src={thumb} alt="" width={64} height={80} loading="lazy"/> : <span className="adm-noimg">brak<br/>zdjęcia</span>}
          <span className="adm-product-info"><strong>{meta.label}</strong><small>{meta.path} · zmieniono {dateTime(p.updatedAt)}</small>
            <span className="adm-product-meta"><span>{p.images.length} zdj.</span>{meta.hasTeaser && <span className="adm-badge s-confirmed">Zajawka na stronie głównej</span>}</span></span>
        </Link>
      </li>;
    })}</ul>
  </>;
}
