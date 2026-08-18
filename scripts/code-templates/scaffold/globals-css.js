/**
 * Generates globals.css for the downstream project.
 * Imports Tailwind + the three token files, sets base body styles, scrollbar, selection.
 *
 * Import order is load-bearing. tokens.css defines the custom properties; loom.css reads
 * them; loom.tailwind.css maps them onto Tailwind utilities. Drop loom.tailwind.css and
 * every token-derived utility class stops resolving — silently, since an unknown utility
 * is not an error.
 */

function generate(configs) {
  return `@import "tailwindcss";
@import "../tokens.css";
@import "../loom.css";
@import "../loom.tailwind.css";

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
