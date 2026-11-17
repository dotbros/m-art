import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { CategoryForm } from "@/components/admin/category-form";

export default async function NewCategoryPage() {
  await requireAdmin();
  return <>
    <div className="adm-head"><div><Link href="/admin/kategorie" className="adm-back">← Kategorie</Link><h1>Nowa kategoria</h1></div></div>
    <CategoryForm/>
  </>;
}
