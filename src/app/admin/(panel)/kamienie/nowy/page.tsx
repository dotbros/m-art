import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { StoneForm } from "@/components/admin/stone-form";

export default async function NewStonePage() {
  await requireAdmin();
  return <>
    <div className="adm-head"><div><Link href="/admin/kamienie" className="adm-back">← Kamienie</Link><h1>Nowy kamień</h1></div></div>
    <StoneForm/>
  </>;
}
