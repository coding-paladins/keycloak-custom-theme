/**
 * Complete English fallback translations for account theme i18n bootstrap.
 * Used when the current locale has missing keys so i18next can fall back to English.
 * Parsed from messages_en.properties at build time.
 */
import messagesEnRaw from "./i18n/messages_en.properties?raw";

function parseProperties(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trimEnd();
    if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("!")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex < 0) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed
      .slice(eqIndex + 1)
      .replace(/\\:/g, ":")
      .replace(/\\\\/g, "\\")
      .trim();
    if (key) result[key] = value;
  }
  return result;
}

export const accountEnFallbacks: Record<string, string> = parseProperties(messagesEnRaw);
