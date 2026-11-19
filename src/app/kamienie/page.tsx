import Link from "next/link";
import type { Metadata } from "next";
import { getDb } from "@/db";
import { getActiveStones } from "@/lib/stones";
import { SiteChrome } from "@/components/site-chrome";
import { Icon } from "@/components/icons";
import "./stones.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Kamienie naturalne — każdy ma swoją historię | M.art",
  description: "Poznaj kamienie naturalne, z których powstaje biżuteria M.art: ich historię, wygląd i znaczenie.",
};

export default async function StonesIndexPage() {
  const stones = await getActiveStones(await getDb());
  return <SiteChrome>
    <section className="stones-page container">
      <p className="eyebrow">NATURA NIE TWORZY KOPII</p>
      <h1>Kamienie <em>naturalne.</em></h1>
      <p className="stones-page-lead">Każdy kamień ma swój kolor, rysunek i historię. Poznaj je bliżej i znajdź ten, w którym zobaczysz cząstkę siebie.</p>
      {stones.length ? <div className="stones-index-grid">{stones.map((s) => <Link key={s.slug} href={`/kamienie/${s.slug}`} className="stone-card">
        <span className="stone-image"><img src={s.images[0] || "/images/necklace-jasper.svg"} alt={`Kamień naturalny — ${s.name}`} loading="lazy"/><span><Icon name="arrow" size={22}/></span></span>
        <h3>{s.name}</h3>{s.caption && <p>{s.caption}</p>}
      </Link>)}</div> : <p className="stones-page-lead">Wkrótce opiszemy tu nasze kamienie.</p>}
    </section>
  </SiteChrome>;
}
