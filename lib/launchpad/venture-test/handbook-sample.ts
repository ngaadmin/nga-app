/**
 * TEST-ONLY PLACEHOLDER sample copy for the handbook's identity page
 * ("Vision and products", r4). The seed has no vision or product answers
 * yet (the "Know the product and its buyers" silver is still placeholder),
 * so the page shows this clearly marked sample text instead. Replace with
 * the learner's saved answers once those lessons exist.
 */
export type HandbookVisionSample = { vision: string; products: readonly string[] };

const SAMPLES: Readonly<Record<string, HandbookVisionSample>> = {
  "dog-walking": {
    vision: "Happy, tired dogs and relaxed owners in our neighborhood.",
    products: ["30-minute neighborhood dog walk", "60-minute dog walk", "Overnight dog stay"],
  },
  "friendship-bracelets": {
    vision: "Bright, handmade bracelets that help friends show they care.",
    products: ["Beaded bracelet", "Braided friendship band", "Matching pair set"],
  },
};

/** Sample vision and products for a venture (the dog-walking set when the venture has none). */
export function handbookVisionSample(ventureId: string): HandbookVisionSample {
  return SAMPLES[ventureId] ?? SAMPLES["dog-walking"]!;
}
