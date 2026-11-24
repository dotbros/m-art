"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { savePageAction } from "@/app/admin/actions";
import { Field, FormMessage, SubmitButton, useFocusFirstError } from "./ui";
import { ImageListEditor } from "./image-list-editor";
import { MediaUploader } from "./media-uploader";

type PageData = { slug: string; eyebrow: string; title: string; titleAccent: string; intro: string; body: string; images: string[]; teaserImage: string | null; teaserTitle: string; teaserAccent: string; teaserText: string };

export function PageForm({ page, path, hasTeaser, maxImages }: { page: PageData; path: string; hasTeaser: boolean; maxImages: number }) {
  const [state, action] = useActionState(savePageAction, {});
  useFocusFirstError(state);
  const e = state.errors || {};
  const v = state.values;
  const val = (key: keyof PageData) => (v ? (v[key] ?? "") : String(page[key] ?? ""));
  const [images, setImages] = useState<string[]>(v ? (v.images ? v.images.split("\n") : []) : page.images);
  const [teaser, setTeaser] = useState<string | null>(v ? v.teaserImage || null : page.teaserImage);

  return <form key={state.ts ?? "initial"} action={action} className="adm-form" noValidate>
    <FormMessage state={state}/>
    <input type="hidden" name="slug" value={page.slug}/>
    <input type="hidden" name="teaserImage" value={teaser ?? ""}/>

    {hasTeaser && <section className="adm-card">
      <h2>Zajawka na stronie głównej</h2>
      <p className="adm-hint">Sekcja na stronie głównej z przyciskiem do tej podstrony. Ma własne zdjęcie — niezależne od zdjęć podstrony. Zdjęcie wyświetla się w formacie pionowym 4:5 (na komputerze i telefonie tak samo) i prowadzi do podstrony.</p>
      <MediaUploader value={teaser ? { mediaType: "image", url: teaser, posterUrl: null, hasAudio: false } : null} allowVideo={false} inputId="teaser-file" label="Zdjęcie na stronie głównej"
        onChange={(media) => setTeaser(media?.url ?? null)} error={e.teaserImage}/>
      <div className="adm-grid-2">
        <Field label="Tytuł zajawki" name="teaserTitle" error={e.teaserTitle}><input id="teaserTitle" name="teaserTitle" maxLength={80} defaultValue={val("teaserTitle")} placeholder="np. Nie z fabryki."/></Field>
        <Field label="Druga linia (kursywą)" name="teaserAccent"><input id="teaserAccent" name="teaserAccent" maxLength={80} defaultValue={val("teaserAccent")} placeholder="np. Z pasji."/></Field>
      </div>
      <Field label="Tekst zajawki" name="teaserText" error={e.teaserText} hint="Pusta linia = nowy akapit."><textarea id="teaserText" name="teaserText" rows={5} maxLength={800} defaultValue={val("teaserText")}/></Field>
    </section>}

    <section className="adm-card">
      <h2>Zdjęcia podstrony</h2>
      <ImageListEditor images={images} onChange={setImages} max={maxImages} inputId="page-images-file" firstLabel="Nagłówek" error={e.images}
        hint="Pierwsze zdjęcie to zdjęcie nagłówkowe podstrony. Kolejne tworzą galerię na dole strony. Kolejność zmienisz strzałkami."/>
    </section>

    <section className="adm-card">
      <h2>Treść podstrony</h2>
      <Field label="Nadtytuł" name="eyebrow" error={e.eyebrow}><input id="eyebrow" name="eyebrow" maxLength={60} defaultValue={val("eyebrow")}/></Field>
      <div className="adm-grid-2">
        <Field label="Tytuł" name="title" error={e.title}><input id="title" name="title" required maxLength={80} defaultValue={val("title")}/></Field>
        <Field label="Druga linia tytułu (kursywą)" name="titleAccent" error={e.titleAccent}><input id="titleAccent" name="titleAccent" maxLength={80} defaultValue={val("titleAccent")}/></Field>
      </div>
      <Field label="Wstęp" name="intro" error={e.intro} hint="Wyróżniony akapit pod tytułem."><textarea id="intro" name="intro" rows={3} maxLength={600} defaultValue={val("intro")}/></Field>
      <Field label="Treść" name="body" error={e.body} hint="Pusta linia = nowy akapit. Linia zaczynająca się od „## ” = śródtytuł (np. „## Jak przechowywać”).">
        <textarea id="body" name="body" rows={14} maxLength={10000} defaultValue={val("body")}/>
      </Field>
    </section>

    <div className="adm-sticky-actions"><a href={path} target="_blank" rel="noreferrer" className="adm-btn">Podgląd ↗</a><Link href="/admin/strona" className="adm-btn">Anuluj</Link><SubmitButton>Zapisz</SubmitButton></div>
  </form>;
}
