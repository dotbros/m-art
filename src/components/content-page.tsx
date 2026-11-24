import type { ContentPage } from "@/lib/pages";
import { parseBody } from "@/lib/pages";
import { SiteChrome } from "./site-chrome";
import { PageGallery } from "./page-gallery";

/** Podstrona treściowa: zdjęcie nagłówkowe (images[0]), tytuł, wstęp, treść ze śródtytułami, galeria (images[1..]). */
export function ContentPageView({ page }: { page: ContentPage }) {
  const [header, ...gallery] = page.images;
  const blocks = parseBody(page.body);
  return <SiteChrome>
    <article className="content-page">
      {header && <div className="content-hero">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={header} alt={`${page.title} ${page.titleAccent}`.trim()} fetchPriority="high"/></div>}
      <div className="content-body container">
        {page.eyebrow && <p className="eyebrow">{page.eyebrow}</p>}
        <h1>{page.title}{page.titleAccent && <> <em>{page.titleAccent}</em></>}</h1>
        {page.intro && <p className="content-intro">{page.intro}</p>}
        {blocks.map((block, i) => block.type === "heading"
          ? <h2 key={i}>{block.text}</h2>
          : <p key={i}>{block.lines.map((line, j) => <span key={j}>{j > 0 && <br/>}{line}</span>)}</p>)}
      </div>
      {gallery.length > 0 && <section className="content-gallery container" aria-label="Galeria">
        <PageGallery images={gallery} title={page.title}/>
      </section>}
    </article>
  </SiteChrome>;
}
