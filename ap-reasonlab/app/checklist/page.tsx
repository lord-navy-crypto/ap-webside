import Link from "next/link";
import { checklistItems, getChecklistStats } from "@/data/checklist";

const statusStyles = {
  done: "border-emerald-200 bg-emerald-50",
  in_progress: "border-amber-200 bg-amber-50",
  todo: "border-slate-200 bg-white",
};

const statusLabel = {
  done: "✅ Done",
  in_progress: "🔄 In progress",
  todo: "📋 To do",
};

export default function ChecklistPage() {
  const stats = getChecklistStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Project Checklist</h1>
        <p className="mt-2 text-slate-600">
          What is live, what we are building, and what you still need to do to
          grow AP ReasonLab.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="card text-center">
          <p className="text-2xl font-bold text-emerald-600">{stats.done}</p>
          <p className="text-sm text-slate-600">Completed</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-amber-600">{stats.inProgress}</p>
          <p className="text-sm text-slate-600">In progress</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-slate-700">{stats.todo}</p>
          <p className="text-sm text-slate-600">Remaining</p>
        </div>
      </div>

      <div className="space-y-3">
        {checklistItems.map((item) => (
          <article
            key={item.id}
            className={`card border-2 ${statusStyles[item.status]}`}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {statusLabel[item.status]}
                </span>
                <h2 className="mt-1 text-lg font-semibold">{item.title}</h2>
                <p className="mt-1 text-sm text-slate-600">{item.description}</p>
              </div>
              {item.link && (
                <Link
                  href={item.link}
                  className="btn-ghost shrink-0 text-sm"
                  {...(item.link.startsWith("http")
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                >
                  Open →
                </Link>
              )}
            </div>
          </article>
        ))}
      </div>

      <section className="card space-y-2">
        <h2 className="section-title">Quick deploy reminder</h2>
        <p className="text-sm text-slate-600">
          After editing content locally, push to GitHub to update the live site:
        </p>
        <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 text-xs text-slate-100">
{`cd "/Users/jason/未命名"
git add ap-reasonlab
git commit -m "Update AP content"
git push`}
        </pre>
      </section>
    </div>
  );
}
