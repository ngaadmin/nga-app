import type { Metadata } from "next";
import { CommunityChallengesPanel } from "@/components/community/community-challenges-panel";
import { copyMatrix } from "@/constants/copyMatrix";
import { loadLeaderboardAccess } from "@/lib/privacy/account-data-server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: copyMatrix.dashboard.community.title,
  description: copyMatrix.dashboard.community.description,
};

export default async function CommunityPage() {
  const access = await loadLeaderboardAccess();
  return <CommunityChallengesPanel access={access} />;
}
