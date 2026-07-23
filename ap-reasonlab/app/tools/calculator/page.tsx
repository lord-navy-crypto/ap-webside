import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import TICalculator from "@/components/TICalculator";

export const metadata = {
  title: "Calculator — Knowledge Explorer",
  description: "Online scientific calculator in a Texas Instruments–inspired KE-84 Plus shell.",
};

export default function CalculatorPage() {
  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Tools", href: "/tools" },
          { label: "Calculator" },
        ]}
      />
      <section className="space-y-2">
        <h1 className="section-title">Online calculator</h1>
        <p className="max-w-2xl text-sm text-slate-600">
          TI-inspired scientific keypad for AP math and science. Pair with the{" "}
          <Link href="/tools/grapher" className="font-medium text-brand-700 underline">
            function grapher
          </Link>
          .
        </p>
      </section>
      <TICalculator />
    </div>
  );
}
