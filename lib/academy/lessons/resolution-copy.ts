/** First sentence is the headline. The freeze line keeps the ice cube. */
export function splitResolutionCopy(narrative: string): {
  headline: string;
  body: string;
} {
  const text = narrative.replace(/\s+/g, " ").trim();
  const match = /^(.+?[.!?])(?:\s+|$)([\s\S]*)$/.exec(text);
  let headline = (match?.[1] ?? text).trim();
  const body = (match?.[2] ?? "").trim();
  if (/freeze worked/i.test(headline) && !headline.includes("🧊")) {
    headline = `${headline} 🧊`;
  }
  return { headline, body };
}
