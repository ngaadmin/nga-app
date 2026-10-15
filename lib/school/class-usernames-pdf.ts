/** A4 username sheet as a PDF. The class password is not an input and is never written. */

function pdfText(value: string): string {
  return value.replace(/[^\x20-\x7E]/g, "").replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

export function classUsernamesPdfName(className: string): string {
  const slug = className
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${slug || "class"}-usernames.pdf`;
}

export function buildUsernamesPdf(input: {
  className: string;
  usernames: readonly string[];
}): Uint8Array {
  const className = pdfText(input.className) || "Class";
  const names = input.usernames.map((name) => pdfText(name)).filter((name) => name.length > 0);
  const pages: string[][] = [];
  const rowsPerPage = 32;
  const chunks: string[][] = [];
  if (names.length === 0) {
    chunks.push([]);
  }
  for (let index = 0; index < names.length; index += rowsPerPage) {
    chunks.push(names.slice(index, index + rowsPerPage));
  }

  chunks.forEach((rows, pageIndex) => {
    const commands: string[] = [];
    const text = (x: number, y: number, size: number, value: string, brand = false) => {
      commands.push(
        "BT",
        brand ? "0.012 0.122 0.510 rg" : "0.290 0.337 0.459 rg",
        `/F1 ${size} Tf`,
        `1 0 0 1 ${x} ${y} Tm`,
        `(${value}) Tj`,
        "ET",
      );
    };
    let y = 780;
    if (pageIndex === 0) {
      text(64, y, 16, "NextGenAchievers", true);
      y -= 18;
      commands.push("0.012 0.122 0.510 RG", "1.5 w", `64 ${y} m 531 ${y} l S`);
      y -= 36;
      text(64, y, 20, className, true);
      y -= 36;
    }
    text(64, y, 11, "#");
    text(110, y, 11, "User");
    text(280, y, 11, "Username");
    y -= 8;
    commands.push("0.012 0.122 0.510 RG", "1.5 w", `64 ${y} m 531 ${y} l S`);
    const start = pageIndex * rowsPerPage;
    rows.forEach((name, rowIndex) => {
      y -= 22;
      text(64, y, 12, String(start + rowIndex + 1));
      text(280, y, 12, name, true);
      y -= 6;
      commands.push("0.882 0.910 0.965 RG", "0.6 w", `64 ${y} m 531 ${y} l S`);
    });
    pages.push(commands);
  });

  const objects: string[] = [];
  const kids: string[] = [];
  let nextId = 3;
  const pageIds: number[] = [];
  const contentIds: number[] = [];
  pages.forEach(() => {
    pageIds.push(nextId);
    nextId += 1;
    contentIds.push(nextId);
    nextId += 1;
  });
  const fontId = nextId;
  pages.forEach((commands, index) => {
    const stream = commands.join("\n");
    kids.push(`${pageIds[index]} 0 R`);
    objects.push(
      `${pageIds[index]} 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents ${contentIds[index]} 0 R /Resources << /Font << /F1 ${fontId} 0 R >> >> >> endobj`,
    );
    objects.push(
      `${contentIds[index]} 0 obj << /Length ${stream.length} >> stream\n${stream}endstream endobj`,
    );
  });
  objects.push(`${fontId} 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj`);

  const catalog = "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj";
  const pageTree = `2 0 obj << /Type /Pages /Count ${pages.length} /Kids [${kids.join(" ")}] >> endobj`;
  const body = [catalog, pageTree, ...objects];
  let output = "%PDF-1.4\n";
  const offsets: number[] = [0];
  for (const object of body) {
    offsets.push(output.length);
    output += `${object}\n`;
  }
  const xref = output.length;
  output += `xref\n0 ${offsets.length}\n`;
  output += "0000000000 65535 f \n";
  for (let index = 1; index < offsets.length; index += 1) {
    output += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }
  output += `trailer << /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new TextEncoder().encode(output);
}
