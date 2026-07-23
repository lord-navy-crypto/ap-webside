import EnglishAiTutor from "@/components/EnglishAiTutor";
import EnglishPageHeader from "@/components/EnglishPageHeader";

export default function EnglishAiPage() {
  return <div className="space-y-8"><EnglishPageHeader eyebrow="English · Focused AI" title="English AI Tutor" description="Use the site's existing Instant-model choices for English-only coaching: writing feedback, grammar, vocabulary, original practice, and test strategy." /><EnglishAiTutor /></div>;
}

