import { GmailAttachment } from "./types";

export function base64UrlDecode(data: string) {
  // Gmail uses base64url: replace URL-safe characters then pad
  const b64 = data.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
  const str = b64 + pad;
  try {
    return Buffer.from(str, "base64").toString("utf8");
  } catch (e) {
    return "";
  }
}

export function decodeQuotedPrintable(input: string): string {
  const stripped = input.replace(/=\r?\n/g, "");
  const bytes: number[] = [];
  for (let i = 0; i < stripped.length; i++) {
    const hex = stripped.slice(i + 1, i + 3);
    if (stripped[i] === "=" && /^[0-9A-Fa-f]{2}$/.test(hex)) {
      bytes.push(parseInt(hex, 16));
      i += 2;
    } else {
      bytes.push(stripped.charCodeAt(i));
    }
  }
  return new TextDecoder("utf-8").decode(new Uint8Array(bytes));
}

function isQuotedPrintable(part: any): boolean {
  const header = (part?.headers ?? []).find(
    (h: { name: string; value: string }) =>
      h.name?.toLowerCase() === "content-transfer-encoding",
  );
  return header?.value?.trim().toLowerCase() === "quoted-printable";
}

export function decodePartText(part: any, data: string): string {
  const decoded = base64UrlDecode(data);
  return isQuotedPrintable(part) ? decodeQuotedPrintable(decoded) : decoded;
}

export function extractTextFromPart(part: any): string[] {
  const results: string[] = [];
  if (!part) return results;
  if (part.mimeType === "text/plain" && part.body?.data) {
    results.push(decodePartText(part, part.body.data));
  }
  if (part.mimeType === "text/html" && part.body?.data) {
    // crude HTML -> text
    const html = decodePartText(part, part.body.data);
    results.push(html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " "));
  }
  for (const child of part.parts ?? []) {
    results.push(...extractTextFromPart(child));
  }
  return results;
}

export function extractAttachments(part: any): GmailAttachment[] {
  const results: GmailAttachment[] = [];
  if (part?.filename) {
    results.push({ filename: part.filename, mimeType: part.mimeType });
  }
  for (const child of part?.parts ?? []) {
    results.push(...extractAttachments(child));
  }
  return results;
}
