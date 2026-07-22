import type { Metadata } from "next";
import "katex/dist/katex.min.css";
import "./globals.css";
import Nav from "@/components/Nav";
import MobileActionBar from "@/components/MobileActionBar";
import RandomPageButton from "@/components/RandomPageButton";
import { brand } from "@/data/brand";

export const metadata: Metadata = {
  title: "Results — Academic Box & Platform",
  description: brand.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <Nav />
        <main className="mx-auto max-w-6xl px-4 py-8 pb-24 md:pb-8">{children}</main>
        <RandomPageButton />
        <MobileActionBar />
        <footer className="border-t border-slate-200 bg-white py-6 text-center text-sm text-slate-500">
          {brand.name} — Academic box & platform. Tutor, not solver.
        </footer>
      </body>
    </html>
  );
}
