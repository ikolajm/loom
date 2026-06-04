/**
 * Generates globals.css for the downstream project.
 * Imports Tailwind + tokens, sets base body styles, scrollbar, selection.
 */

function generate(configs) {
  return `@import "tailwindcss";
@import "../tokens.css";

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
