import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AIDeveloperBlocks from "@/components/AIDeveloperBlocks";
import { getContentEditorLevel } from "@/lib/auth";
import { canEditContent } from "@/lib/change-codes";

export const metadata: Metadata = {
  title: "AI Developer — Knowledge Explorer",
  description: "Local and cloud AI tools for managed Knowledge Explorer website content.",
};

export default async function AIDeveloperPage() {
  const level = await getContentEditorLevel();
  if (!canEditContent(level)) {
    redirect("/login?next=/ai-developer");
  }

  return <AIDeveloperBlocks />;
}
