import { Participant } from "./types";

// Splits an RFC 2822 address-list header value on top-level commas only —
// a naive .split(",") would break on quoted display names like
// `"Doe, Jane" <jane@x.com>`.
function splitAddressList(raw: string): string[] {
  const chunks: string[] = [];
  let current = "";
  let inQuotes = false;

  for (const char of raw) {
    if (char === '"') inQuotes = !inQuotes;
    if (char === "," && !inQuotes) {
      chunks.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  if (current.trim()) chunks.push(current);

  return chunks;
}

const ADDRESS_PATTERN = /^\s*(?:"?([^"<]*)"?\s*)?<?([^<>\s]+@[^<>\s]+)>?\s*$/;

export function parseParticipants(raw?: string): Participant[] {
  if (!raw) return [];

  return splitAddressList(raw)
    .map((chunk): Participant | null => {
      const match = chunk.match(ADDRESS_PATTERN);
      if (!match) return null;

      const [, name, email] = match;
      const trimmedName = name?.trim();
      return { name: trimmedName || undefined, email };
    })
    .filter((p): p is Participant => p !== null);
}

export function formatParticipant(participant: Participant): string {
  return participant.name
    ? `${participant.name} <${participant.email}>`
    : participant.email;
}

export function toParticipant(owner: {
  displayName?: string;
  emailAddress: string;
}): Participant {
  return { name: owner.displayName, email: owner.emailAddress };
}
