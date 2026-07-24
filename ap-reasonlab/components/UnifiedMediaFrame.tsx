"use client";

import UploadAndShow from "@/components/UploadAndShow";

type AlsoShow = Array<
  "concept" | "topic" | "formula" | "document" | "member" | "folder" | "subject" | "questionnaire"
>;

type Props = {
  /** Window title shown in the chrome bar */
  title?: string;
  /** Shared site storage area key */
  folderArea: string;
  /** Isolated space (subject name, slug, folder:id, _root) */
  spaceKey?: string;
  spaceBasePath?: string;
  defaultSubject?: string;
  /** Collapse shared uploads by default */
  collapsedByDefault?: boolean;
  allowPublicContributions?: boolean;
  /**
   * Extra add actions for this page (topic, concept, formula, nested folder, subject…).
   * Upload file is always available; include "document" for text documents.
   */
  alsoShow?: AlsoShow;
  onSubjectsChange?: (subjects: string[]) => void;
  onQuestionnairesChange?: (quizzes: unknown[]) => void;
  className?: string;
};

/**
 * In-page shared media panel (scrolls with the page).
 * Pictures, documents, and files here are shared site content for this webpage.
 * Private pictures belong only in Private Learning Box — not here.
 */
export default function UnifiedMediaFrame({
  title = "Pictures, documents & files",
  folderArea,
  spaceKey,
  spaceBasePath,
  defaultSubject,
  collapsedByDefault = false,
  allowPublicContributions = false,
  alsoShow = ["document", "folder"],
  onSubjectsChange,
  onQuestionnairesChange,
  className = "",
}: Props) {
  return (
    <section
      id="page-media"
      className={`scroll-mt-24 overflow-hidden rounded-2xl border border-slate-300 bg-slate-100 shadow-lg ${className}`}
    >
      <div className="flex items-center gap-3 border-b border-slate-300 bg-gradient-to-b from-slate-200 to-slate-150 px-3 py-2">
        <div className="flex gap-1.5" aria-hidden>
          <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
          <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        </div>
        <p className="min-w-0 flex-1 truncate text-center text-xs font-semibold text-slate-700">
          {title}
        </p>
        <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-slate-500">
          Shared · in page
        </span>
      </div>

      <div className="max-h-[min(75vh,40rem)] overflow-y-auto overscroll-contain bg-white p-3 md:p-4">
        <p className="mb-3 text-xs text-slate-500">
          Shared storage for this webpage — <strong>pictures</strong>, <strong>documents</strong>,
          and <strong>files</strong>, plus any custom adds for this page. For private pictures, open{" "}
          <a href="/learning-box?tab=pictures" className="font-medium text-brand-700 underline">
            Private Learning Box
          </a>
          .
        </p>

        <UploadAndShow
          title="Shared pictures, documents, files & custom items"
          folderArea={folderArea}
          spaceKey={spaceKey}
          spaceBasePath={spaceBasePath}
          defaultSubject={defaultSubject}
          collapsedByDefault={collapsedByDefault}
          allowPublicContributions={allowPublicContributions}
          alsoShow={alsoShow}
          onSubjectsChange={onSubjectsChange}
          onQuestionnairesChange={onQuestionnairesChange}
        />
      </div>
    </section>
  );
}
