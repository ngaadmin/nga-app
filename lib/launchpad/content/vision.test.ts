import { describe, expect, it } from "vitest";
import { fieldsAnswer, rankingAnswer, selectionAnswer, type LaunchpadAnswers } from "@/lib/launchpad/content/answers";
import { summaryCatalog } from "@/lib/launchpad/content/summary";
import type { LaunchpadVisionSpec } from "@/lib/launchpad/content/types";
import { compileVision, compileVisionTemplate, naturalList, visionPieces, visionTokens } from "@/lib/launchpad/content/vision";
import { parseSentence } from "@/lib/launchpad/load/sentence";
import { launchpadTestVentureSeed } from "@/lib/launchpad/content/seed/launchpad-test-venture-seed";

const payload = launchpadTestVentureSeed("dog-walking");
const floors = payload.floors;
const catalog = summaryCatalog(floors);
const spec = floors
  .flatMap((f) => f.silvers)
  .map((s) => (s.wrapUp?.type === "identity-wrap-up" ? s.wrapUp.vision : undefined))
  .find(Boolean) as LaunchpadVisionSpec;

/** The I19 dog walking example. */
const example: LaunchpadAnswers = {
  "l1-offer": selectionAnswer(["dog-walking", "grooming", "dog-sitting"]),
  "l1-why": rankingAnswer(["make-money", "help-others", "learn-new-skills", "be-my-own-boss"], ["learn-new-skills", "be-my-own-boss"]),
  "l1-cause": selectionAnswer(["animals"]),
  "l1-goal-make-money": fieldsAnswer({ amount: 200, currency: "USD", timeframeNumber: 3, timeframeUnit: "months", savingFor: "a new bike" }, false),
  "l1-goal-help-others": fieldsAnswer({ customerCount: 10, benefit: "come-home-to-a-happy-well-looked-after-dog", timeframeNumber: 6, timeframeUnit: "months" }, false),
  "l1-goal-support-a-cause": fieldsAnswer({ donatePercent: 10 }, false),
};
const without = (a: LaunchpadAnswers, ...keys: string[]) => Object.fromEntries(Object.entries(a).filter(([k]) => !keys.includes(k))) as LaunchpadAnswers;

describe("vision template (H19)", () => {
  it("comes from the tracker through the load onto the identity wrap-up", () => {
    expect(spec).toBeTruthy();
    expect(spec.label).toBe("Our vision");
    expect(spec.template).toMatch(/^I am starting a \{business-type\} business\./);
    expect(spec.template).toContain("[[As I grow, I'll give {cause-percent}% of every sale to support {cause}.]]");
    expect(spec.businessType).toBe("dog walking");
  });

  it("parses [[ ]] as one optional clause, never as a bracket field, and keeps {product}", () => {
    const p = parseSentence(spec.template);
    expect(p.slots.map((s) => s.kind)).toEqual(["token", "token", "token", "optional", "token"]);
    const opt = p.slots[3]!;
    expect(opt.kind === "optional" && opt.inner.slots.map((s) => (s.kind === "token" ? s.token : s.kind))).toEqual(["cause-percent", "cause"]);
    expect(opt.kind === "optional" && opt.inner.tokens[0]).toEqual({ kind: "text", text: "As I grow, I'll give " });
    const prod = parseSentence("Would you buy a {product}? [Yes/No]");
    expect(prod.slots).toEqual([
      { kind: "token", token: "product", raw: "{product}" },
      { kind: "bracket", label: "Yes/No", raw: "[Yes/No]", choices: ["Yes", "No"] },
    ]);
  });
});

describe("vision tokens", () => {
  const tokens = visionTokens(spec, example, catalog);
  it("business type is the venture noun, lower case", () => expect(tokens["business-type"]).toBe("dog walking"));
  it("offer list is the picks as a natural list, lower case", () => expect(tokens["offer-list"]).toMatch(/^dog walk.*, grooming.* and .*sitting/));
  it("why list keeps only reasons above the line, in rank order", () => expect(tokens["why-list"]).toBe("make money and help others"));
  it("why list follows the ranking order", () => {
    const t = visionTokens(spec, { ...example, "l1-why": rankingAnswer(["help-others", "make-money", "learn-new-skills", "be-my-own-boss"], ["be-my-own-boss"]) }, catalog);
    expect(t["why-list"]).toBe("help others, make money and learn new skills");
  });
  it("cause is the pick, lower case; percent is the Support a cause percent", () => {
    expect(tokens.cause).toBe("animals");
    expect(tokens["cause-percent"]).toBe("10");
  });
  it("goal list joins each filled goal sentence, ranked order, no cause goal, Add another goal last", () => {
    expect(tokens["goal-list"]).toMatch(/^I want to earn 200 .* in 3 months\. I'm saving for a new bike\. I want 10 customers to come home to a happy, well looked-after dog in 6 months\.$/);
    const t = visionTokens(spec, { ...example, "l1-goal-other": fieldsAnswer({ goalText: "save up" }, false) }, catalog);
    expect(t["goal-list"]).toMatch(/looked-after dog in 6 months\. My goal is to save up\.$/);
  });
  it("single items read alone", () => {
    const one = { ...example, "l1-offer": selectionAnswer(["grooming"]), "l1-why": rankingAnswer(["make-money", "help-others", "learn-new-skills", "be-my-own-boss"], ["help-others", "learn-new-skills", "be-my-own-boss"]) };
    const t = visionTokens(spec, one, catalog);
    expect(t["offer-list"]).not.toMatch(/ and |,/);
    expect(t["why-list"]).toBe("make money");
  });
  it("naturalList", () => {
    expect(naturalList([])).toBe("");
    expect(naturalList(["a"])).toBe("a");
    expect(naturalList(["a", "b"])).toBe("a and b");
    expect(naturalList(["a", "b", "c"])).toBe("a, b and c");
  });
});

describe("compiled vision sentence", () => {
  it("renders the dog walking example", () => {
    const s = compileVision(spec, example, catalog)!;
    expect(s).toMatch(/^I am starting a dog walking business\. I will offer dog walk.+\. I'm doing it to make money and help others\. As I grow, I'll give 10% of every sale to support animals\. My goals: I want to earn 200 .+ in 3 months\. I'm saving for a new bike\. I want 10 customers to come home to a happy, well looked-after dog in 6 months\.$/);
  });
  it("drops the cause clause whole when no cause is picked or no percent is set", () => {
    for (const a of [without(example, "l1-cause"), without(example, "l1-goal-support-a-cause"), { ...example, "l1-goal-support-a-cause": fieldsAnswer({ donatePercent: 0 }, false) }]) {
      const s = compileVision(spec, a, catalog)!;
      expect(s).toContain("I'm doing it to make money and help others. My goals: ");
      expect(s).not.toMatch(/As I grow|support|%/);
    }
  });
  it("underlines only the filled-in slots, and joining them matches the sentence", () => {
    const pieces = visionPieces(spec, example, catalog)!;
    const joined = pieces
      .map((piece) => piece.text)
      .join("")
      .replace(/\s+/g, " ")
      .trim();
    expect(joined).toBe(compileVision(spec, example, catalog));
    const plain = pieces.filter((piece) => !piece.chosen).map((piece) => piece.text).join("");
    expect(plain).toContain("I am starting a ");
    expect(plain).toContain(" business. I will offer ");
    expect(plain).not.toContain("dog walking");
    expect(pieces.filter((piece) => piece.chosen).map((piece) => piece.text)).toEqual(
      expect.arrayContaining(["dog walking", "make money", "help others", "10", "animals"]),
    );
    expect(plain).toContain("I want to earn ");
    expect(plain).toContain("I'm saving for ");
    expect(pieces.some((piece) => piece.chosen && piece.text.includes("200"))).toBe(true);
    expect(pieces.some((piece) => piece.chosen && /new bike/.test(piece.text))).toBe(true);
  });
  it("is empty (placeholder) when a required token is empty", () => {
    expect(compileVision(spec, {}, catalog)).toBeNull();
    expect(compileVision(spec, without(example, "l1-offer"), catalog)).toBeNull();
    expect(compileVision(spec, without(example, "l1-why"), catalog)).toBeNull();
    expect(compileVision(spec, without(example, "l1-goal-make-money", "l1-goal-help-others"), catalog)).toBeNull();
    expect(compileVisionTemplate("A {x}.[[ B {y}.]]", { x: "" , y: "y" })).toBeNull();
    expect(compileVisionTemplate("A {x}.[[ B {y}.]] C", { x: "x", y: "" })).toBe("A x. C");
  });
});
