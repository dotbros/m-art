"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { saveStoneAction } from "@/app/admin/actions";
import { Field, FormMessage, SubmitButton, useFocusFirstError } from "./ui";
import { MediaUploader } from "./media-uploader";

type StoneData = { id: number; name: string; slug: string; caption: string; description: string; images: string[]; showOnHome: boolean; position: number; isActive: boolean };
const MAX_IMAGES = 8;

export function StoneForm({ stone, productCount = 0 }: { stone?: StoneData; productCount?: number }) {
  const [state, action] = useActionState(saveStoneAction, {});
  useFocusFirstError(state);
  const e = state.errors || {};
  const v = state.values;
  const val = (key: string, fallback: string | number | undefined) => (v ? (v[key] ?? "") : String(fallback ?? ""));
  const [images, setImages] = useState<string[]>(v ? (v.images ? v.images.split("\n") : []) : stone?.images ?? []);
  const move = (index: number, dir: -1 | 1) => setImages((list) => { const next = [...list]; const [item] = next.splice(index, 1); next.splice(index + dir, 0, item); return next; });

  return <form key={state.ts ?? "initial"} action={action} className="adm-form" noValidate>
    <FormMessage state={state}/>
    {stone && <input type="hidden" name="id" value={stone.id}/>}
    {images.map((url) => <input key={url} type="hidden" name="images" value={url}/>)}

    <section className="adm-card">
      <h2>Kamień</h2>
      <Field label="Nazwa kamienia" name="name" error={e.name} hint={stone && productCount ? `Zmiana nazwy zaktualizuje ${productCount} prod. i slajdy, w których występuje.` : undefined}>
        <input id="name" name="name" required maxLength={60} defaultValue={val("name", stone?.name)} placeholder="np. Kwarc różowy"/>
      </Field>
      <Field label="Krótki podpis" name="caption" error={e.caption} hint="Wyświetlany pod nazwą na karcie kamienia, np. „Ciepło ziemi”."><input id="caption" name="caption" maxLength={80} defaultValue={val("caption", stone?.caption)}/></Field>
      <Field label="Opis" name="description" error={e.description} hint="Historia kamienia, właściwości, jak go nosić. Pusta linia = nowy akapit."><textarea id="description" name="description" rows={8} maxLength={5000} defaultValue={val("description", stone?.description)}/></Field>
      <Field label="Adres strony (slug)" name="slug" error={e.slug} hint={`Strona kamienia: /kamienie/${val("slug", stone?.slug) || "…"} — zostaw puste, utworzymy z nazwy.`}><input id="slug" name="slug" maxLength={80} autoCapitalize="none" defaultValue={val("slug", stone?.slug)}/></Field>
    </section>

    <section className="adm-card">
      <h2>Zdjęcia</h2>
      <p className="adm-hint">Pierwsze zdjęcie jest główne (karta na stronie głównej). Maks. {MAX_IMAGES} zdjęć.</p>
      {images.length > 0 && <ul className="adm-gallery">{images.map((url, i) => <li key={url}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={`Zdjęcie ${i + 1}`}/>
        {i === 0 && <span className="adm-badge adm-gallery-main">Główne</span>}
        <div className="adm-gallery-actions">
          <button type="button" className="adm-icon-btn" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Przesuń zdjęcie ${i + 1} wcześniej`}>←</button>
          <button type="button" className="adm-icon-btn" onClick={() => move(i, 1)} disabled={i === images.length - 1} aria-label={`Przesuń zdjęcie ${i + 1} dalej`}>→</button>
          <button type="button" className="adm-icon-btn adm-icon-danger" onClick={() => setImages((list) => list.filter((u) => u !== url))} aria-label={`Usuń zdjęcie ${i + 1}`}>×</button>
        </div>
      </li>)}</ul>}
      {images.length < MAX_IMAGES
        ? <MediaUploader value={null} allowVideo={false} onChange={(media) => { if (media) setImages((list) => [...list, media.url]); }} error={e.images}/>
        : <p className="adm-hint">Osiągnięto limit zdjęć — usuń któreś, aby dodać nowe.</p>}
    </section>

    <section className="adm-card">
      <h2>Wyświetlanie</h2>
      <label className="adm-switch"><input type="checkbox" name="showOnHome" defaultChecked={v ? v.showOnHome === "on" : stone?.showOnHome ?? false}/><span>Pokaż w sekcji „Każdy kamień ma swoją historię” na stronie głównej</span></label>
      <label className="adm-switch"><input type="checkbox" name="isActive" defaultChecked={v ? v.isActive === "on" : stone?.isActive ?? true}/><span>Strona kamienia widoczna w sklepie</span></label>
      <Field label="Kolejność" name="position" error={e.position} hint="Mniejsza liczba = wcześniej."><input id="position" name="position" type="number" inputMode="numeric" min={0} max={999} defaultValue={val("position", stone?.position ?? 0)}/></Field>
    </section>

    <div className="adm-sticky-actions"><Link href="/admin/kamienie" className="adm-btn">Anuluj</Link><SubmitButton>{stone ? "Zapisz zmiany" : "Dodaj kamień"}</SubmitButton></div>
  </form>;
}
