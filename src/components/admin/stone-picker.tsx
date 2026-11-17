"use client";

import { useState, type KeyboardEvent } from "react";
import { MAX_STONES } from "@/lib/catalog";

const key = (s: string) => s.toLocaleLowerCase("pl-PL");
const capitalize = (s: string) => s.charAt(0).toLocaleUpperCase("pl-PL") + s.slice(1);

/**
 * Wybór wielu kamieni — przyjazny dla telefonu:
 * • wybrane kamienie jako „chipsy” z × do usunięcia,
 * • dotychczas używane kamienie jako przyciski do jednego dotknięcia (spójne nazwy w filtrach sklepu),
 * • pole do dopisania nowego kamienia (Enter, przecinek lub „Dodaj”).
 * Każdy wybrany kamień trafia do formularza jako ukryte pole `stones`.
 */
export function StonePicker({ initial, suggestions, error }: { initial: string[]; suggestions: string[]; error?: string }) {
  const [selected, setSelected] = useState<string[]>(initial);
  const [draft, setDraft] = useState("");
  const full = selected.length >= MAX_STONES;

  function add(raw: string) {
    const name = capitalize(raw.replace(/\s+/g, " ").trim()).slice(0, 60);
    if (!name || full) return;
    // Jeśli taki kamień już istnieje (inna wielkość liter) — używamy istniejącej nazwy.
    const existing = suggestions.find((s) => key(s) === key(name)) ?? name;
    setSelected((current) => (current.some((s) => key(s) === key(existing)) ? current : [...current, existing]));
    setDraft("");
  }
  const remove = (name: string) => setSelected((current) => current.filter((s) => s !== name));
  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") { event.preventDefault(); add(draft); }
    else if (event.key === "Backspace" && !draft && selected.length) remove(selected[selected.length - 1]);
  }

  const available = suggestions.filter((s) => !selected.some((x) => key(x) === key(s)) && (!draft || key(s).includes(key(draft.trim()))));

  return <div className={`adm-field adm-stones ${error ? "has-error" : ""}`}>
    <label htmlFor="stone-input">Kamienie</label>
    {selected.map((name) => <input key={name} type="hidden" name="stones" value={name}/>)}

    <ul className="adm-chip-list" aria-label="Wybrane kamienie">
      {selected.length ? selected.map((name) => <li key={name} className="adm-chip is-selected">
        <span>{name}</span>
        <button type="button" onClick={() => remove(name)} aria-label={`Usuń kamień: ${name}`}>×</button>
      </li>) : <li className="adm-hint">Nie wybrano żadnego kamienia.</li>}
    </ul>

    <div className="adm-stone-add">
      <input id="stone-input" value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={onKeyDown} disabled={full}
        placeholder={full ? `Maksymalnie ${MAX_STONES} kamieni` : "Wpisz nazwę kamienia…"} maxLength={60} autoComplete="off" enterKeyHint="done"
        aria-invalid={error ? true : undefined} aria-describedby={error ? "stones-error" : "stones-hint"}/>
      <button type="button" className="adm-btn" onClick={() => add(draft)} disabled={!draft.trim() || full}>Dodaj</button>
    </div>

    {available.length > 0 && !full && <div className="adm-chip-suggest">
      <small className="adm-hint">{draft ? "Pasujące kamienie:" : "Dotknij, aby dodać:"}</small>
      <ul className="adm-chip-list">{available.map((name) => <li key={name}><button type="button" className="adm-chip" onClick={() => add(name)}>+ {name}</button></li>)}</ul>
    </div>}

    {error ? <small className="adm-error" id="stones-error" role="alert">{error}</small>
      : <small className="adm-hint" id="stones-hint">Służą do filtrowania w sklepie. Możesz wybrać kilka — np. naszyjnik z agatem i perłami.</small>}
  </div>;
}
