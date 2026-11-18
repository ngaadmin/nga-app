import type { ComponentType } from "react";
import type { LaunchpadFloorType } from "@/lib/launchpad/content/types";
import { CorridorFloor, type CorridorProps } from "@/components/launchpad/venture/corridor-floor";

export type FloorTemplateProps = CorridorProps;

/**
 * Floor template registry, keyed by the payload's floorType. Every floor of
 * that type renders with the same template; only the content differs.
 */
export const LAUNCHPAD_FLOOR_TEMPLATES: Record<LaunchpadFloorType, ComponentType<FloorTemplateProps>> = {
  corridor: CorridorFloor,
};

export function FloorTemplate({ floorType, ...props }: FloorTemplateProps & { floorType: LaunchpadFloorType }) {
  const Template = LAUNCHPAD_FLOOR_TEMPLATES[floorType];
  return <Template {...props} />;
}
