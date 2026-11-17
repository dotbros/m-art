"use client";

import { cloneElement, isValidElement, useActionState, useEffect, useState, type ReactElement, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import type { FormState } from "@/app/admin/actions";

export function SubmitButton({ children, pendingText = "Zapisywanie…", className = "adm-btn adm-btn-primary" }: { children: ReactNode; pendingText?: string; className?: string }) {
  const { pending } = useFormStatus();
  return <button type="submit" className={className} disabled={pending} aria-busy={pending}>{pending ? pendingText : children}</button>;
}

export function Field({ label, name, error, hint, children }: { label: string; name: string; error?: string; hint?: string; children: ReactNode }) {
  const describedBy = error ? `${name}-error` : hint ? `${name}-hint` : undefined;
  const control = isValidElement(children) ? cloneElement(children as ReactElement<Record<string, unknown>>, { "aria-invalid": error ? true : undefined, "aria-describedby": describedBy }) : children;
  return <div className={`adm-field ${error ? "has-error" : ""}`}>
    <label htmlFor={name}>{label}</label>
    {control}
    {hint && !error && <small className="adm-hint" id={`${name}-hint`}>{hint}</small>}
    {error && <small className="adm-error" id={`${name}-error`} role="alert">{error}</small>}
  </div>;
}

export function FormMessage({ state }: { state: FormState }) {
  if (state.error) return <p className="adm-alert adm-alert-error" role="alert">{state.error}</p>;
  if (state.message) return <p className="adm-alert adm-alert-ok" role="status">{state.message}</p>;
  return null;
}

/** Przycisk z potwierdzeniem do akcji nieodwracalnych (usuwanie). */
export function DangerForm({ action, id, label, confirmText }: { action: (prev: FormState, form: FormData) => Promise<FormState>; id: string | number; label: string; confirmText: string }) {
  const [state, formAction] = useActionState(action, {});
  const [armed, setArmed] = useState(false);
  return <form action={formAction} className="adm-danger">
    <input type="hidden" name="id" value={id}/>
    <FormMessage state={state}/>
    {armed ? <div className="adm-danger-confirm"><p>{confirmText}</p><div className="adm-row"><button type="button" className="adm-btn" onClick={() => setArmed(false)}>Anuluj</button><SubmitButton className="adm-btn adm-btn-danger" pendingText="Usuwanie…">Tak, usuń</SubmitButton></div></div>
      : <button type="button" className="adm-btn adm-btn-ghost-danger" onClick={() => setArmed(true)}>{label}</button>}
  </form>;
}

/** Po błędzie walidacji przewija do pierwszego błędnego pola i ustawia na nim fokus (ważne na telefonie). */
export function useFocusFirstError(state: FormState) {
  useEffect(() => {
    if (!state.errors || !Object.keys(state.errors).length) return;
    const el = document.querySelector<HTMLElement>(".adm-field.has-error :is(input,select,textarea)");
    el?.scrollIntoView({ block: "center", behavior: "smooth" });
    el?.focus({ preventScroll: true });
  }, [state.ts, state.errors]);
}