import { redirect } from "next/navigation";

/** Picture box merged into Private Learning Box (upload pictures there). */
export default function PicturePage() {
  redirect("/learning-box?tab=pictures");
}
