import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";

export const metadata = {
  title: "Tools — Knowledge Explorer",
  description: "Calculator and grapher live in AI Toolbox; /tools keeps short links.",
};

const tools = [
  {
    href: "/hints?tool=calculator",
    title: "KE-84 Calculator",
    blurb: "Open inside AI Toolbox — TI-inspired scientific keypad.",
  },
  {
    href: "/hints?tool=grapher",
    title: "KE Graph",
    blurb: "Open inside AI Toolbox — plot y = f(x) with zoom and trace.",
  },
  {
    href: "/hints?tool=imagegen",
    title: "Image Gen",
    blurb: "Open inside AI Toolbox — generate study diagrams from a prompt.",
  },
  {
    href: "/hints?tool=english",
    title: "English AI",
    blurb: "Open inside AI Toolbox — writing, grammar, vocabulary, test strategy.",
  },
];

export default function ToolsPage() {
  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Tools" }]} />
      <section className="space-y-2">
        <h1 className="section-title">Online tools</h1>
        <p className="max-w-2xl text-sm text-slate-600">
          These tools live in the{" "}
          <Link href="/hints" className="font-medium text-brand-700 underline">
            AI Toolbox
          </Link>
          . Links jump straight to each tab.
        </p>
      </section>
      <div className="grid gap-4 md:grid-cols-2">
        {tools.map((tool) => (
          <Link key={tool.href} href={tool.href} className="card-hover block">
            <h2 className="text-lg font-bold">{tool.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{tool.blurb}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
