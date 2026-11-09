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

/** Level 4 marketing doors for rows 35, 36, and 37. The pitch door stays a placeholder. */
export function salesDoors(): LaunchpadBronze[] {
  return [
    door("l4-s1-b1", "Pick the sales channel(s)", "channels", SALES_CHANNELS_KEY),
    door("l4-s1-b2", "Develop your marketing materials", "materials", MARKETING_MATERIALS_KEY),
    door("l4-s1-b4", "Tell people about it", "targets", TELL_PEOPLE_KEY),
  ];
}

export function applySalesDoors(silver: LaunchpadSilver): LaunchpadSilver {
  const built = new Map(salesDoors().map((item) => [item.id, item]));
  return { ...silver, placeholder: false, bronzes: silver.bronzes.map((item) => built.get(item.id) ?? item) };
}
