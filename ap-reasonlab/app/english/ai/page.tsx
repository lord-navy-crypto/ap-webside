import EnglishAiTutor from "@/components/EnglishAiTutor";
import EnglishPageHeader from "@/components/EnglishPageHeader";
import EnglishResourcePanel from "@/components/EnglishResourcePanel";
import Link from "next/link";

export default function EnglishAiPage() {
  return (
    <div className="space-y-8">
      <EnglishPageHeader
        eyebrow="English · Focused AI"
        title="English AI Tutor"
        description="Writing feedback, grammar, vocabulary, original practice, and test strategy — also available as a tab in the AI Toolbox."
      />
      <p className="text-sm text-slate-600">
        Prefer the toolbox layout? Open{" "}
        <Link href="/hints?tool=english" className="font-medium text-brand-700 underline">
          AI Toolbox · English AI
        </Link>
        .
      </p>
      <EnglishAiTutor />
      <EnglishResourcePanel space="ai" title="English AI · pictures, documents & files" />
    </div>
  );
}
