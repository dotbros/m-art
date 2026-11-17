import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { categories } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { CategoryForm } from "@/components/admin/category-form";
import { DangerForm } from "@/components/admin/ui";
import { deleteCategoryAction } from "../../../actions";

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const [category] = await (await getDb()).select().from(categories).where(eq(categories.id, id));
  if (!category) notFound();
  return <>
    <div className="adm-head"><div><Link href="/admin/kategorie" className="adm-back">← Kategorie</Link><h1>{category.name}</h1></div></div>
    <CategoryForm category={category}/>
    <DangerForm action={deleteCategoryAction} id={category.id} label="Usuń kategorię" confirmText={`Usunąć kategorię „${category.name}”? Tej operacji nie można cofnąć.`}/>
  </>;
}
