import type { Metadata } from "next";
import GuideHub from "@/components/GuideHub";

export const metadata: Metadata = {
  title: "Setup & AI Guide — AP ReasonLab",
  description:
    "Unified setup, AI workflow, deploy, and collaboration guide for AP ReasonLab.",
};

export default function GuidePage() {
  return <GuideHub />;
}
