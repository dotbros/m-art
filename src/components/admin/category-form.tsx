"use client";

import Link from "next/link";
import { useActionState } from "react";
import { saveCategoryAction } from "@/app/admin/actions";
import { Field, FormMessage, SubmitButton, useFocusFirstError } from "./ui";

type Category = { id: number; name: string; slug: string; description: string; position: number; isActive: boolean };

export function CategoryForm({ category }: { category?: Category }) {
  const [state, action] = useActionState(saveCategoryAction, {});
  useFocusFirstError(state);
  const e = state.errors || {};
  const v = state.values;
  const val = (key: string, fallback: string | number | undefined) => (v ? (v[key] ?? "") : String(fallback ?? ""));
  return <form key={state.ts ?? "initial"} action={action} className="adm-form adm-card" noValidate>
    <FormMessage state={state}/>
    {category && <input type="hidden" name="id" value={category.id}/>}
    <Field label="Nazwa kategorii" name="name" error={e.name}><input id="name" name="name" defaultValue={val("name", category?.name)} required maxLength={60} placeholder="np. Naszyjniki"/></Field>
    <Field label="Adres (slug)" name="slug" error={e.slug} hint="Zostaw puste — utworzymy go z nazwy."><input id="slug" name="slug" defaultValue={val("slug", category?.slug)} maxLength={80} placeholder="naszyjniki" autoCapitalize="none"/></Field>
    <Field label="Opis (opcjonalnie)" name="description" error={e.description}><textarea id="description" name="description" defaultValue={val("description", category?.description)} rows={3} maxLength={1000}/></Field>
    <Field label="Kolejność wyświetlania" name="position" error={e.position} hint="Mniejsza liczba = wyżej."><input id="position" name="position" type="number" inputMode="numeric" min={0} max={9999} defaultValue={val("position", category?.position ?? 0)}/></Field>
    <label className="adm-switch"><input type="checkbox" name="isActive" defaultChecked={v ? v.isActive === "on" : category?.isActive ?? true}/><span>Widoczna w sklepie</span></label>
    <div className="adm-sticky-actions"><Link href="/admin/kategorie" className="adm-btn">Anuluj</Link><SubmitButton>{category ? "Zapisz zmiany" : "Dodaj kategorię"}</SubmitButton></div>
  </form>;
}
