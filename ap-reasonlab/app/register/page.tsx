import { redirect } from "next/navigation";

/** Accounts removed — use change codes on each page instead. */
export default function RegisterRedirect() {
  redirect("/");
}
