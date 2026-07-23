import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";

export const metadata = {
  title: "Tools — Knowledge Explorer",
  description: "Online calculator and function grapher for Knowledge Explorer.",
};

const tools = [
  {
    href: "/tools/calculator",
    title: "KE-84 Calculator",
    blurb: "Scientific keypad inspired by Texas Instruments handhelds — sin, log, powers, ANS.",
  },
  {
    href: "/tools/grapher",
    title: "KE Graph",
    blurb: "Plot y = f(x) with zoom, axes, and trace — graphing-calculator style.",
  },
];

export default function ToolsPage() {
  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Tools" }]} />
      <section className="space-y-2">
        <h1 className="section-title">Online tools</h1>
        <p className="max-w-2xl text-sm text-slate-600">
          Computer-style study tools you can use in the browser — no app install.
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
