import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { CONTENT_PAGES, getPage, IMAGE_FORMATS, isPageSlug, MAX_PAGE_IMAGES } from "@/lib/pages";
import { PageForm } from "@/components/admin/page-form";

export default async function EditContentPage({ params }: { params: Promise<{ slug: string }> }) {
  await requireAdmin();
  const slug = (await params).slug;
  if (!isPageSlug(slug)) notFound();
  const page = await getPage(await getDb(), slug);
  if (!page) notFound();
  const meta = CONTENT_PAGES[slug];
  return <>
    <div className="adm-head"><div><Link href="/admin/strona" className="adm-back">← Strona</Link><h1>{meta.label}</h1></div></div>
    <PageForm page={page} path={meta.path} hasTeaser={meta.hasTeaser} maxImages={MAX_PAGE_IMAGES} formats={IMAGE_FORMATS}/>
  </>;
}
