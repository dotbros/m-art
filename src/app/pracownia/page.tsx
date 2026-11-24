import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDb } from "@/db";
import { getPage } from "@/lib/pages";
import { ContentPageView } from "@/components/content-page";
import "../content-pages.css";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage(await getDb(), "pracownia");
  return { title: "O pracowni M.art — biżuteria tworzona ręcznie", description: page?.intro.slice(0, 160) || "Poznaj pracownię M.art.", openGraph: { images: page?.images[0] ? [page.images[0]] : [] } };
}

export default async function WorkshopPage() {
  const page = await getPage(await getDb(), "pracownia");
  if (!page) notFound();
  return <ContentPageView page={page}/>;
}
