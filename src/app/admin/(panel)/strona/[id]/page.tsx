import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { heroSlides } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { HeroSlideForm } from "@/components/admin/hero-slide-form";
import { DangerForm } from "@/components/admin/ui";
import { deleteHeroSlideAction } from "../../../actions";
import { getHeroFormOptions } from "../data";

export default async function EditHeroSlidePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const db = await getDb();
  const [[slide], options] = await Promise.all([db.select().from(heroSlides).where(eq(heroSlides.id, id)), getHeroFormOptions(db)]);
  if (!slide) notFound();
  return <>
    <div className="adm-head"><div><Link href="/admin/strona" className="adm-back">← Strona główna</Link><h1>{slide.title} {slide.titleAccent}</h1></div></div>
    <HeroSlideForm slide={slide} {...options}/>
    <DangerForm action={deleteHeroSlideAction} id={slide.id} label="Usuń slajd" confirmText={`Usunąć slajd „${slide.title}”? Zdjęcie lub film zostanie skasowane.`}/>
  </>;
}
