import { redirect } from "next/navigation";

/** Image Gen lives in the AI Toolbox only. */
export default function ImageGenPage() {
  redirect("/hints?tool=imagegen");
}
