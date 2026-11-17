import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { products } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { ProductForm } from "@/components/admin/product-form";
import { DangerForm } from "@/components/admin/ui";
import { deleteProductAction } from "../../../actions";
import { getProductFormOptions } from "../data";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const id = decodeURIComponent((await params).id);
  const db = await getDb();
  const [[product], options] = await Promise.all([db.select().from(products).where(eq(products.id, id)), getProductFormOptions(db)]);
  if (!product) notFound();
  return <>
    <div className="adm-head"><div><Link href="/admin/produkty" className="adm-back">← Produkty</Link><h1>{product.name}</h1></div></div>
    <ProductForm product={product} {...options}/>
    <DangerForm action={deleteProductAction} id={product.id} label="Usuń produkt" confirmText={`Usunąć „${product.name}”? Jeśli był zamawiany, zostanie tylko ukryty.`}/>
  </>;
}
