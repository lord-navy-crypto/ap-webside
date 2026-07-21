import Link from "next/link";

export default function CodePythonPage() {
  return (
    <div className="space-y-6">
      <Link href="/code" className="text-sm text-brand-600 hover:underline">
        ← Back to Code Resource
      </Link>
      <div>
        <h1 className="text-3xl font-bold">Python</h1>
        <p className="mt-2 text-slate-600">
          Python folder under Code Resource. Add snippets and notebooks here. An in-browser
          editor can be embedded later (Monaco + Pyodide, or Replit iframe).
        </p>
      </div>
      <div className="card text-sm text-slate-600">
        No resources uploaded yet. Use Learning Box in Academic Platform for text notes, or ask
        to add starter Python examples to this folder.
      </div>
    </div>
  );
}
