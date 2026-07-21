import Link from "next/link";
import { keyConceptGuides } from "@/data/key-concepts";

const categoryLabel = {
  ap_content: "AP Content",
  ai_for_ap: "AI for AP",
  study_skill: "Study Skill",
};

export default function KeyConceptsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Key Concept Guides</h1>
        <p className="mt-2 text-slate-600">
          Introductions, how to use AI for each topic, and concept-check questions
          (hints only — no final answer keys).
        </p>
      </div>

      <div className="grid gap-4">
        {keyConceptGuides.map((guide) => (
          <Link
            key={guide.id}
            href={`/key-concepts/${guide.id}`}
            className="card block transition hover:border-brand-300"
          >
            <div className="flex flex-wrap gap-2">
              <span className="badge">{guide.subject}</span>
              <span className="badge">{categoryLabel[guide.category]}</span>
            </div>
            <h2 className="mt-3 text-xl font-semibold">{guide.title}</h2>
            <p className="mt-2 line-clamp-2 text-sm text-slate-600">
              {guide.introduction}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
