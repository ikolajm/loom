/**
 * Generates globals.css for the downstream project.
 * Imports the three stylesheets, sets base body styles, scrollbar, selection.
 *
 * Import order is load-bearing, and not only for readability. tokens.css declares the
 * cascade-layer order and the custom properties; loom.css reads them; loom.components.css
 * composes them. A minifier drops the @layer statement as redundant, after which
 * precedence falls back to first appearance — so this order is the mechanism, not a note.
 */

function generate(configs) {
  return `@import "../main.css";

body {
  background: var(--surface);
  color: var(--on-surface);
  font-family: var(--font-body);
}

::selection {
  background: var(--primary-container);
  color: var(--on-primary-container);
}

::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: var(--on-surface-variant);
  border-radius: var(--br-999);
}
::-webkit-scrollbar-thumb:hover {
  background: var(--on-surface);
}
`;
}

module.exports = { generate };
