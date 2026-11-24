"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { ALL_CATEGORIES, ALL_STONES, FREE_SHIPPING_FROM, MAX_PER_PRODUCT, money, productCountLabel, stoneList, type Product } from "@/lib/catalog";
import { Icon, type IconName } from "./icons";
import { Overlay } from "./overlay";
import { Checkout } from "./checkout";
import { Information, infoTitles } from "./information";
import { HeroMedia } from "./hero-media";
import { StoneCarousel } from "./stone-carousel";
import { ProductGallery } from "./product-gallery";
import { FitTitle } from "./fit-title";
import type { HeroSlide } from "@/lib/hero";
import type { Stone } from "@/lib/stones";
import { HERO_IMAGE_SECONDS, PORTRAIT_BELOW } from "@/lib/hero-shared";

type CartItem = { id: string; quantity: number };
type Panel = "search" | "wishlist" | "cart" | "menu" | "product" | "checkout" | "info" | null;
const normalize = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replaceAll("ł", "l");

function Brand({ footer = false }: { footer?: boolean }) {
  // Logo pracowni (okrągła pieczęć) z public/brand/logo.svg
  // eslint-disable-next-line @next/next/no-img-element
  return <span className={`brand ${footer ? "brand-footer" : ""}`}><img className="brand-logo" src="/brand/logo.svg" alt="M.art — Pracownia Biżuterii" width={1290} height={1219} fetchPriority={footer ? "auto" : "high"} loading={footer ? "lazy" : "eager"}/></span>;
}

export function Shop({ products, categories: categoryNames, slides, homeStones = [], story }: { products: Product[]; categories: string[]; slides: HeroSlide[]; homeStones?: Pick<Stone, "name" | "slug" | "caption" | "images">[]; story?: { image: string | null; title: string; accent: string; text: string } | null }) {
  const categories = useMemo(() => [ALL_CATEGORIES, ...categoryNames], [categoryNames]);
  const stones = useMemo(() => [ALL_STONES, ...Array.from(new Set(products.flatMap((p) => p.stones).filter(Boolean)))], [products]);
  const [panel, setPanel] = useState<Panel>(null);
  const [navOpen, setNavOpen] = useState(false);
  const [slide, setSlide] = useState(0);
  const [heroSound, setHeroSound] = useState(false);
  const [heroHovered, setHeroHovered] = useState(false); // kursor nad HERO (komputer) = pauza automatycznego przełączania
  const [detectedAspect, setDetectedAspect] = useState<Record<number, number>>({}); // proporcje starszych slajdów (bez zapisanych w bazie) // dźwięk filmów HERO — włączany tylko przez klienta
  const [category, setCategory] = useState(ALL_CATEGORIES);
  const [stone, setStone] = useState(ALL_STONES);
  const [sort, setSort] = useState("featured");
  const [showFilters, setShowFilters] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [collectionQuery, setCollectionQuery] = useState("");
  const [slideCollection, setSlideCollection] = useState<{ title: string; ids: string[] } | null>(null); // własna kolekcja ze slajdu HERO
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Product | null>(null);
  const [productQuantity, setProductQuantity] = useState(1);
  const [infoTopic, setInfoTopic] = useState("story");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [storageReady, setStorageReady] = useState(false);
  const [toast, setToast] = useState<{ message: string; cart?: boolean } | null>(null);
  const [newsletterStatus, setNewsletterStatus] = useState("");
  const [newsletterError, setNewsletterError] = useState(false);
  const [newsletterPending, setNewsletterPending] = useState(false);

  useEffect(() => {
    try {
      const savedCart = JSON.parse(localStorage.getItem("mart-cart") || "[]");
      const savedWishlist = JSON.parse(localStorage.getItem("mart-wishlist") || "[]");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- koszyk z localStorage można odczytać dopiero po hydratacji
      if (Array.isArray(savedCart)) setCart(savedCart.filter((item: CartItem) => products.some((product) => product.id === item.id) && Number.isInteger(item.quantity) && item.quantity > 0 && item.quantity <= MAX_PER_PRODUCT));
      if (Array.isArray(savedWishlist)) setWishlist(savedWishlist.filter((id) => typeof id === "string" && products.some((product) => product.id === id)));
    } catch { /* A private browser session can block local storage. */ }
    setStorageReady(true);
  }, [products]);
  // Linki z innych stron sklepu (np. strona kamienia): /?produkt=<id> otwiera kartę produktu, /?koszyk=1 — koszyk.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const product = products.find((p) => p.id === params.get("produkt"));
    if (!product && params.get("koszyk") !== "1") return;
    window.history.replaceState(null, "", window.location.pathname);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- otwarcie okna wskazanego w adresie (jednorazowo po wczytaniu)
    if (product) { setSelected(product); setProductQuantity(1); setPanel("product"); } else setPanel("cart");
  }, [products]);
  useEffect(() => { if (storageReady) { try { localStorage.setItem("mart-cart", JSON.stringify(cart)); localStorage.setItem("mart-wishlist", JSON.stringify(wishlist)); } catch { /* Shopping remains available without browser storage. */ } } }, [cart, wishlist, storageReady]);
  useEffect(() => {
    if (!toast) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- otwarcie koszyka zamyka powiadomienie
    if (panel === "cart" || panel === "checkout") { setToast(null); return; }
    const timer = setTimeout(() => setToast(null), 4200);
    return () => clearTimeout(timer);
  }, [toast, panel]);
  // Gest / przycisk „wstecz” (Android, iPhone) zamyka otwarte okno zamiast opuszczać sklep.
  // Otwarcie okna dodaje jeden wpis do historii; przełączanie między oknami (produkt → koszyk) go nie mnoży.
  const historyEntry = useRef(false);
  useEffect(() => {
    if (panel && !historyEntry.current) { window.history.pushState({ martPanel: true }, ""); historyEntry.current = true; }
    else if (!panel && historyEntry.current) { historyEntry.current = false; window.history.back(); }
  }, [panel]);
  useEffect(() => {
    // Ręczne przywracanie przewijania: cofnięcie wpisu okna nie może przewinąć strony z powrotem.
    if ("scrollRestoration" in window.history) window.history.scrollRestoration = "manual";
    const onPop = () => { if (historyEntry.current) { historyEntry.current = false; setPanel(null); } };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  useEffect(() => {
    if (!navOpen) return;
    const outside = (event: PointerEvent) => { if (!(event.target as Element).closest(".nav-dropdown-wrap")) setNavOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") setNavOpen(false); };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", escape); };
  }, [navOpen]);

  const filteredProducts = useMemo(() => {
    const result = products.filter((product) => (!slideCollection || slideCollection.ids.includes(product.id)) && (category === ALL_CATEGORIES || product.category === category) && (stone === ALL_STONES || product.stones.includes(stone)) && (!collectionQuery || normalize(`${product.name} ${product.subtitle} ${product.stones.join(" ")} ${product.category}`).includes(normalize(collectionQuery))));
    // Własna kolekcja slajdu: kolejność ustalona w panelu (chyba że klient wybierze sortowanie po cenie)
    if (slideCollection && sort === "featured") result.sort((a, b) => slideCollection.ids.indexOf(a.id) - slideCollection.ids.indexOf(b.id));
    if (sort === "price-up") result.sort((a, b) => a.price - b.price);
    if (sort === "price-down") result.sort((a, b) => b.price - a.price);
    return result;
  }, [products, category, stone, collectionQuery, sort, slideCollection]);
  const visibleProducts = showAll || slideCollection || category !== ALL_CATEGORIES || stone !== ALL_STONES || collectionQuery ? filteredProducts : filteredProducts.slice(0, 4);
  const searchResults = products.filter((product) => !search.trim() || normalize(`${product.name} ${product.subtitle} ${product.stones.join(" ")} ${product.category}`).includes(normalize(search.trim())));
  const cartItems = cart.flatMap((item) => { const product = products.find((p) => p.id === item.id); return product ? [{ product, quantity: item.quantity }] : []; });
  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const currentSlide = slides[Math.min(slide, slides.length - 1)];
  const slideProduct = currentSlide.productId ? products.find((p) => p.id === currentSlide.productId) : undefined;
  const pad = (n: number) => String(n).padStart(2, "0");

  // Slajd ze ZDJĘCIEM przechodzi dalej po HERO_IMAGE_SECONDS (film — po zakończeniu). Licznik startuje od nowa
  // przy każdej zmianie slajdu (także ręcznej). Pauza: otwarte okno, kursor nad HERO, „ogranicz ruch”.
  const isImageSlide = currentSlide.mediaType === "image";
  useEffect(() => {
    if (!isImageSlide || slides.length < 2 || panel || heroHovered) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setTimeout(() => setSlide((current) => (current + 1) % slides.length), HERO_IMAGE_SECONDS * 1000);
    return () => clearTimeout(timer);
  }, [slide, isImageSlide, slides.length, panel, heroHovered]);
  // Przesunięcie palcem w bok zmienia slajd HERO (w kółko). Ruch pionowy = zwykłe przewijanie strony.
  // Gest zaczęty przy samej lewej krawędzi zostawiamy systemowi („wstecz” na iPhonie i Androidzie).
  const heroSwipe = useRef<{ x: number; y: number } | null>(null);
  function onHeroTouchStart(event: React.TouchEvent) {
    const t = event.touches[0];
    heroSwipe.current = event.touches.length === 1 && t.clientX > 24 && slides.length > 1 ? { x: t.clientX, y: t.clientY } : null;
  }
  function onHeroTouchEnd(event: React.TouchEvent) {
    const start = heroSwipe.current;
    heroSwipe.current = null;
    if (!start) return;
    const t = event.changedTouches[0];
    const dx = t.clientX - start.x, dy = t.clientY - start.y;
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    setSlide((current) => (current + (dx < 0 ? 1 : -1) + slides.length) % slides.length);
  }

  function goToCollection(nextCategory = ALL_CATEGORIES, nextStone = ALL_STONES, all = false, collection: { title: string; ids: string[] } | null = null) {
    setCategory(nextCategory); setStone(nextStone); setShowAll(all); setCollectionQuery(""); setSlideCollection(collection); setPanel(null); setNavOpen(false);
    requestAnimationFrame(() => document.getElementById("kolekcja")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }
  /** „Odkryj biżuterię” na slajdzie: własna kolekcja produktów, produkty z kamieniem albo cała kolekcja. */
  function discoverSlide(s: HeroSlide) {
    if (s.productIds.length) goToCollection(ALL_CATEGORIES, ALL_STONES, true, { title: `${s.title} ${s.titleAccent}`.trim().replace(/[.,]$/, ""), ids: s.productIds });
    else goToCollection(ALL_CATEGORIES, s.stone && stones.includes(s.stone) ? s.stone : ALL_STONES);
  }
  function openProduct(product: Product) { setSelected(product); setProductQuantity(1); setPanel("product"); }
  function showInfo(topic: string) { setInfoTopic(topic); setPanel("info"); setNavOpen(false); }
  function toggleWishlist(id: string) { setWishlist((current) => current.includes(id) ? current.filter((savedId) => savedId !== id) : [...current, id]); }
  function addToCart(product: Product, quantity = 1) {
    const existing = cart.find((item) => item.id === product.id)?.quantity || 0;
    const maximum = Math.min(10, product.stock);
    if (existing >= maximum) { setToast({ message: product.stock === 0 ? "Ten mały skarb jest chwilowo niedostępny." : "Masz już maksymalną dostępną liczbę sztuk." }); return; }
    setCart((current) => { const found = current.find((item) => item.id === product.id); return found ? current.map((item) => item.id === product.id ? { ...item, quantity: Math.min(maximum, item.quantity + quantity) } : item) : [...current, { id: product.id, quantity: Math.min(quantity, maximum) }]; });
    setToast({ message: `„${product.name}” jest w Twoim koszyku.`, cart: true });
  }
  function changeQuantity(id: string, amount: number) { setCart((current) => current.map((item) => item.id === id ? { ...item, quantity: Math.min(10, products.find((p) => p.id === id)?.stock || 1, item.quantity + amount) } : item).filter((item) => item.quantity > 0)); }
  async function subscribe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setNewsletterPending(true); setNewsletterError(false); setNewsletterStatus("");
    const form = event.currentTarget; const data = new FormData(form);
    try {
      const response = await fetch("/api/newsletter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: data.get("email"), consent: data.get("consent") === "on" }) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error); setNewsletterStatus(result.message); form.reset();
    } catch (err) { setNewsletterError(true); setNewsletterStatus(err instanceof Error ? err.message : "Spróbuj ponownie za chwilę."); }
    finally { setNewsletterPending(false); }
  }

  return <>
    <div className="announcement"><span><Icon name="gift" size={14}/> Darmowa dostawa od 299 zł</span><span className="announcement-divider"/><span className="announcement-extra">Małe dzieła, wielkie emocje</span></div>
    <header className="site-header"><div className="header-inner container">
      <nav className="desktop-nav" aria-label="Nawigacja główna"><button onClick={() => goToCollection()}>Biżuteria <Icon name="chevron" size={12}/></button><div className="nav-dropdown-wrap"><button aria-expanded={navOpen} onClick={() => setNavOpen(!navOpen)}>Kamienie naturalne <Icon name="chevron" size={12}/></button>{navOpen && <div className="nav-dropdown"><p>ODKRYJ SWÓJ KAMIEŃ</p>{stones.slice(1).map((name) => <button key={name} onClick={() => goToCollection(ALL_CATEGORIES, name)}>{name}<Icon name="arrow" size={15}/></button>)}</div>}</div><Link href="/pracownia">O pracowni</Link></nav>
      <div className="mobile-header-actions"><button className="icon-button" aria-label="Otwórz menu" onClick={() => setPanel("menu")}><Icon name="menu"/></button><button className="icon-button" aria-label="Szukaj biżuterii" onClick={() => setPanel("search")}><Icon name="search" size={21}/></button></div>
      <a className="brand-link" href="#" aria-label="M.art — strona główna" onClick={(event) => { event.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}><Brand/></a>
      <div className="header-actions"><button className="icon-button desktop-search" aria-label="Szukaj biżuterii" onClick={() => setPanel("search")}><Icon name="search"/></button><button className="icon-button" aria-label={`Ulubione, ${wishlist.length} produktów`} onClick={() => setPanel("wishlist")}><Icon name="heart"/>{wishlist.length > 0 && <span className="tiny-count">{wishlist.length}</span>}</button><span className="header-action-divider"/><button className="cart-toggle" aria-label={`Koszyk, ${cartCount} produktów`} onClick={() => setPanel("cart")}><Icon name="bag"/><span className="cart-text">Koszyk</span><span className="cart-count">{cartCount}</span></button></div>
    </div></header>

    <main>
      <section className={`hero hero-slide-${slide === 0 ? 0 : 1} ${currentSlide.mediaType === "video" ? "hero-has-video" : ""} ${(currentSlide.aspect ?? detectedAspect[currentSlide.id] ?? 1.5) < PORTRAIT_BELOW ? "hero-portrait" : ""}`} aria-label="Nowa kolekcja M.art" aria-roledescription="karuzela" data-ready={storageReady ? "1" : undefined} onTouchStart={onHeroTouchStart} onTouchEnd={onHeroTouchEnd} onTouchCancel={() => { heroSwipe.current = null; }} onPointerEnter={(e) => { if (e.pointerType === "mouse") setHeroHovered(true); }} onPointerLeave={(e) => { if (e.pointerType === "mouse") setHeroHovered(false); }}>
        <HeroMedia key={currentSlide.id} slide={currentSlide} sound={{ on: heroSound, set: setHeroSound }} onAspect={currentSlide.aspect === null ? (a) => setDetectedAspect((d) => ({ ...d, [currentSlide.id]: a })) : undefined} onEnded={slides.length > 1 ? () => setSlide((current) => (current + 1) % slides.length) : undefined}/>
        <div className="hero-wash"/>
        <div className="hero-inner container"><div className="hero-copy" key={slide}><p className="eyebrow"><span className="small-line"/>{currentSlide.eyebrow}</p><FitTitle title={currentSlide.title} accent={currentSlide.titleAccent}/>{currentSlide.description && <p className="hero-description">{currentSlide.description}</p>}<div className="hero-cta"><button className="button button-dark" onClick={() => discoverSlide(currentSlide)}>Odkryj biżuterię <Icon name="arrow" size={19}/></button><Link className="hero-story-link" href="/pracownia"><span className="hero-story-icon" aria-hidden="true"><Icon name="arrow" size={14}/></span>Poznaj naszą historię</Link></div><div className="hero-note"><Icon name="leaf" size={22}/><span>Nie ma dwóch identycznych.<br/><strong>Tak jak Ty.</strong></span></div></div>
          <div className="nature-seal"><span>MAŁA PRACOWNIA</span><Icon name="leaf" size={29}/><span>WIELKA MIŁOŚĆ</span></div>
          <div className="hero-bottom">{slides.length > 1 ? <div className="slide-controls" aria-label="Wybierz slajd"><span className="slide-number">{pad(slide + 1)}</span>{slides.map((item, index) => <button key={item.id} className={slide === index ? "active" : ""} aria-label={`Slajd ${index + 1}: ${item.title} ${item.titleAccent}`.trim()} aria-pressed={slide === index} onClick={() => setSlide(index)}/>)}<span className="slide-total">{pad(slides.length)}</span></div> : <span/>}{/* Plakietka na zdjęciu — tylko gdy w panelu wybrano „Produkt w rogu slajdu” */}{slideProduct && <button className="hero-product-tag" onClick={() => openProduct(slideProduct)}><span><small>{slideProduct.stones[0] ? "PIĘKNO ZAPISANE W KAMIENIACH" : "ODKRYJ"}</small><strong>{slideProduct.name}</strong></span><span className="round-arrow"><Icon name="arrow" size={20}/></span></button>}</div>
        </div>
      </section>

      <section className="benefits" aria-label="Dlaczego M.art"><div className="benefits-inner container">{([
        ["leaf", "Prawdziwe kamienie", "Piękno prosto z natury"], ["hand", "Ręcznie tworzone", "Z sercem do każdego detalu"], ["gift", "Gotowe na prezent", "Pięknie pakowane, od nas dla Ciebie"], ["truck", "Darmowa dostawa", "Przy zamówieniu od 299 zł"],
      ] as [IconName, string, string][]).map(([icon, title, subtitle]) => <div className="benefit" key={title}><Icon name={icon} size={28}/><div><strong>{title}</strong><span>{subtitle}</span></div></div>)}</div></section>

      <section className="collection-section container" id="kolekcja"><span className="collection-decor left" aria-hidden="true"/><span className="collection-decor right" aria-hidden="true"/><div className="section-heading"><div><p className="eyebrow">WYBRANE Z MIŁOŚCIĄ</p><h2>Twoje małe <em>zachwyty.</em></h2></div><button className="text-link collection-all-link" onClick={() => goToCollection(ALL_CATEGORIES, ALL_STONES, true)}>Odkryj całą biżuterię <Icon name="arrow" size={18}/></button></div>
        <div className="collection-toolbar"><div className="category-tabs" role="tablist" aria-label="Rodzaj biżuterii">{categories.map((name) => <button key={name} role="tab" aria-selected={category === name} className={category === name ? "active" : ""} onClick={() => { setCategory(name); setShowAll(false); }}>{name}</button>)}</div></div>
        <div className="collection-meta"><span className="collection-count" aria-live="polite">{productCountLabel(filteredProducts.length)}</span><button className={`filter-toggle ${showFilters ? "active" : ""}`} aria-expanded={showFilters} onClick={() => setShowFilters(!showFilters)}><Icon name="filter" size={16}/> Filtruj <span>{stone !== ALL_STONES ? "(1)" : ""}</span></button></div>
        {showFilters && <div className="filter-bar"><label>Twój kamień<select value={stone} onChange={(event) => setStone(event.target.value)}>{stones.map((name) => <option key={name} value={name}>{name === ALL_STONES ? "Wszystkie" : name}</option>)}</select></label><label>Sortuj według<select value={sort} onChange={(event) => setSort(event.target.value)}><option value="featured">Polecane</option><option value="price-up">Cena: od najniższej</option><option value="price-down">Cena: od najwyższej</option></select></label><span>{filteredProducts.length} {filteredProducts.length === 1 ? "mały zachwyt" : "małych zachwytów"}</span></div>}
        {(stone !== ALL_STONES || collectionQuery || slideCollection) && <div className="active-filters">{slideCollection && <button className="collection-chip" onClick={() => setSlideCollection(null)} aria-label={`Usuń filtr kolekcji ${slideCollection.title}`}>Kolekcja: {slideCollection.title}<Icon name="close" size={13}/></button>}{stone !== ALL_STONES && <button onClick={() => setStone(ALL_STONES)}>{stone}<Icon name="close" size={13}/></button>}{collectionQuery && <button onClick={() => setCollectionQuery("")}>Szukasz: „{collectionQuery}”<Icon name="close" size={13}/></button>}<button className="reset-filter" onClick={() => { setStone(ALL_STONES); setCollectionQuery(""); setCategory(ALL_CATEGORIES); setSlideCollection(null); }}>Wyczyść filtry</button></div>}
        {visibleProducts.length ? <div className="product-grid">{visibleProducts.map((product) => <ProductCard key={product.id} product={product} saved={wishlist.includes(product.id)} onOpen={() => openProduct(product)} onSave={() => toggleWishlist(product.id)} onAdd={() => addToCart(product)}/>)}</div> : <div className="collection-empty"><Icon name="leaf" size={35}/><h3>Ten kamień jeszcze czeka na swoją opowieść.</h3><p>Spróbuj innego połączenia filtrów.</p><button className="button button-outline" onClick={() => goToCollection()}>Zobacz całą biżuterię</button></div>}
        {!showAll && category === ALL_CATEGORIES && stone === ALL_STONES && !collectionQuery && <div className="collection-bottom"><span>Małe serie. Niepowtarzalne kamienie.</span><button className="button button-outline" onClick={() => setShowAll(true)}>Zobacz całą kolekcję <Icon name="arrow" size={18}/></button><span>Wybierz tę, która jest Twoja.</span></div>}
      </section>

      {homeStones.length > 0 && <section className="stones-section" id="kamienie"><div className="stones-inner container"><div className="stones-copy"><p className="eyebrow">NATURA NIE TWORZY KOPII</p><h2>Każdy kamień<br/>ma swoją <em>historię.</em></h2><p>Kolory, które uspokajają. Faktury, które zachwycają. Znajdź kamień, w którym zobaczysz cząstkę siebie.</p><span className="stone-small-note"><Icon name="sparkle" size={16}/> 100% naturalnego piękna</span><Link className="text-link stones-all-link" href="/kamienie">Poznaj wszystkie kamienie <Icon name="arrow" size={17}/></Link></div><StoneCarousel items={homeStones}/></div></section>}

      {story && <section className="story-section container" id="pracownia"><div className="story-photo"><img src={story.image || "/images/atelier.svg"} alt="Pracownia M.art — ręczne tworzenie biżuterii z kamieni naturalnych" loading="lazy"/><span className="photo-caption">MAŁE RZECZY. WIELKA UWAŻNOŚĆ.</span><span className="story-photo-mark">M.art</span></div><div className="story-copy"><p className="eyebrow">POZNAJ NASZĄ PRACOWNIĘ</p><h2>{story.title}{story.accent && <><br/><em>{story.accent}</em></>}</h2>{story.text.split(/\n\s*\n/).filter(Boolean).map((para, i) => <p key={i}>{para}</p>)}<Link className="text-link" href="/pracownia">Zajrzyj do świata M.art <Icon name="arrow" size={19}/></Link><span className="signature">Z miłości do piękna.</span></div></section>}

      <section className="gift-section container"><div className="gift-illustration"><Icon name="gift" size={46}/><span className="gift-sparkle one">✧</span><span className="gift-sparkle two">✧</span></div><div><p className="eyebrow">DLA KOGOŚ BLISKIEGO. TAKŻE DLA SIEBIE.</p><h2>Najpiękniejsze prezenty <em>mają znaczenie.</em></h2><p>Podaruj coś niepowtarzalnego. Każde zamówienie zapakujemy z czułością.</p></div><button className="button button-dark" onClick={() => goToCollection("Komplety")}>Znajdź swój prezent <Icon name="arrow" size={18}/></button></section>

      <section className="newsletter-section"><div className="newsletter-inner container"><div><p className="eyebrow">LISTY Z PRACOWNI</p><h2>Bądź bliżej <em>piękna.</em></h2><p>Nowe kolekcje, inspiracje i małe historie z naszego świata.<br/>Bez pośpiechu. Tylko to, co warte Twojej uwagi.</p></div><form onSubmit={subscribe} className="newsletter-form"><label className="sr-only" htmlFor="newsletter-email">Twój adres e-mail</label><div className="newsletter-input"><input id="newsletter-email" type="email" name="email" placeholder="Twój adres e-mail" required maxLength={254}/><button type="submit" disabled={newsletterPending} aria-label="Dołącz do newslettera">{newsletterPending ? "…" : <Icon name="arrow" size={24}/>}</button></div><label className="checkbox-label"><input type="checkbox" name="consent" required/><span>Chcę otrzymywać listy z pracowni i akceptuję <button type="button" onClick={() => showInfo("privacy")}>politykę prywatności.</button></span></label>{newsletterStatus && <p className={`form-message ${newsletterError ? "error" : "success"}`} role="status">{newsletterStatus}</p>}</form></div></section>
    </main>

    <footer className="site-footer"><div className="footer-main container"><div className="footer-brand"><a href="#" onClick={(event) => { event.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }} aria-label="M.art — wróć na górę"><Brand footer/></a><p>Naturalne kamienie. Prawdziwe emocje.<br/>Biżuteria tworzona z sercem.</p></div><div className="footer-column"><h3>Świat M.art</h3><button onClick={() => goToCollection()}>Nasza biżuteria</button><Link href="/pracownia">O pracowni</Link><a href="#kamienie">Kamienie naturalne</a><Link href="/pielegnacja">Pielęgnacja biżuterii</Link></div><div className="footer-column"><h3>Jesteśmy dla Ciebie</h3><button onClick={() => showInfo("delivery")}>Dostawa i zwroty</button><button onClick={() => showInfo("faq")}>Pytania i odpowiedzi</button><button onClick={() => showInfo("terms")}>Zasady zakupów</button><button onClick={() => showInfo("privacy")}>Polityka prywatności</button></div><div className="footer-contact"><p className="eyebrow">POROZMAWIAJMY</p><h3>Potrzebujesz małej<br/>podpowiedzi?</h3><button className="text-link" onClick={() => showInfo("contact")}>Napisz do nas <Icon name="arrow" size={17}/></button><span><Icon name="heart" size={14}/> Z przyjemnością pomożemy.</span></div></div><div className="footer-bottom container"><span>© {new Date().getFullYear()} M.art · Pracownia Biżuterii</span><span>Tworzone powoli. Noszone z miłością.</span><span className="footer-location">RĘKODZIEŁO Z POLSKI <span className="polish-dot"/></span></div></footer>

    {panel === "menu" && <Overlay title="Odkryj M.art" onClose={() => setPanel(null)}><div className="mobile-menu"><p className="eyebrow">TWOJA BIŻUTERIA</p>{categories.map((name) => <button key={name} onClick={() => goToCollection(name)}>{name === ALL_CATEGORIES ? "Cała kolekcja" : name}<Icon name="arrow" size={19}/></button>)}<div className="mobile-menu-secondary"><button onClick={() => { setPanel(null); requestAnimationFrame(() => document.getElementById("kamienie")?.scrollIntoView({ behavior: "smooth" })); }}>Kamienie naturalne<Icon name="leaf" size={18}/></button><Link href="/pracownia" className="mobile-menu-link">O pracowni<Icon name="hand" size={18}/></Link><button onClick={() => showInfo("contact")}>Napisz do nas<Icon name="mail" size={18}/></button></div><p className="mobile-menu-note">Z natury wyjątkowa.<br/>Tak jak Ty.</p></div></Overlay>}

    {panel === "search" && <Overlay title="Znajdź swój mały zachwyt" onClose={() => setPanel(null)}><div className="search-panel"><form className="search-input" onSubmit={(event) => { event.preventDefault(); setCollectionQuery(search.trim()); setCategory(ALL_CATEGORIES); setStone(ALL_STONES); setShowAll(true); setPanel(null); requestAnimationFrame(() => document.getElementById("kolekcja")?.scrollIntoView({ behavior: "smooth" })); }}><Icon name="search" size={21}/><input data-autofocus value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Kamień, naszyjnik, odrobina blasku…" aria-label="Szukaj produktów"/><button type="submit" className="icon-button" aria-label="Pokaż wyniki wyszukiwania"><Icon name="arrow" size={20}/></button></form><div className="search-tags">{["Perły", "Jaspis", "Agat"].map((tag) => <button key={tag} onClick={() => setSearch(tag === "Perły" ? "perł" : tag)}>{tag}<Icon name="plus" size={11}/></button>)}</div><p className="eyebrow search-results-label">{search ? `ZNALEZIONE MAŁE DZIEŁA (${searchResults.length})` : "MOŻE WŁAŚNIE TO?"}</p>{searchResults.length ? <div className="mini-product-list">{searchResults.slice(0, search ? 8 : 4).map((product) => <button className="mini-product" key={product.id} onClick={() => openProduct(product)}><img src={product.image} alt={product.name}/><span><strong>{product.name}</strong><small>{product.subtitle}</small><b>{money(product.price)}</b></span><Icon name="arrow" size={18}/></button>)}</div> : <EmptyState icon="search" title="Jeszcze nie znaleźliśmy tego skarbu." text="Spróbuj wpisać nazwę kamienia lub rodzaj biżuterii." action="Zobacz całą kolekcję" onAction={() => goToCollection()}/>}</div></Overlay>}

    {panel === "wishlist" && <Overlay title={`Twoje ulubione (${wishlist.length})`} onClose={() => setPanel(null)}>{wishlist.length ? <div className="wishlist-panel"><p className="panel-intro">Małe rzeczy, które skradły Ci serce.</p>{products.filter((p) => wishlist.includes(p.id)).map((product) => <div className="wishlist-item" key={product.id}><button className="wishlist-product-photo" onClick={() => openProduct(product)}><img src={product.image} alt={product.name}/></button><div><button className="mini-product-name" onClick={() => openProduct(product)}>{product.name}</button><p>{product.subtitle}</p><strong>{money(product.price)}</strong><button className="small-add-button" disabled={!product.stock} onClick={() => addToCart(product)}><Icon name="plus" size={15}/>{product.stock ? "Dodaj do koszyka" : "Chwilowo niedostępny"}</button></div><button className="icon-button" aria-label={`Usuń ${product.name} z ulubionych`} onClick={() => toggleWishlist(product.id)}><Icon name="close" size={17}/></button></div>)}</div> : <EmptyState icon="heart" title="Zostaw tu odrobinę zachwytu." text="Dotknij serduszka przy biżuterii, która wpadła Ci w oko. Będzie tu na Ciebie czekać." action="Odkryj biżuterię" onAction={() => goToCollection()}/>}</Overlay>}

    {panel === "cart" && <Overlay title={`Twój koszyk (${cartCount})`} onClose={() => setPanel(null)} className="cart-drawer">{cartItems.length ? <><div className="shipping-progress"><p>{subtotal >= FREE_SHIPPING_FROM ? <><Icon name="check" size={16}/> Twoja przesyłka będzie bezpłatna.</> : <>Do darmowej dostawy brakuje <strong>{money(FREE_SHIPPING_FROM - subtotal)}</strong></>}</p><span><i style={{ width: `${Math.min(100, subtotal / FREE_SHIPPING_FROM * 100)}%` }}/></span></div><div className="cart-items">{cartItems.map(({ product, quantity }) => <div className="cart-item" key={product.id}><button className="cart-product-image" onClick={() => openProduct(product)}><img src={product.image} alt={product.name}/></button><div className="cart-item-details"><button className="mini-product-name" onClick={() => openProduct(product)}>{product.name}</button><p>{product.subtitle}</p><strong>{money(product.price * quantity)}</strong><div className="cart-item-actions"><div className="quantity-control"><button aria-label={`Zmniejsz liczbę: ${product.name}`} onClick={() => changeQuantity(product.id, -1)}><Icon name="minus" size={13}/></button><span>{quantity}</span><button aria-label={`Zwiększ liczbę: ${product.name}`} disabled={quantity >= Math.min(10, product.stock)} onClick={() => changeQuantity(product.id, 1)}><Icon name="plus" size={13}/></button></div><button className="remove-item" onClick={() => setCart((current) => current.filter((item) => item.id !== product.id))}>Usuń</button></div></div></div>)}</div><div className="cart-footer"><p className="gift-note"><Icon name="gift" size={19}/> Zapakujemy Twoje zamówienie jak prezent.</p><div className="cart-subtotal"><span>Wartość produktów</span><strong>{money(subtotal)}</strong></div><p className="cart-shipping-note">Koszt dostawy od 0 zł — wybierzesz w kolejnym kroku.</p><button className="button button-dark" onClick={() => setPanel("checkout")}>Przejdź do zamówienia <Icon name="arrow" size={19}/></button><button className="continue-shopping" onClick={() => setPanel(null)}>Jeszcze się rozejrzę</button></div></> : <EmptyState icon="bag" title="Tu zaczyna się Twoja historia." text="Twój koszyk czeka na małe dzieła, które będą towarzyszyć Ci każdego dnia." action="Znajdź coś dla siebie" onAction={() => goToCollection()}/>}</Overlay>}

    {panel === "product" && selected && <Overlay title="Małe dzieło M.art" kind="modal" className="product-modal" onClose={() => setPanel(null)}><div className="product-detail"><div className="product-detail-image"><ProductGallery key={selected.id} images={selected.images.length ? selected.images : [selected.image]} alt={selected.subtitle || selected.name}/>{selected.badge && <span className="product-badge">{selected.badge}</span>}<button className={`product-save icon-button ${wishlist.includes(selected.id) ? "is-saved" : ""}`} aria-label={wishlist.includes(selected.id) ? "Usuń z ulubionych" : "Zapisz w ulubionych"} onClick={() => toggleWishlist(selected.id)}><Icon name="heart"/></button></div><div className="product-detail-copy"><p className="eyebrow">RĘCZNIE TWORZONA · NATURALNE PIĘKNO</p><h2>{selected.name}</h2><p className="product-detail-subtitle">{selected.subtitle}</p><strong className="product-detail-price">{money(selected.price)}{selected.compareAtPrice && <s className="compare-price">{money(selected.compareAtPrice)}</s>}</strong><p className="product-description">{selected.description}</p><dl className="product-specs">{selected.stones.length > 0 && <div><dt>{selected.stones.length > 1 ? "Kamienie" : "Kamień"}</dt><dd>{stoneList(selected.stones)}</dd></div>}{selected.material && <div><dt>Materiał</dt><dd>{selected.material}</dd></div>}{selected.size && <div><dt>Rozmiar</dt><dd>{selected.size}</dd></div>}</dl><p className={`stock-status ${!selected.stock ? "unavailable" : ""}`}><span/>{selected.stock ? `Dostępna w małej serii · ${selected.stock} szt.` : "Chwilowo niedostępna"}</p><div className="product-buy-row"><div className="quantity-control"><button aria-label="Zmniejsz ilość" disabled={productQuantity <= 1} onClick={() => setProductQuantity(productQuantity - 1)}><Icon name="minus" size={15}/></button><span>{productQuantity}</span><button aria-label="Zwiększ ilość" disabled={productQuantity >= Math.min(10, selected.stock)} onClick={() => setProductQuantity(productQuantity + 1)}><Icon name="plus" size={15}/></button></div><button className="button button-dark" disabled={!selected.stock} onClick={() => { addToCart(selected, productQuantity); setPanel("cart"); }}>Dodaj do koszyka <Icon name="bag" size={19}/></button></div><div className="product-promises"><span><Icon name="gift" size={17}/> Ozdobne opakowanie gratis</span><span><Icon name="hand" size={17}/> Wysyłka w 2–4 dni robocze*</span></div><p className="product-natural-note">Każdy kamień jest inny — Twój egzemplarz może subtelnie różnić się od zdjęcia. *Od potwierdzenia zamówienia i płatności.</p></div></div></Overlay>}

    {panel === "checkout" && <Overlay title="Twoje zamówienie" kind="modal" className="checkout-modal" onClose={() => setPanel(null)}><Checkout items={cartItems} onComplete={() => setCart([])} onContinue={() => setPanel(null)}/></Overlay>}
    {panel === "info" && <Overlay title={infoTitles[infoTopic] || "Świat M.art"} kind="modal" className="info-modal" onClose={() => setPanel(null)}><Information key={infoTopic} topic={infoTopic}/></Overlay>}
    {toast && <div className="toast" role="status"><span className="toast-check"><Icon name="check" size={16}/></span><p>{toast.message}</p>{toast.cart && <button onClick={() => { setPanel("cart"); setToast(null); }}>Zobacz koszyk<Icon name="arrow" size={16}/></button>}<button className="icon-button" aria-label="Zamknij powiadomienie" onClick={() => setToast(null)}><Icon name="close" size={15}/></button></div>}
  </>;
}


function ProductCard({ product, saved, onOpen, onSave, onAdd }: { product: Product; saved: boolean; onOpen: () => void; onSave: () => void; onAdd: () => void }) {
  // Plakietka: brak na stanie → „WKRÓTCE POWRÓCI”; własna z panelu; ostatnia sztuka → „OSTATNIA SZTUKA”
  const badge = !product.stock ? "WKRÓTCE POWRÓCI" : product.badge || (product.stock === 1 ? "OSTATNIA SZTUKA" : null);
  return <article className="product-card"><div className="product-image-wrap"><button className="product-image-button" onClick={onOpen} aria-label={`Odkryj ${product.name}`}><img src={product.image} alt={product.subtitle} loading="lazy" width={560} height={700}/>{product.images[1] && <img className="product-image-alt" src={product.images[1]} alt="" aria-hidden="true" loading="lazy" width={560} height={700}/>}</button>{badge && <span className="product-badge">{badge}</span>}<button className={`product-save icon-button ${saved ? "is-saved" : ""}`} onClick={onSave} aria-label={`${saved ? "Usuń" : "Zapisz"} ${product.name} ${saved ? "z ulubionych" : "w ulubionych"}`} aria-pressed={saved}><Icon name="heart" size={19}/></button></div>
    <div className="product-card-info card-info">
      <button className="product-name" onClick={onOpen}>{product.name}</button>
      {product.subtitle && <p>{product.subtitle}</p>}
      <div className="card-buy">
        <strong className="product-price">{product.compareAtPrice && <s className="compare-price">{money(product.compareAtPrice)}</s>}{money(product.price)}</strong>
        <button className="card-bag" onClick={onAdd} disabled={!product.stock} aria-label={`Dodaj ${product.name} do koszyka`} title="Dodaj do koszyka"><Icon name="bag" size={20}/></button>
      </div>
    </div></article>;
}

function EmptyState({ icon, title, text, action, onAction }: { icon: IconName; title: string; text: string; action: string; onAction: () => void }) {
  return <div className="empty-state"><span className="empty-state-icon"><Icon name={icon} size={34}/></span><h3>{title}</h3><p>{text}</p><button className="button button-dark" onClick={onAction}>{action}<Icon name="arrow" size={17}/></button></div>;
}
