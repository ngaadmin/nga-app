import type { LaunchpadAnswers } from "@/lib/launchpad/content/answers";
import { agreeJobOf, deliverJobOf, findCustomersOf, polishServiceOf, practiceRunOf, wrapJobOf } from "@/lib/launchpad/content/answers";
import {
  AFTER_HOW,
  AGREE_ITEMS,
  BEFORE_HOW,
  CHANNELS,
  FEEDBACK_HOW,
  FIND_CUSTOMERS_KEY,
  AGREE_JOB_KEY,
  DELIVER_JOB_KEY,
  WRAP_JOB_KEY,
  PRACTICE_RUN_KEY,
  POLISH_SERVICE_KEY,
  PAYMENT_HOW,
  POLISH_QUESTIONS,
  PRACTICE_WHEN,
  PRACTICE_WHO,
  agreeTitles,
  feedbackWrap,
  joinHow,
  type PolishRow,
} from "@/lib/launchpad/content/getting-ready/copy";
import { LAUNCHPAD_SURFACE_COPY } from "@/lib/launchpad/content/surface-copy";
import type { ScriptedBlock, ScriptedSheet } from "@/lib/launchpad/content/scripted-sheet";

const NOT_YET = "Not answered yet";

function slot(text: string | null, templates: boolean): ScriptedBlock {
  if (text) return { kind: "paragraph", parts: [{ value: text }] };
  return templates ? { kind: "paragraph", parts: [{ value: null }] } : { kind: "paragraph", parts: [NOT_YET] };
}

/** The three Getting Ready workbook sheets. Copy and answer keys live here; the page component does not. */
export function gettingReadyWorkbookSheets(
  answers: LaunchpadAnswers | undefined,
  serviceLabel: string,
  templates: boolean,
): readonly ScriptedSheet[] {
  const find = findCustomersOf(answers, FIND_CUSTOMERS_KEY);
  const agree = agreeJobOf(answers, AGREE_JOB_KEY);
  const deliver = deliverJobOf(answers, DELIVER_JOB_KEY);
  const wrap = wrapJobOf(answers, WRAP_JOB_KEY);
  const practice = practiceRunOf(answers, PRACTICE_RUN_KEY);
  const polish = polishServiceOf(answers, POLISH_SERVICE_KEY);

  const channels = (find?.channels ?? []).flatMap((id) => {
    const label = CHANNELS.find((row) => row.id === id)?.label;
    return label ? [label] : [];
  });
  const titles = agreeTitles(AGREE_ITEMS.filter((item) => agree?.understood[item.id]).map((item) => item.id));
  const before = deliver ? BEFORE_HOW.find((row) => row.id === deliver.beforeHow)?.label : undefined;
  const after = deliver ? AFTER_HOW.find((row) => row.id === deliver.afterHow)?.label : undefined;
  const payment = joinHow(wrap?.paymentHow ?? [], PAYMENT_HOW);
  const feedback = joinHow(wrap?.feedbackHow ?? [], FEEDBACK_HOW);
  const who = practice ? PRACTICE_WHO.find((row) => row.id === practice.who)?.label ?? practice.who : null;
  const when = practice ? PRACTICE_WHEN.find((row) => row.id === practice.when)?.label ?? practice.when : null;
  const service = serviceLabel.trim() ? serviceLabel.trim().charAt(0).toLowerCase() + serviceLabel.trim().slice(1) : null;
  const notes = polish
    ? feedbackWrap(
        POLISH_QUESTIONS.map((q): PolishRow => ({
          id: q.id,
          result: polish.rows[q.id]?.result ?? "good",
          suggestion: polish.rows[q.id]?.suggestion,
        })),
        LAUNCHPAD_SURFACE_COPY.list.comma,
        LAUNCHPAD_SURFACE_COPY.list.and,
      )
    : null;

  const findBlocks: ScriptedBlock[] = [
    { kind: "section", text: "Getting Ready" },
    { kind: "sub", text: "How I'll find customers" },
  ];
  if (channels.length) findBlocks.push({ kind: "list", items: channels });
  else findBlocks.push(slot(null, templates));
  if (find?.channelsExtra?.trim()) findBlocks.push({ kind: "paragraph", parts: ["Also: ", { value: find.channelsExtra.trim() }] });
  findBlocks.push({ kind: "sub", text: "What I'll agree before a job" });
  if (titles.length) findBlocks.push({ kind: "list", items: titles });
  else if (templates) findBlocks.push({ kind: "paragraph", parts: [{ value: null }] });

  const deliverBlocks: ScriptedBlock[] = [
    { kind: "section", text: "How I'll deliver the job" },
    { kind: "sub", text: "One day before the job" },
    { kind: "paragraph", parts: ["I will contact the owner to confirm the agreed details of the job by ", before || templates ? { value: before ?? null } : NOT_YET, "."] },
    { kind: "sub", text: "Straight after I've delivered the service" },
    { kind: "paragraph", parts: ["I will show proof by sending ", after || templates ? { value: after ?? null } : NOT_YET, "."] },
    { kind: "section", text: "How I'll wrap up a job" },
    { kind: "sub", text: "Taking payment" },
    { kind: "paragraph", parts: ["I will collect payment by ", payment || templates ? { value: payment || null } : NOT_YET, "."] },
    { kind: "sub", text: "Getting feedback" },
    { kind: "paragraph", parts: ["I will ask the owner for feedback or a short review by ", feedback || templates ? { value: feedback || null } : NOT_YET, "."] },
  ];

  const practiceBlocks: ScriptedBlock[] = [
    { kind: "section", text: "Your practice run" },
    { kind: "paragraph", parts: ["I will do a practice run for ", who || templates ? { value: who } : NOT_YET, "."] },
    { kind: "paragraph", parts: ["I will do the following service for them ", service || templates ? { value: service } : NOT_YET, "."] },
    { kind: "paragraph", parts: ["I will do it ", when || templates ? { value: when } : NOT_YET, "."] },
    { kind: "section", text: "Feedback from my trial run" },
  ];
  if (notes) {
    for (const note of notes.notes) practiceBlocks.push({ kind: "paragraph", parts: [note.question, " ", { value: note.note }] });
    if (notes.happyLead && notes.happy) {
      practiceBlocks.push({ kind: "paragraph", parts: [notes.happyLead] });
      practiceBlocks.push({ kind: "paragraph", parts: [{ value: notes.happy }, "."] });
    }
  } else if (templates) {
    practiceBlocks.push({ kind: "paragraph", parts: [{ value: null }] });
  }

  return [
    { id: "ready-a", blocks: findBlocks, largeScribble: "kit" },
    { id: "ready-b", blocks: deliverBlocks },
    { id: "ready-c", blocks: practiceBlocks, compact: true },
  ];
}
