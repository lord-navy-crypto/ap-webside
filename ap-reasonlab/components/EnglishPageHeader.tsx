import Link from "next/link";

type Props = { eyebrow: string; title: string; description: string };

export default function EnglishPageHeader({ eyebrow, title, description }: Props) {
  return (
    <>
      <nav aria-label="English breadcrumbs" className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
        <Link href="/english" className="hover:text-brand-700">English</Link><span>/</span><span>{title}</span>
      </nav>
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-blue-900 to-brand-700 px-6 py-8 text-white shadow-xl md:px-9">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-bold md:text-4xl">{title}</h1>
        <p className="mt-3 max-w-3xl leading-7 text-blue-100">{description}</p>
      </section>
    </>
  );
}

