import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "AP ReasonLab",
  description:
    "Free AP study tool: concept library, hint coach, and half-process practice without final answers.",
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
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        <footer className="border-t border-slate-200 bg-white py-6 text-center text-sm text-slate-500">
          AP ReasonLab — Tutor, not solver. Open-source learning project.
        </footer>
      </body>
    </html>
  );
}
