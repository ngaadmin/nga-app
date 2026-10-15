export type InlineNode =
  | { kind: "text"; value: string }
  | { kind: "strong"; children: InlineNode[] }
  | { kind: "em"; children: InlineNode[] }
  | { kind: "link"; href: string; children: InlineNode[] };

export type PrivacyBlock =
  | { kind: "h1"; children: InlineNode[] }
  | { kind: "h2"; children: InlineNode[] }
  | { kind: "p"; children: InlineNode[] }
  | { kind: "ul"; items: InlineNode[][] }
  | {
      kind: "table";
      headers: InlineNode[][];
      rows: InlineNode[][][];
    };

function isBlockStart(line: string): boolean {
  return (
    line.startsWith("# ") ||
    line.startsWith("## ") ||
    line.startsWith("|") ||
    line.startsWith("- ")
  );
}

/** Allow only the link kinds this policy uses. */
export function safePolicyHref(href: string): string | null {
  const value = href.trim();
  if (/^mailto:[^\s]+$/i.test(value)) return value;
  if (/^https?:\/\/[^\s]+$/i.test(value)) return value;
  return null;
}

export function parseInline(input: string): InlineNode[] {
  const nodes: InlineNode[] = [];
  let buffer = "";

  const flush = () => {
    if (!buffer) return;
    nodes.push({ kind: "text", value: buffer });
    buffer = "";
  };

  for (let index = 0; index < input.length; ) {
    if (input.startsWith("**", index)) {
      const end = input.indexOf("**", index + 2);
      if (end !== -1) {
        flush();
        nodes.push({
          kind: "strong",
          children: parseInline(input.slice(index + 2, end)),
        });
        index = end + 2;
        continue;
      }
    }

    if (input[index] === "*") {
      const end = input.indexOf("*", index + 1);
      if (end !== -1 && end > index + 1) {
        flush();
        nodes.push({
          kind: "em",
          children: parseInline(input.slice(index + 1, end)),
        });
        index = end + 1;
        continue;
      }
    }

    if (input[index] === "[") {
      const labelEnd = input.indexOf("]", index + 1);
      if (labelEnd !== -1 && input[labelEnd + 1] === "(") {
        const hrefEnd = input.indexOf(")", labelEnd + 2);
        if (hrefEnd !== -1) {
          const href = safePolicyHref(input.slice(labelEnd + 2, hrefEnd));
          if (href) {
            flush();
            nodes.push({
              kind: "link",
              href,
              children: parseInline(input.slice(index + 1, labelEnd)),
            });
            index = hrefEnd + 1;
            continue;
          }
        }
      }
    }

    buffer += input[index] ?? "";
    index += 1;
  }

  flush();
  return nodes;
}

function splitTableRow(line: string): string[] {
  const trimmed = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  return trimmed.split("|").map((cell) => cell.trim());
}

function isTableSeparator(line: string): boolean {
  const cells = splitTableRow(line);
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

function parseTable(lines: string[]): PrivacyBlock {
  const rows = lines.filter((line) => !isTableSeparator(line));
  const headerLine = rows[0] ?? "";
  const bodyLines = rows.slice(1);
  return {
    kind: "table",
    headers: splitTableRow(headerLine).map((cell) => parseInline(cell)),
    rows: bodyLines.map((line) =>
      splitTableRow(line).map((cell) => parseInline(cell)),
    ),
  };
}

/** Parse the privacy policy markdown into blocks. Wording is left unchanged. */
export function parsePrivacyMarkdown(source: string): PrivacyBlock[] {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: PrivacyBlock[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index] ?? "";
    if (line.trim() === "") {
      index += 1;
      continue;
    }

    if (line.startsWith("## ")) {
      blocks.push({ kind: "h2", children: parseInline(line.slice(3).trim()) });
      index += 1;
      continue;
    }

    if (line.startsWith("# ")) {
      blocks.push({ kind: "h1", children: parseInline(line.slice(2).trim()) });
      index += 1;
      continue;
    }

    if (line.startsWith("|")) {
      const tableLines: string[] = [];
      while (index < lines.length && (lines[index] ?? "").startsWith("|")) {
        tableLines.push(lines[index] ?? "");
        index += 1;
      }
      blocks.push(parseTable(tableLines));
      continue;
    }

    if (line.startsWith("- ")) {
      const items: InlineNode[][] = [];
      while (index < lines.length && (lines[index] ?? "").startsWith("- ")) {
        items.push(parseInline((lines[index] ?? "").slice(2).trim()));
        index += 1;
      }
      blocks.push({ kind: "ul", items });
      continue;
    }

    const paragraph = [line];
    index += 1;
    while (
      index < lines.length &&
      (lines[index] ?? "").trim() !== "" &&
      !isBlockStart(lines[index] ?? "")
    ) {
      paragraph.push(lines[index] ?? "");
      index += 1;
    }
    blocks.push({
      kind: "p",
      children: parseInline(paragraph.join(" ").trim()),
    });
  }

  return blocks;
}

export function inlineText(nodes: InlineNode[]): string {
  return nodes
    .map((node) => {
      if (node.kind === "text") return node.value;
      if (node.kind === "link") return inlineText(node.children);
      return inlineText(node.children);
    })
    .join("");
}

export function collectLinks(
  blocks: PrivacyBlock[],
): Array<{ href: string; text: string }> {
  const links: Array<{ href: string; text: string }> = [];

  const walk = (nodes: InlineNode[]) => {
    for (const node of nodes) {
      if (node.kind === "link") {
        links.push({ href: node.href, text: inlineText(node.children) });
      }
      if (node.kind !== "text") walk(node.children);
    }
  };

  for (const block of blocks) {
    if (block.kind === "ul") {
      block.items.forEach(walk);
    } else if (block.kind === "table") {
      block.headers.forEach(walk);
      block.rows.forEach((row) => row.forEach(walk));
    } else {
      walk(block.children);
    }
  }

  return links;
}
