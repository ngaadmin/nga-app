/**
 * Funding bronze (framework row 26, md5 20525757).
 * A plan only: no interest, no charity, no lender.
 */
import type { LaunchpadBronze, LaunchpadFundingScreen } from "@/lib/launchpad/content/types";

export const FUNDING_ANSWER_KEY = "funding_start";

/** Mode A: startup / count, 2 decimal places. Half-up via Math.round. */
export function periodPayment(startupTotal: number, count: number): number {
  if (count < 1) return 0;
  return Math.round((startupTotal / count) * 100) / 100;
}

/** Mode B: 0 when start-up is 0, otherwise start-up / weekly amount, rounded up. */
export function weeksToRepay(startupTotal: number, weeklyAmount: number): number | null {
  if (!(weeklyAmount > 0)) return null;
  if (startupTotal <= 0) return 0;
  const cents = Math.round(startupTotal * 100);
  const weekly = Math.round(weeklyAmount * 100);
  return Math.ceil(cents / weekly);
}

export function fundingScreen(): LaunchpadFundingScreen {
  return {
    id: "l2-s3-b1-t1-funding",
    type: "funding-start",
    answerKey: FUNDING_ANSWER_KEY,
    costsFrom: "l2-costs",
    copy: {
      context:
        "You know what it costs to start and what you will charge. Before you buy the gear, decide how you will cover that start-up total, from money you already have or by borrowing and paying it back.",
      guidance:
        "Look at your start-up total. If you already have that amount, you can fund it yourself. If you need to borrow, pick a payback plan you can keep. You can repay a set amount over a number of weeks or months, or pick a weekly amount (for example $5 a week) and see how long it takes to pay back the whole start-up total. These sums do not add interest.",
      prompt: "How will you cover it?",
      ownCash: "From my own cash or savings",
      borrow: "Borrow it",
      ownCashConfirm: "You'll cover your start-up cost of {startup-total} {currency} from your own cash or savings.",
      paybackTitle: "How will you pay it back?",
      fixedMode: "Same amount over a set time",
      fixedHelp: "Pick how many weeks or months. We work out each payment.",
      weeklyMode: "A set amount each week",
      weeklyHelp: "Pick a weekly amount. We work out how long it takes.",
      fixedShow: "You'll pay about {funding_period_payment} {currency} each {unit} for {funding_repay_count} {unit}.",
      weeklyShow: "At {funding_weekly_amount} {currency} a week, it will take about {funding_weeks_to_repay} weeks to pay back {startup_total} {currency}.",
      disclaimer: "Real loans usually add interest; we've left that out here to keep it simple.",
      missing: "Finish Know your cost first so we can show your start-up total.",
      missingAction: "Go to Know your cost",
    },
  };
}

export function fundingBronze(): LaunchpadBronze {
  return {
    id: "l2-s3-b1",
    title: "Get the money you need to start",
    placeholder: false,
    tasks: [
      {
        id: "l2-s3-b1-t1",
        title: "Get the money you need to start",
        placeholder: false,
        screens: [fundingScreen()],
      },
    ],
  };
}
