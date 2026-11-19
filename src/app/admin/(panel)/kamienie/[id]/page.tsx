import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { stones } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { countProductsWithStone } from "@/lib/stones";
import { StoneForm } from "@/components/admin/stone-form";
import { DangerForm } from "@/components/admin/ui";
import { deleteStoneAction } from "../../../actions";

export default async function EditStonePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const db = await getDb();
  const [stone] = await db.select().from(stones).where(eq(stones.id, id));
  if (!stone) notFound();
  const productCount = await countProductsWithStone(db, stone.name);
  return <>
    <div className="adm-head"><div><Link href="/admin/kamienie" className="adm-back">← Kamienie</Link><h1>{stone.name}</h1>
      {stone.isActive && <p className="adm-muted"><a href={`/kamienie/${stone.slug}`} target="_blank" rel="noreferrer" className="adm-link-inline">Zobacz stronę kamienia ↗</a></p>}</div></div>
    <StoneForm stone={stone} productCount={productCount}/>
    <DangerForm action={deleteStoneAction} id={stone.id} label="Usuń kamień" confirmText={`Usunąć kamień „${stone.name}”? Zdjęcia zostaną skasowane.`}/>
  </>;
}
