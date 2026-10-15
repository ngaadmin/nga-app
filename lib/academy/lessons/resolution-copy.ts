export type ResolutionCopy = {
  headline: string;
  paragraphs: string[];
};

/** First sentence is the headline. Blank lines become separate body paragraphs. */
export function splitResolutionCopy(narrative: string): ResolutionCopy {
  const blocks = narrative
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/)
    .map((block) => block.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  if (blocks.length === 0) {
    return { headline: "", paragraphs: [] };
  }

  if (blocks.length > 1) {
    return {
      headline: withFreezeMark(blocks[0] ?? ""),
      paragraphs: blocks.slice(1),
    };
  }

  const text = blocks[0] ?? "";
  const match = /^(.+?[.!?])(?:\s+|$)([\s\S]*)$/.exec(text);
  const headline = withFreezeMark((match?.[1] ?? text).trim());
  const body = (match?.[2] ?? "").trim();
  return { headline, paragraphs: body ? [body] : [] };
}

/** The freeze line keeps the ice cube. */
function withFreezeMark(headline: string): string {
  if (/freeze worked/i.test(headline) && !headline.includes("🧊")) {
    return `${headline} 🧊`;
  }
  return headline;
}
