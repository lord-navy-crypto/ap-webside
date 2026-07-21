import Link from "next/link";

export default function CodeJavaPage() {
  return (
    <div className="space-y-6">
      <Link href="/code" className="text-sm text-brand-600 hover:underline">
        ← Back to Code Resource
      </Link>
      <div>
        <h1 className="text-3xl font-bold">Java</h1>
        <p className="mt-2 text-slate-600">
          Java folder under Code Resource. Examples and practice scaffolding go here. A Java
          editor usually needs a remote runner (e.g. Judge0, OneCompiler embed) — doable when
          you are ready.
        </p>
      </div>
      <div className="card text-sm text-slate-600">
        No resources uploaded yet.
      </div>
    </div>
  );
}
