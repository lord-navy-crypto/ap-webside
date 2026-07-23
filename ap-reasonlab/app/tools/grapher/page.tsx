import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import TIGrapher from "@/components/TIGrapher";

export const metadata = {
  title: "Grapher — Knowledge Explorer",
  description: "Online function grapher in a Texas Instruments–inspired graphing calculator style.",
};

export default function GrapherPage() {
  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Tools", href: "/tools" },
          { label: "Grapher" },
        ]}
      />
      <section className="space-y-2">
        <h1 className="section-title">Function grapher</h1>
        <p className="max-w-2xl text-sm text-slate-600">
          Plot y = f(x) with grid, zoom, and trace — like a handheld graphing calculator. Also open the{" "}
          <Link href="/tools/calculator" className="font-medium text-brand-700 underline">
            scientific calculator
          </Link>
          .
        </p>
      </section>
      <TIGrapher />
    </div>
  );
}
