import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDb } from "@/db";
import { money } from "@/lib/catalog";
import { getActiveStones, getStonePage } from "@/lib/stones";
import { SiteChrome } from "@/components/site-chrome";
import { StoneGallery } from "@/components/stone-gallery";
import { Icon } from "@/components/icons";
import "../stones.css";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = await getStonePage(await getDb(), (await params).slug);
  if (!page) return { title: "Kamień nie istnieje | M.art" };
  const { stone } = page;
  const description = (stone.caption ? `${stone.caption}. ` : "") + stone.description.replace(/\s+/g, " ").slice(0, 150);
  return { title: `${stone.name} — kamień naturalny | M.art`, description, openGraph: { title: `${stone.name} | M.art`, description, images: stone.images[0] ? [stone.images[0]] : [] } };
}

export default async function StonePage({ params }: Props) {
  const db = await getDb();
  const page = await getStonePage(db, (await params).slug);
  if (!page) notFound();
  const { stone, products } = page;
  const others = (await getActiveStones(db)).filter((s) => s.slug !== stone.slug).slice(0, 4);
  const paragraphs = stone.description.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

  return <SiteChrome>
    <nav className="stone-breadcrumb container" aria-label="Ścieżka"><Link href="/kamienie">Kamienie naturalne</Link><span aria-hidden="true">/</span><span aria-current="page">{stone.name}</span></nav>
    <article className="stone-hero container">
      <StoneGallery images={stone.images.length ? stone.images : ["/images/necklace-jasper.svg"]} name={stone.name}/>
      <div className="stone-copy">
        <p className="eyebrow">KAMIEŃ NATURALNY</p>
        <h1>{stone.name}</h1>
        {stone.caption && <p className="stone-caption">{stone.caption}</p>}
        <div className="stone-description">{paragraphs.length ? paragraphs.map((p, i) => <p key={i}>{p.split("\n").map((line, j) => <span key={j}>{j > 0 && <br/>}{line}</span>)}</p>) : <p>Opis tego kamienia pojawi się wkrótce.</p>}</div>
        {products.length > 0 && <Link className="button button-dark stone-cta" href="#bizuteria">Zobacz biżuterię z tym kamieniem <Icon name="arrow-down" size={18}/></Link>}
      </div>
    </article>

    <section className="stone-products container" id="bizuteria">
      <p className="eyebrow">WYBRANE Z MIŁOŚCIĄ</p>
      <h2>Biżuteria z kamieniem <em>{stone.name.toLocaleLowerCase("pl-PL")}</em></h2>
      {products.length ? <div className="stone-product-grid">{products.map((p) => <Link key={p.id} href={`/?produkt=${encodeURIComponent(p.id)}`} className="stone-product">
        <span className="stone-product-image"><img src={p.image} alt={p.subtitle || p.name} loading="lazy"/>{!p.stock && <span className="product-badge">WKRÓTCE POWRÓCI</span>}</span>
        <span className="stone-product-info"><strong>{p.name}</strong><span>{p.subtitle}</span><b>{p.compareAtPrice && <s className="compare-price">{money(p.compareAtPrice)}</s>}{money(p.price)}</b></span>
      </Link>)}</div> : <div className="stone-empty"><p>Pracujemy nad nowymi projektami z tym kamieniem.</p><Link className="button button-outline" href="/">Zobacz całą kolekcję <Icon name="arrow" size={18}/></Link></div>}
    </section>

    {others.length > 0 && <section className="stone-others container">
      <h2>Poznaj inne <em>kamienie</em></h2>
      <div className="stones-index-grid">{others.map((s) => <Link key={s.slug} href={`/kamienie/${s.slug}`} className="stone-card">
        <span className="stone-image"><img src={s.images[0] || "/images/necklace-jasper.svg"} alt={`Kamień naturalny — ${s.name}`} loading="lazy"/><span><Icon name="arrow" size={22}/></span></span>
        <h3>{s.name}</h3>{s.caption && <p>{s.caption}</p>}
      </Link>)}</div>
    </section>}
  </SiteChrome>;
}
