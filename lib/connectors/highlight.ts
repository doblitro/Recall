export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Builds a regex matching any individual whitespace-separated term in `keyword`,
// since Gmail's search ANDs terms that don't need to be adjacent in the text.
export function buildKeywordRegex(keyword: string, flags: string) {
  const terms = keyword
    .split(/\s+/)
    .filter(Boolean)
    .map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

  if (terms.length === 0) return null;
  return new RegExp(`(${terms.join("|")})`, flags);
}

export const highlightKeywordInResult = (
  result: string | undefined,
  keyword: string,
) => {
  if (!result) return result;

  const escaped = escapeHtml(result);
  const regex = buildKeywordRegex(keyword, "gi");
  if (!regex) return escaped;

  return escaped.replace(regex, (match) => `<mark>${match}</mark>`);
};
