"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { saveProductAction } from "@/app/admin/actions";
import { Field, FormMessage, SubmitButton, useFocusFirstError } from "./ui";
import { StonePicker } from "./stone-picker";

type ProductData = {
  id: string; name: string; subtitle: string; categoryId: number | null; stones: string[]; material: string; size: string;
  price: number; compareAtPrice: number | null; image: string; badge: string | null; description: string; stock: number; position: number; isActive: boolean;
};

const toPln = (grosze: number | null | undefined) => (grosze == null ? "" : (grosze / 100).toFixed(2).replace(".", ","));

export function ProductForm({ product, categories, stones }: { product?: ProductData; categories: { id: number; name: string }[]; stones: string[] }) {
  const [state, action] = useActionState(saveProductAction, {});
  useFocusFirstError(state);
  const e = state.errors || {};
  // Po błędzie walidacji pokazujemy to, co zostało wpisane — nie wartości z bazy.
  const v = state.values;
  const val = (key: string, fallback: string | number | null | undefined) => (v ? (v[key] ?? "") : String(fallback ?? ""));
  const checked = (key: string, fallback: boolean) => (v ? v[key] === "on" : fallback);

  // `key` = znacznik odpowiedzi → formularz montuje się na nowo z aktualnymi wartościami.
  return <form key={state.ts ?? "initial"} action={action} className="adm-form" noValidate>
    <FormMessage state={state}/>
    {product && <input type="hidden" name="editingId" value={product.id}/>}
    <ImagePicker current={product?.image || ""} error={e.imageFile} lostFile={!!v && !e.imageFile}/>

    <section className="adm-card">
      <h2>Podstawowe informacje</h2>
      <Field label="Nazwa produktu" name="name" error={e.name}><input id="name" name="name" required maxLength={80} defaultValue={val("name", product?.name)} placeholder="np. Słoneczny splot"/></Field>
      <Field label="Podtytuł" name="subtitle" error={e.subtitle} hint="Krótki opis pod nazwą, np. „Naszyjnik z jaspisem cesarskim”."><input id="subtitle" name="subtitle" maxLength={120} defaultValue={val("subtitle", product?.subtitle)}/></Field>
      <Field label="Kategoria" name="categoryId" error={e.categoryId}>
        <select id="categoryId" name="categoryId" required defaultValue={val("categoryId", product?.categoryId)}>
          <option value="" disabled>— wybierz —</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </Field>
      {product ? <p className="adm-hint">Adres produktu: <code>/{product.id}</code> (nie zmienia się po utworzeniu)</p>
        : <Field label="Adres (slug)" name="slug" error={e.slug} hint="Zostaw puste — utworzymy go z nazwy."><input id="slug" name="slug" maxLength={80} autoCapitalize="none" defaultValue={val("slug", "")}/></Field>}
      <Field label="Opis" name="description" error={e.description}><textarea id="description" name="description" rows={6} maxLength={5000} defaultValue={val("description", product?.description)}/></Field>
    </section>

    <section className="adm-card">
      <h2>Cena i dostępność</h2>
      <div className="adm-grid-2">
        <Field label="Cena (zł)" name="price" error={e.price}><input id="price" name="price" inputMode="decimal" required defaultValue={val("price", toPln(product?.price))} placeholder="189,00"/></Field>
        <Field label="Cena przed obniżką (zł)" name="compareAtPrice" error={e.compareAtPrice} hint="Opcjonalnie — wyświetli przekreśloną cenę."><input id="compareAtPrice" name="compareAtPrice" inputMode="decimal" defaultValue={val("compareAtPrice", toPln(product?.compareAtPrice))}/></Field>
        <Field label="Stan magazynowy (szt.)" name="stock" error={e.stock}><input id="stock" name="stock" type="number" inputMode="numeric" min={0} defaultValue={val("stock", product?.stock ?? 1)}/></Field>
        <Field label="Kolejność" name="position" error={e.position} hint="Mniejsza liczba = wyżej."><input id="position" name="position" type="number" inputMode="numeric" min={0} defaultValue={val("position", product?.position ?? 0)}/></Field>
      </div>
      <label className="adm-switch"><input type="checkbox" name="isActive" defaultChecked={checked("isActive", product?.isActive ?? true)}/><span>Widoczny w sklepie</span></label>
    </section>

    <section className="adm-card">
      <h2>Szczegóły</h2>
      <StonePicker initial={v ? (v.stones ? v.stones.split("\n") : []) : product?.stones ?? []} suggestions={stones} error={e.stones}/>
      <div className="adm-grid-2">
        <Field label="Materiał" name="material" error={e.material}><input id="material" name="material" maxLength={120} defaultValue={val("material", product?.material ?? "Złocona stal szlachetna")}/></Field>
        <Field label="Rozmiar" name="size" error={e.size}><input id="size" name="size" maxLength={120} defaultValue={val("size", product?.size)} placeholder="np. 42 cm + 5 cm regulacji"/></Field>
        <Field label="Etykieta" name="badge" error={e.badge} hint="np. NOWOŚĆ, BESTSELLER"><input id="badge" name="badge" maxLength={120} defaultValue={val("badge", product?.badge)}/></Field>
      </div>
    </section>

    <div className="adm-sticky-actions"><Link href="/admin/produkty" className="adm-btn">Anuluj</Link><SubmitButton>{product ? "Zapisz zmiany" : "Dodaj produkt"}</SubmitButton></div>
  </form>;
}

function ImagePicker({ current, error, lostFile }: { current: string; error?: string; lostFile: boolean }) {
  const [preview, setPreview] = useState(current);
  const [removeImage, setRemoveImage] = useState(false);
  return <section className="adm-card">
    <h2>Zdjęcie</h2>
    <div className="adm-image-picker">
      <div className="adm-image-preview">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {preview && !removeImage ? <img src={preview} alt="Podgląd zdjęcia produktu"/> : <span>Brak zdjęcia</span>}
      </div>
      <div>
        <Field label="Wybierz lub zrób zdjęcie" name="imageFile" error={error} hint={lostFile ? "Jeśli wybrano nowe zdjęcie, wskaż je ponownie (przeglądarka nie zachowuje plików po błędzie)." : "JPG, PNG lub WEBP, maks. 5 MB. Najlepiej pionowe 4:5."}>
          <input id="imageFile" name="imageFile" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => {
            const file = event.target.files?.[0];
            if (preview.startsWith("blob:")) URL.revokeObjectURL(preview);
            setPreview(file ? URL.createObjectURL(file) : current);
            setRemoveImage(false);
          }}/>
        </Field>
        {current && <label className="adm-switch"><input type="checkbox" name="removeImage" checked={removeImage} onChange={(event) => setRemoveImage(event.target.checked)}/><span>Usuń obecne zdjęcie</span></label>}
      </div>
    </div>
  </section>;
}
