import Link from "next/link";
import { getDb } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { ProductForm } from "@/components/admin/product-form";
import { getProductFormOptions } from "../data";

export default async function NewProductPage() {
  await requireAdmin();
  const options = await getProductFormOptions(await getDb());
  return <>
    <div className="adm-head"><div><Link href="/admin/produkty" className="adm-back">← Produkty</Link><h1>Nowy produkt</h1></div></div>
    {options.categories.length ? <ProductForm {...options}/> : <div className="adm-card adm-empty"><p>Najpierw utwórz kategorię — każdy produkt musi do jakiejś należeć.</p><Link href="/admin/kategorie/nowa" className="adm-btn adm-btn-primary">Utwórz kategorię</Link></div>}
  </>;
}
