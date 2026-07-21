import Link from "next/link";
import { notFound } from "next/navigation";
import EthicsBanner from "@/components/EthicsBanner";
import QuestionnaireItemCard from "@/components/QuestionnaireItemCard";
import { getQuestionnaireById } from "@/data/questionnaires";

export default async function QuestionnaireDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const quiz = getQuestionnaireById(id);
  if (!quiz) notFound();

  return (
    <div className="space-y-6">
      <Link href="/questionnaires" className="text-sm font-medium text-brand-600 hover:underline">
        ← All generated sets
      </Link>

      <section className="card space-y-3 border-violet-100 bg-gradient-to-br from-white to-violet-50/30">
        <div className="flex flex-wrap gap-2">
          <span className="badge">{quiz.subject}</span>
          <span className="badge-generated">AI GENERATED</span>
          <span className="badge">~{quiz.estimatedMinutes} min</span>
        </div>
        <h1 className="text-3xl font-bold">{quiz.title}</h1>
        <p className="text-slate-600">{quiz.description}</p>
        <p className="rounded-xl bg-slate-50 px-4 py-2 text-sm text-slate-500">
          {quiz.generationNote}
        </p>
      </section>

      <EthicsBanner />

      {quiz.items.map((item, index) => (
        <QuestionnaireItemCard key={item.id} item={item} index={index} />
      ))}
    </div>
  );
}
