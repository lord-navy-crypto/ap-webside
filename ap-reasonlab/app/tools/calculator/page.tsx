import { redirect } from "next/navigation";

export default function CalculatorPage() {
  redirect("/hints?tool=calculator");
}
