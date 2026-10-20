import { notFound } from "next/navigation";
import { DataPreview } from "@/components/privacy/data-preview";

const SCREENS = [
  "parent-flow",
  "parent-child",
  "delete-child",
  "parent-record",
  "parent-record-open",
  "teacher-class",
  "teacher-student",
  "delete-student",
  "teacher-account",
  "delete-teacher",
  "kid-info",
  "kid-info-class",
  "leaderboard-home",
  "leaderboard-asked",
  "leaderboard-school",
  "leaderboard-guest",
] as const;

/** Dev and test only. Production returns not found. */
export default async function DataPreviewPage({
  params,
}: {
  params: Promise<{ screen: string }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();
  const { screen } = await params;
  if (!SCREENS.includes(screen as (typeof SCREENS)[number])) notFound();
  return <DataPreview screen={screen} />;
}
