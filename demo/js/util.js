/**
 * Shared utility functions for the online plant editor.
 *
 * @author Sam Pottinger
 * @license MIT License
 */

/**
 * Escape an input string so that it is safely rendered to HTML.
 *
 * Thanks https://stackoverflow.com/questions/6234773/can-i-escape-html-special-chars-in-javascript
 *
 * @param unsafe Input string to escape.
 * @return Escaped string.
 */
function escapeHtml(unsafe) {
  return unsafe.replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
