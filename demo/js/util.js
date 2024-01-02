/**
 * Shared utility functions for the online plant editor.
 *
 * @author Sam Pottinger
 * @license MIT License
 */

/**
 * Escape an input string so that it is safely rendered to HTML.
 *
 * Thanks https://github.com/ajaxorg/ace/blob/6857f20eb3df9cb7f0eddd9547e0ae8b653e86af/src/lib/lang.js#L87
 *
 * @param unsafe Input string to escape.
 * @return Escaped string.
 */
function escapeHtml(unsafe) {
  return ("" + str).replace(/&/g, "&#38;").replace(/"/g, "&#34;").replace(/'/g, "&#39;").replace(/</g, "&#60;");
}
