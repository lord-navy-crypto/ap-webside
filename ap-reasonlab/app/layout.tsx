import type { Metadata } from "next";
import "katex/dist/katex.min.css";
import "./globals.css";
import Nav from "@/components/Nav";
import MobileActionBar from "@/components/MobileActionBar";
import RandomPageButton from "@/components/RandomPageButton";
import EditModeButton from "@/components/EditModeButton";
import EditorToolsChrome from "@/components/EditorToolsChrome";
import StyleWindow from "@/components/StyleWindow";
import { EditorModeProvider } from "@/components/EditorModeProvider";
import { LocalAIProvider } from "@/components/LocalAIProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { brand } from "@/data/brand";

export const metadata: Metadata = {
  title: "Knowledge Explorer — Academic Box & Platform",
  description: brand.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="ap" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("ke-site-theme");if(t==="cyberpunk"||t==="ap")document.documentElement.setAttribute("data-theme",t);}catch(e){}})();`,
          }}
        />
      </head>
      <body className="site-shell min-h-screen bg-slate-50 text-slate-900 antialiased">
        <ThemeProvider>
          <EditorModeProvider>
            <LocalAIProvider>
              <Nav />
              <EditorToolsChrome />
              <main className="mx-auto max-w-6xl px-4 py-8 pb-24 md:pb-8">{children}</main>
              <RandomPageButton />
              <StyleWindow />
              <EditModeButton />
              <MobileActionBar />
              <footer className="border-t border-slate-200 bg-white py-6 text-center text-sm text-slate-500">
                {brand.name} — Academic box & platform. Tutor, not solver.
              </footer>
            </LocalAIProvider>
          </EditorModeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
