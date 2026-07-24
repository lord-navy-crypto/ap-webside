"use client";

import ImageGenPanel from "@/components/ImageGenPanel";

/**
 * Standalone Image Generation page — same panel as AI Toolbox.
 */
export default function ImageGenPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Image Generation</h1>
        <p className="mt-2 text-slate-600">
          Generate study diagrams, mnemonic illustrations, or visual aids from a text prompt.
          Also available inside the AI Toolbox. Saved images stay in your browser.
        </p>
      </div>
      <ImageGenPanel />
    </div>
  );
}
