/**
 * @fileoverview JSON Markdown Stripper Utility — DocuCloud AI
 *
 * LLMs frequently wrap JSON output in markdown code fences even when
 * instructed not to. This utility strips those fences before parsing.
 *
 * @module api/_utils/strip-json
 */

/**
 * Removes markdown code fences from an LLM text response and trims whitespace.
 *
 * Handles these common LLM output patterns:
 *   - ```json\n{...}\n```
 *   - ```\n{...}\n```
 *   - Raw JSON with no fences (returned unchanged)
 *
 * @param {string} text - Raw text response from the LLM.
 * @returns {string} Clean JSON string ready to be passed to JSON.parse().
 *
 * @example
 * stripMarkdownJson('```json\n{"vendor":"Test"}\n```') // '{"vendor":"Test"}'
 * stripMarkdownJson('{"vendor":"Test"}')               // '{"vendor":"Test"}'
 */
export function stripMarkdownJson(text) {
  if (typeof text !== 'string') {
    throw new TypeError(`stripMarkdownJson expected a string, got ${typeof text}`);
  }

  // Remove ```json ... ``` or ``` ... ``` wrappers (non-greedy, handles newlines)
  const fencePattern = /^```(?:json)?\s*\n?([\s\S]*?)\n?```\s*$/;
  const match = text.trim().match(fencePattern);

  return match ? match[1].trim() : text.trim();
}
