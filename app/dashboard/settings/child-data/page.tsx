import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** Each child's data and privacy now lives on their page in the Parent Hub. */
export default function ChildDataPage() {
  redirect("/dashboard/parent");
}
