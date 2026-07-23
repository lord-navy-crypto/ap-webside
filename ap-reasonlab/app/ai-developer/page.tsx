import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AIDeveloperBlocks from "@/components/AIDeveloperBlocks";
import { getContentEditorLevel } from "@/lib/auth";

export const metadata: Metadata = {
  title: "AI Developer Blocks — Results",
  description: "Master-only local AI drafting tools for Results website content.",
};

export default async function AIDeveloperPage() {
  const level = await getContentEditorLevel();
  if (level !== "master") notFound();

  return <AIDeveloperBlocks />;
}
