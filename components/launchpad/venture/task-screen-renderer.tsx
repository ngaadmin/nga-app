import type { ReactElement } from "react";
import type { LaunchpadTaskScreen, LaunchpadTaskScreenType } from "@/lib/launchpad/content/types";
import { ChecklistScreen } from "@/components/launchpad/venture/screens/checklist-screen";
import { PlaceholderScreen } from "@/components/launchpad/venture/screens/placeholder-screen";
import { TextScreen } from "@/components/launchpad/venture/screens/text-screen";
import { LogoPickerScreen, NamePickerScreen } from "@/components/launchpad/venture/identity/picker-screens";
import { ContextScreen } from "@/components/launchpad/venture/screens/context-screen";
import { ChoiceCaptureScreen } from "@/components/launchpad/venture/screens/choice-capture-screen";
import { RankOrderScreen } from "@/components/launchpad/venture/screens/rank-order-screen";
import { ShortTextScreen } from "@/components/launchpad/venture/screens/short-text-screen";
import { GoalLoopScreen } from "@/components/launchpad/venture/screens/goal-loop-screen";
import { KnowYourCostFlow } from "@/components/launchpad/venture/screens/know-your-cost-flow";
import { SetPriceFlow } from "@/components/launchpad/venture/screens/set-price-flow";
import { JobsCoverFlow } from "@/components/launchpad/venture/screens/jobs-cover-flow";
import { CompetitorFlow, CustomerCheckFlow, OfferLoopFlow } from "@/components/launchpad/venture/screens/module2-flows";
import { FundingFlow } from "@/components/launchpad/venture/screens/funding-flow";
import { GettingReadyFlow } from "@/components/launchpad/venture/screens/getting-ready-flow";
import { SalesFlow } from "@/components/launchpad/venture/screens/sales-flow";

type Renderers = {
  [T in LaunchpadTaskScreenType]: (screen: Extract<LaunchpadTaskScreen, { type: T }>) => ReactElement;
};

/**
 * Task screen registry, keyed by screen type (mirrors Academy's
 * LESSON_SCREEN_RENDERERS). The mapped type makes a new screen type in
 * types.ts a compile error until it has a renderer here.
 */
export const LAUNCHPAD_TASK_SCREEN_RENDERERS: Renderers = {
  placeholder: (screen) => <PlaceholderScreen screen={screen} />,
  text: (screen) => <TextScreen screen={screen} />,
  checklist: (screen) => <ChecklistScreen screen={screen} />,
  "logo-picker": (screen) => <LogoPickerScreen screen={screen} />,
  "name-picker": (screen) => <NamePickerScreen screen={screen} />,
  context: (screen) => <ContextScreen screen={screen} />,
  "choice-capture": (screen) => <ChoiceCaptureScreen screen={screen} />,
  "rank-order": (screen) => <RankOrderScreen screen={screen} />,
  "short-text": (screen) => <ShortTextScreen screen={screen} />,
  "goal-loop": (screen) => <GoalLoopScreen screen={screen} />,
  "know-your-cost": (screen) => <KnowYourCostFlow screen={screen} />,
  "set-price": (screen) => <SetPriceFlow screen={screen} />,
  "jobs-to-cover": (screen) => <JobsCoverFlow screen={screen} />,
  "offer-loop": (screen) => <OfferLoopFlow screen={screen} />,
  "customer-check": (screen) => <CustomerCheckFlow screen={screen} />,
  "competitor-check": (screen) => <CompetitorFlow screen={screen} />,
  "funding-start": (screen) => <FundingFlow screen={screen} />,
  "getting-ready": (screen) => (
    <GettingReadyFlow screen={screen} floors={[]} businessName="Paws & Paths" onExit={() => {}} onFinish={() => {}} />
  ),
  sales: (screen) => <SalesFlow screen={screen} floors={[]} onExit={() => {}} onFinish={() => {}} />,
};

export const REGISTERED_LAUNCHPAD_TASK_SCREEN_TYPES = Object.keys(
  LAUNCHPAD_TASK_SCREEN_RENDERERS,
) as LaunchpadTaskScreenType[];

export function TaskScreen({ screen }: { screen: LaunchpadTaskScreen }): ReactElement {
  const render = LAUNCHPAD_TASK_SCREEN_RENDERERS[screen.type] as (s: LaunchpadTaskScreen) => ReactElement;
  return render(screen);
}
