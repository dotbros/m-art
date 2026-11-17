"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/admin/actions";
import { Field, FormMessage, SubmitButton } from "./ui";

export function LoginForm() {
  const [state, action] = useActionState(loginAction, {});
  return <form action={action} className="adm-form">
    <FormMessage state={state}/>
    <Field label="E-mail" name="email"><input id="email" name="email" type="email" autoComplete="username" inputMode="email" required/></Field>
    <Field label="Hasło" name="password"><input id="password" name="password" type="password" autoComplete="current-password" required/></Field>
    <SubmitButton pendingText="Logowanie…">Zaloguj się</SubmitButton>
  </form>;
}
