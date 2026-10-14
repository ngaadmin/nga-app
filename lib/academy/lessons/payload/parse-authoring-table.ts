import { inflateRawSync } from "node:zlib";

import type { AuthoringTableSource } from "@/lib/academy/lessons/payload/types";

const ZIP_LOCAL = 0x04034b50;

function u16(bytes: Uint8Array, offset: number): number {
  return (bytes[offset] ?? 0) | ((bytes[offset + 1] ?? 0) << 8);
}

function u32(bytes: Uint8Array, offset: number): number {
  return (
    ((bytes[offset] ?? 0) |
      ((bytes[offset + 1] ?? 0) << 8) |
      ((bytes[offset + 2] ?? 0) << 16) |
      ((bytes[offset + 3] ?? 0) << 24)) >>>
    0
  );
}

function decodeXml(value: string): string {
  return value
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) =>
      String.fromCodePoint(Number.parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, dec: string) =>
      String.fromCodePoint(Number.parseInt(dec, 10)),
    )
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

/** RFC 4180 CSV, including quoted commas and newlines. */
export function parseCsv(text: string): string[][] {
  const input = text.replace(/^\uFEFF/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  const pushRow = () => {
    row.push(cell);
    cell = "";
    if (row.some((value) => value.trim() !== "")) {
      rows.push(row);
    }
    row = [];
  };

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index] ?? "";
    if (inQuotes) {
      if (char === '"') {
        if (input[index + 1] === '"') {
          cell += '"';
          index += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cell += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }
    if (char === ",") {
      row.push(cell);
      cell = "";
      continue;
    }
    if (char === "\n" || char === "\r") {
      if (char === "\r" && input[index + 1] === "\n") index += 1;
      pushRow();
      continue;
    }
    cell += char;
  }

  if (cell.length > 0 || row.length > 0) pushRow();
  return rows;
}

function unzip(bytes: Uint8Array): Map<string, Uint8Array> {
  const files = new Map<string, Uint8Array>();
  let offset = 0;

  while (offset + 30 <= bytes.length) {
    if (u32(bytes, offset) !== ZIP_LOCAL) break;
    const flags = u16(bytes, offset + 6);
    const method = u16(bytes, offset + 8);
    const compressedSize = u32(bytes, offset + 18);
    const nameLength = u16(bytes, offset + 26);
    const extraLength = u16(bytes, offset + 28);
    const nameStart = offset + 30;
    const dataStart = nameStart + nameLength + extraLength;
    const name = new TextDecoder().decode(bytes.subarray(nameStart, nameStart + nameLength));

    if (flags & 0x8) {
      throw new Error(`XLSX entry ${name} uses a data descriptor, which this loader does not read.`);
    }
    if (dataStart + compressedSize > bytes.length) {
      throw new Error(`XLSX entry ${name} runs past the end of the file.`);
    }

    const compressed = bytes.subarray(dataStart, dataStart + compressedSize);
    let data: Uint8Array;
    if (method === 0) {
      data = compressed;
    } else if (method === 8) {
      data = inflateRawSync(compressed);
    } else {
      throw new Error(`XLSX entry ${name} uses unsupported compression method ${method}.`);
    }

    files.set(name, data);
    offset = dataStart + compressedSize;
  }

  return files;
}

function xmlText(xml: string): string {
  const parts: string[] = [];
  const pattern = /<t\b[^>]*>([\s\S]*?)<\/t>/g;
  let match = pattern.exec(xml);
  while (match) {
    parts.push(decodeXml(match[1] ?? ""));
    match = pattern.exec(xml);
  }
  return parts.join("");
}

function sharedStrings(xml: string): string[] {
  const strings: string[] = [];
  const pattern = /<si\b[^>]*>([\s\S]*?)<\/si>/g;
  let match = pattern.exec(xml);
  while (match) {
    strings.push(xmlText(match[1] ?? ""));
    match = pattern.exec(xml);
  }
  return strings;
}

function columnIndex(ref: string): number {
  let index = 0;
  for (const char of ref) {
    if (char < "A" || char > "Z") break;
    index = index * 26 + (char.charCodeAt(0) - 64);
  }
  return index - 1;
}

function parseSheet(xml: string, strings: readonly string[]): string[][] {
  const cells = new Map<number, Map<number, string>>();
  const pattern = /<c\b([^>/]*)\/>|<c\b([^>]*)>([\s\S]*?)<\/c>/g;
  let match = pattern.exec(xml);
  while (match) {
    const attrs = match[1] || match[2] || "";
    const body = match[3] ?? "";
    const ref = /r="([A-Z]+)(\d+)"/.exec(attrs);
    if (!ref) {
      match = pattern.exec(xml);
      continue;
    }
    const column = columnIndex(ref[1] ?? "A");
    const rowNumber = Number.parseInt(ref[2] ?? "0", 10);
    const type = /t="([^"]+)"/.exec(attrs)?.[1] ?? "";
    let value = "";
    if (type === "inlineStr") {
      value = xmlText(body);
    } else {
      const raw = /<v>([\s\S]*?)<\/v>/.exec(body)?.[1] ?? "";
      if (type === "s") {
        value = strings[Number.parseInt(raw, 10)] ?? "";
      } else {
        value = decodeXml(raw);
      }
    }
    const row = cells.get(rowNumber) ?? new Map<number, string>();
    row.set(column, value);
    cells.set(rowNumber, row);
    match = pattern.exec(xml);
  }

  const rowNumbers = [...cells.keys()].sort((a, b) => a - b);
  return rowNumbers.map((rowNumber) => {
    const row = cells.get(rowNumber) ?? new Map<number, string>();
    const width = Math.max(0, ...row.keys()) + 1;
    return Array.from({ length: width }, (_, index) => row.get(index) ?? "");
  });
}

function parseXlsx(bytes: Uint8Array): string[][] {
  const files = unzip(bytes);
  const sheetName =
    [...files.keys()].find((name) => /^xl\/worksheets\/sheet1\.xml$/i.test(name)) ??
    [...files.keys()].find((name) => /^xl\/worksheets\/sheet\d+\.xml$/i.test(name));
  if (!sheetName) {
    throw new Error("XLSX workbook has no worksheet.");
  }
  const shared = files.get("xl/sharedStrings.xml");
  const strings = shared
    ? sharedStrings(new TextDecoder().decode(shared))
    : [];
  const sheet = files.get(sheetName);
  if (!sheet) throw new Error(`Missing worksheet ${sheetName}.`);
  return parseSheet(new TextDecoder().decode(sheet), strings);
}

function isZip(bytes: Uint8Array): boolean {
  return bytes.length >= 4 && u32(bytes, 0) === ZIP_LOCAL;
}

/** Read the first sheet of an xlsx, or a CSV, into header + data rows. */
export function parseAuthoringTable(source: AuthoringTableSource): string[][] {
  const name = source.filename.trim().toLowerCase();
  const bytes = source.bytes;
  if (name.endsWith(".xlsx") || (bytes && isZip(bytes))) {
    if (!bytes) {
      throw new Error(`${source.filename} needs file bytes to parse as a workbook.`);
    }
    return parseXlsx(bytes);
  }

  const text =
    source.text ??
    (bytes ? new TextDecoder().decode(bytes) : "");
  if (!text.trim()) {
    throw new Error(`${source.filename} is empty.`);
  }
  return parseCsv(text);
}
