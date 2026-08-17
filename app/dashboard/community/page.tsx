import type { Metadata } from "next";
import { CommunityChallengesPanel } from "@/components/community/community-challenges-panel";
import { copyMatrix } from "@/constants/copyMatrix";

export const metadata: Metadata = {
  title: copyMatrix.dashboard.community.title,
  description: copyMatrix.dashboard.community.description,
};

export default function CommunityPage() {
  return <CommunityChallengesPanel />;
}
