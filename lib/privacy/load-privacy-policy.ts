import fs from "node:fs";
import path from "node:path";
import {
  parsePrivacyMarkdown,
  type PrivacyBlock,
} from "@/lib/privacy/parse-privacy-markdown";

/** Single source file for the published privacy policy. Read at build. */
export function privacyPolicySourcePath(): string {
  return path.join(process.cwd(), "content", "privacy-policy.md");
}

export function loadPrivacyPolicyMarkdown(): string {
  return fs.readFileSync(privacyPolicySourcePath(), "utf8");
}

export function loadPrivacyPolicy(): PrivacyBlock[] {
  return parsePrivacyMarkdown(loadPrivacyPolicyMarkdown());
}
