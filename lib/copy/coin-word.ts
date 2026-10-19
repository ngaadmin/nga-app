/** Display word for a coin count. One is singular. Zero and every other count are plural. */
export function coinWord(count: number): "coin" | "coins" {
  return Math.abs(Math.trunc(count)) === 1 ? "coin" : "coins";
}

/** Fill `{points}` and `{unit}` in a cash-in sentence. */
export function fillCoinTemplate(template: string, points: number): string {
  return template
    .replaceAll("{points}", points.toLocaleString())
    .replaceAll("{unit}", coinWord(points));
}
