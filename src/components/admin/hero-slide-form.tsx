"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { saveHeroSlideAction } from "@/app/admin/actions";
import { HERO_FOCUS, HERO_FOCUS_POSITION, type HeroFocus } from "@/lib/hero-shared";
import { Field, FormMessage, SubmitButton, useFocusFirstError } from "./ui";
import { MediaUploader, type UploadedMedia } from "./media-uploader";

type Slide = { id: number; eyebrow: string; title: string; titleAccent: string; description: string; mediaType: "image" | "video"; mediaUrl: string; posterUrl: string | null; hasAudio: boolean; focus: string; stone: string; productId: string | null; position: number; isActive: boolean };

export function HeroSlideForm({ slide, stones, products }: { slide?: Slide; stones: string[]; products: { id: string; name: string }[] }) {
  const [state, action] = useActionState(saveHeroSlideAction, {});
  useFocusFirstError(state);
  const e = state.errors || {};
  const v = state.values;
  const val = (key: string, fallback: string | number | null | undefined) => (v ? (v[key] ?? "") : String(fallback ?? ""));
  const [media, setMedia] = useState<UploadedMedia | null>(
    v?.mediaUrl ? { mediaType: v.mediaType === "video" ? "video" : "image", url: v.mediaUrl, posterUrl: v.posterUrl || null, hasAudio: v.hasAudio === "on" }
      : slide ? { mediaType: slide.mediaType, url: slide.mediaUrl, posterUrl: slide.posterUrl, hasAudio: slide.hasAudio } : null,
  );
  // Dźwięk: po świeżym wgraniu wiemy, czy film go ma; dla zapisanego filmu serwer sprawdzi to przy zapisie.
  const [justUploaded, setJustUploaded] = useState(false);
  const [soundOn, setSoundOn] = useState(v ? v.hasAudio === "on" : slide?.hasAudio ?? false);
  function onMediaChange(next: UploadedMedia | null) { setMedia(next); setJustUploaded(!!next); setSoundOn(!!next?.hasAudio); }
  const [focus, setFocus] = useState<HeroFocus>((val("focus", slide?.focus ?? "center") || "center") as HeroFocus);
  const [title, setTitle] = useState(val("title", slide?.title));
  const [accent, setAccent] = useState(val("titleAccent", slide?.titleAccent));
  const [eyebrow, setEyebrow] = useState(val("eyebrow", slide?.eyebrow));
  const focusPos = HERO_FOCUS_POSITION[focus];

  return <form key={state.ts ?? "initial"} action={action} className="adm-form" noValidate>
    <FormMessage state={state}/>
    {slide && <input type="hidden" name="id" value={slide.id}/>}
    <input type="hidden" name="mediaUrl" value={media?.url ?? ""}/>
    <input type="hidden" name="mediaType" value={media?.mediaType ?? "image"}/>
    <input type="hidden" name="posterUrl" value={media?.posterUrl ?? ""}/>

    <section className="adm-card">
      <h2>Zdjęcie lub film</h2>
      <MediaUploader value={media} onChange={onMediaChange} error={e.media}/>
      {media?.mediaType === "video" && (justUploaded && !media.hasAudio
        ? <p className="adm-hint">Ten film nie ma dźwięku — będzie odtwarzany bez przycisku dźwięku.</p>
        : <label className="adm-switch"><input type="checkbox" name="hasAudio" checked={soundOn} onChange={(ev) => setSoundOn(ev.target.checked)}/><span>Klient może włączyć dźwięk (przycisk 🔊 na filmie)</span></label>)}
      <fieldset className="adm-focus">
        <legend>Kadrowanie na telefonie</legend>
        <p className="adm-hint">Na telefonie widać tylko część szerokiego zdjęcia — wybierz, która część ma być widoczna.</p>
        <div className="adm-segmented">{(Object.keys(HERO_FOCUS) as HeroFocus[]).map((key) => <label key={key} className={focus === key ? "active" : ""}>
          <input type="radio" name="focus" value={key} checked={focus === key} onChange={() => setFocus(key)}/>{HERO_FOCUS[key]}
        </label>)}</div>
      </fieldset>
    </section>

    {/* Podgląd na telefonie — tak mniej więcej zobaczy to klient */}
    {media && <section className="adm-card">
      <h2>Podgląd na telefonie</h2>
      <div className="adm-hero-preview">
        {media.mediaType === "video"
          ? <video src={media.url} poster={media.posterUrl ?? undefined} muted loop playsInline autoPlay style={{ objectPosition: focusPos }}/>
          // eslint-disable-next-line @next/next/no-img-element
          : <img src={media.url} alt="" style={{ objectPosition: focusPos }}/>}
        <div className="adm-hero-preview-copy"><small>{eyebrow}</small><strong>{title}</strong>{accent && <em>{accent}</em>}</div>
      </div>
    </section>}

    <section className="adm-card">
      <h2>Teksty</h2>
      <Field label="Nadtytuł (małe litery nad tytułem)" name="eyebrow" error={e.eyebrow}><input id="eyebrow" name="eyebrow" maxLength={60} value={eyebrow} onChange={(ev) => setEyebrow(ev.target.value)} placeholder="np. NOWA KOLEKCJA"/></Field>
      <Field label="Tytuł" name="title" error={e.title}><input id="title" name="title" maxLength={60} required value={title} onChange={(ev) => setTitle(ev.target.value)} placeholder="np. Z natury"/></Field>
      <Field label="Druga linia tytułu (kursywą)" name="titleAccent" error={e.titleAccent}><input id="titleAccent" name="titleAccent" maxLength={60} value={accent} onChange={(ev) => setAccent(ev.target.value)} placeholder="np. wyjątkowa."/></Field>
      <Field label="Opis" name="description" error={e.description} hint="Maks. 300 znaków. Enter = nowa linia."><textarea id="description" name="description" rows={3} maxLength={300} defaultValue={val("description", slide?.description)}/></Field>
    </section>

    <section className="adm-card">
      <h2>Dokąd prowadzi slajd</h2>
      <div className="adm-grid-2">
        <Field label="Kamień" name="stone" hint="„Odkryj biżuterię” pokaże produkty z tym kamieniem."><select id="stone" name="stone" defaultValue={val("stone", slide?.stone)}><option value="">— cała kolekcja —</option>{stones.map((s) => <option key={s} value={s}>{s}</option>)}</select></Field>
        <Field label="Produkt w rogu slajdu" name="productId" error={e.productId} hint="Opcjonalnie — etykieta otworzy kartę produktu."><select id="productId" name="productId" defaultValue={val("productId", slide?.productId)}><option value="">— brak —</option>{products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
        <Field label="Kolejność" name="position" error={e.position} hint="Mniejsza liczba = wcześniej."><input id="position" name="position" type="number" inputMode="numeric" min={0} max={999} defaultValue={val("position", slide?.position ?? 0)}/></Field>
      </div>
      <label className="adm-switch"><input type="checkbox" name="isActive" defaultChecked={v ? v.isActive === "on" : slide?.isActive ?? true}/><span>Widoczny na stronie głównej</span></label>
      {e.isActive && <small className="adm-error" role="alert">{e.isActive}</small>}
    </section>

    <div className="adm-sticky-actions"><Link href="/admin/strona" className="adm-btn">Anuluj</Link><SubmitButton>{slide ? "Zapisz zmiany" : "Dodaj slajd"}</SubmitButton></div>
  </form>;
}
