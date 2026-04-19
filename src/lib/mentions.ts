/**
 * Knect @Mention Parser
 * Extracts @mentions from post/comment text
 */

/**
 * Parse all @mentions from text
 * Returns unique, lowercased handles (without the @ symbol)
 */
export function parseMentions(text: string): string[] {
  const matches = text.match(/@(\w+)/g);
  if (!matches) return [];
  return [...new Set(matches.map((m) => m.slice(1).toLowerCase()))];
}
