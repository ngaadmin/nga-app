import type { LaunchpadBronze, LaunchpadSalesScreen, LaunchpadSilver, LaunchpadTask } from "@/lib/launchpad/content/types";
import {
  CHANNELS,
  HOOKS,
  PROOFS,
  MARKETING_MATERIALS_KEY,
  MATERIALS_CONTEXT,
  MATERIALS_GUIDANCE,
  MATERIALS_QUESTION,
  PIECE_FIELDS,
  SALES_CHANNELS_KEY,
  SALES_CONTEXT,
  SALES_GUIDANCE,
  SALES_PERMISSION,
  SALES_QUESTION,
  SALES_WHERE_PROMPT,
  TELL_GUIDANCE,
  TELL_PEOPLE_KEY,
  TELL_QUESTION,
  WHERE_GROUPS,
  WHERE_PAGES,
  ORDER_SYSTEM,
  ORDER_SYSTEM_KEY,
} from "@/lib/launchpad/content/sales/copy";

function screen(step: LaunchpadSalesScreen["step"], answerKey: string, id: string): LaunchpadSalesScreen {
  const base = { id: `${id}-s1`, type: "sales" as const, step, answerKey };
  if (step === "channels") {
    return {
      ...base,
      title: "Pick the sales channels",
      question: SALES_QUESTION,
      context: SALES_CONTEXT,
      hint: SALES_GUIDANCE,
      wherePrompt: SALES_WHERE_PROMPT,
      permission: SALES_PERMISSION,
      channels: CHANNELS.map((row) => ({ id: row.id, label: row.label })),
      whereGroups: WHERE_GROUPS.map((group) => ({ ...group, options: group.options.map((row) => ({ ...row })) })),
      wherePages: WHERE_PAGES,
    };
  }
  if (step === "materials") {
    return {
      ...base,
      title: "Develop your marketing materials",
      question: MATERIALS_QUESTION,
      context: MATERIALS_CONTEXT,
      hint: MATERIALS_GUIDANCE,
      serviceLabels: { main: "Your main service", second: "Second service to list" },
      hooks: HOOKS.map((row) => ({ ...row })),
      proofs: PROOFS.map((row) => ({ ...row })),
      pieceFields: PIECE_FIELDS.map((field) => ({ ...field, options: field.options.map((row) => ({ ...row })) })),
    };
  }
  return {
    ...base,
    title: "Tell people about it",
    question: TELL_QUESTION,
    hint: TELL_GUIDANCE,
    permission: SALES_PERMISSION,
  };
}

function task(id: string, title: string, step: LaunchpadSalesScreen["step"], answerKey: string): LaunchpadTask {
  return { id, title, placeholder: false, screens: [screen(step, answerKey, id)] };
}

function door(id: string, title: string, step: LaunchpadSalesScreen["step"], answerKey: string): LaunchpadBronze {
  return { id, title, placeholder: false, tasks: [task(`${id}-t1`, title, step, answerKey)] };
}

/** Level 4 marketing doors. The pitch door was removed. Tell people stays. */
export function salesDoors(): LaunchpadBronze[] {
  return [
    door("l4-s1-b1", "Pick the sales channel(s)", "channels", SALES_CHANNELS_KEY),
    door("l4-s1-b2", "Develop your marketing materials", "materials", MARKETING_MATERIALS_KEY),
    door("l4-s1-b4", "Tell people about it", "targets", TELL_PEOPLE_KEY),
  ];
}

/** Level 4 silver 2. One bronze, two screens inside the task. */
export function orderSystemSilver(): LaunchpadSilver {
  const id = "l4-s2-b1";
  const screen: LaunchpadSalesScreen = {
    id: `${id}-t1-s1`,
    type: "sales",
    step: "order",
    answerKey: ORDER_SYSTEM_KEY,
    title: ORDER_SYSTEM.title,
    order: {
      question: ORDER_SYSTEM.question,
      context: ORDER_SYSTEM.context,
      guidance: ORDER_SYSTEM.guidance,
      trackerLead: ORDER_SYSTEM.trackerLead,
      emptyLabel: ORDER_SYSTEM.emptyLabel,
      trackerOptions: ORDER_SYSTEM.trackerOptions.map((row) => ({ ...row })),
      playbackTitle: ORDER_SYSTEM.playbackTitle,
      templateBefore: ORDER_SYSTEM.templateBefore,
      templateStrong: ORDER_SYSTEM.templateStrong,
      templateAfter: ORDER_SYSTEM.templateAfter,
      repeatLine: ORDER_SYSTEM.repeatLine,
      reminderLead: ORDER_SYSTEM.reminderLead,
      reminderDefault: ORDER_SYSTEM.reminderDefault,
      reminderOptions: ORDER_SYSTEM.reminderOptions.map((row) => ({ ...row })),
      checkLine: ORDER_SYSTEM.checkLine,
      workbookTitle: ORDER_SYSTEM.workbookTitle,
      trackerBefore: ORDER_SYSTEM.trackerBefore,
      trackerAfter: ORDER_SYSTEM.trackerAfter,
      reminderBefore: ORDER_SYSTEM.reminderBefore,
      reminderAfter: ORDER_SYSTEM.reminderAfter,
      checkBefore: ORDER_SYSTEM.checkBefore,
      checkPick: ORDER_SYSTEM.checkPick,
      checkAfter: ORDER_SYSTEM.checkAfter,
    },
  };
  return {
    id: "l4-s2",
    title: ORDER_SYSTEM.silverTitle,
    placeholder: false,
    bronzes: [
      {
        id,
        title: ORDER_SYSTEM.title,
        placeholder: false,
        tasks: [{ id: `${id}-t1`, title: ORDER_SYSTEM.title, placeholder: false, screens: [screen] }],
      },
    ],
  };
}

export function applySalesDoors(silver: LaunchpadSilver): LaunchpadSilver {
  const built = salesDoors();
  const used = new Set<string>();
  return {
    ...silver,
    placeholder: false,
    bronzes: silver.bronzes.map((item) => {
      const match = built.find((door) => !used.has(door.id) && (door.id === item.id || door.title === item.title));
      if (!match) return item;
      used.add(match.id);
      return match;
    }),
  };
}
