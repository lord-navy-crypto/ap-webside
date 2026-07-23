import { redirect } from "next/navigation";

export default function GrapherPage() {
  redirect("/hints?tool=grapher");
}
