import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDb } from "@/db";
import { getPage } from "@/lib/pages";
import { ContentPageView } from "@/components/content-page";
import "../content-pages.css";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage(await getDb(), "pielegnacja");
  return { title: "Pielęgnacja biżuterii z kamieni naturalnych | M.art", description: page?.intro.slice(0, 160) || "Jak dbać o biżuterię z kamieni i pereł." };
}

export default async function CarePage() {
  const page = await getPage(await getDb(), "pielegnacja");
  if (!page) notFound();
  return <ContentPageView page={page}/>;
}
