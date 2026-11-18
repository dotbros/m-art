import Link from "next/link";
import { getDb } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { HeroSlideForm } from "@/components/admin/hero-slide-form";
import { getHeroFormOptions } from "../data";

export default async function NewHeroSlidePage() {
  await requireAdmin();
  const options = await getHeroFormOptions(await getDb());
  return <>
    <div className="adm-head"><div><Link href="/admin/strona" className="adm-back">← Strona główna</Link><h1>Nowy slajd</h1></div></div>
    <HeroSlideForm {...options}/>
  </>;
}
