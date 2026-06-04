#!/usr/bin/env node
/**
 * Figma Icons Orchestrator
 *
 * Assembles the icon generation script with embedded SVG data.
 * Icons are Lucide icons (lucide.dev), stroke-based, 24×24 viewBox scaled to 16×16.
 */
const fs = require('fs');
const path = require('path');

// Icon definitions: name + inner SVG elements
const ICONS = [
  { name: "placeholder", svg: '<rect x="3" y="3" width="18" height="18" rx="2" stroke-dasharray="4 2" />' },
  { name: "arrow-up", svg: '<path d="m5 12 7-7 7 7" /><path d="M12 19V5" />' },
  { name: "arrow-down", svg: '<path d="M12 5v14" /><path d="m19 12-7 7-7-7" />' },
  { name: "arrow-right", svg: '<path d="M5 12h14" /><path d="m12 5 7 7-7 7" />' },
  { name: "chevron-down", svg: '<path d="m6 9 6 6 6-6" />' },
  { name: "chevron-left", svg: '<path d="m15 18-6-6 6-6" />' },
  { name: "chevron-right", svg: '<path d="m9 18 6-6-6-6" />' },
  { name: "calendar", svg: '<path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" />' },
  { name: "mouse-pointer-click", svg: '<path d="M14 4.1 12 6" /><path d="m5.1 8-2.9-.8" /><path d="m6 12-1.9 2" /><path d="M7.2 2.2 8 5.1" /><path d="M9.037 9.69a.498.498 0 0 1 .653-.653l11 4.5a.5.5 0 0 1-.074.949l-4.349 1.041a1 1 0 0 0-.74.739l-1.04 4.35a.5.5 0 0 1-.95.074z" />' },
  { name: "x", svg: '<path d="M18 6 6 18" /><path d="m6 6 12 12" />' },
  { name: "check", svg: '<path d="M20 6 9 17l-5-5" />' },
  { name: "circle", svg: '<circle cx="12" cy="12" r="10" />' },
  { name: "search", svg: '<path d="m21 21-4.34-4.34" /><circle cx="11" cy="11" r="8" />' },
  { name: "eye", svg: '<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" /><circle cx="12" cy="12" r="3" />' },
  { name: "eye-off", svg: '<path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" /><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" /><path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" /><path d="m2 2 20 20" />' },
  { name: "alert-triangle", svg: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" /><path d="M12 9v4" /><path d="M12 17h.01" />' },
  { name: "info", svg: '<circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />' },
  { name: "check-circle", svg: '<path d="M21.801 10A10 10 0 1 1 17 3.335" /><path d="m9 11 3 3L22 4" />' },
  { name: "x-circle", svg: '<circle cx="12" cy="12" r="10" /><path d="m15 9-6 6" /><path d="m9 9 6 6" />' },
  { name: "plus", svg: '<path d="M5 12h14" /><path d="M12 5v14" />' },
  { name: "loader", svg: '<path d="M12 2v4" /><path d="m16.2 7.8 2.9-2.9" /><path d="M18 12h4" /><path d="m16.2 16.2 2.9 2.9" /><path d="M12 18v4" /><path d="m4.9 19.1 2.9-2.9" /><path d="M2 12h4" /><path d="m4.9 4.9 2.9 2.9" />' }
];

function assembleScript() {
  const templatePath = path.join(__dirname, 'icons.js');
  const template = fs.readFileSync(templatePath, 'utf-8');
  return `const CONFIG = ${JSON.stringify(ICONS)};\n${template}`;
}

if (require.main === module) {
  const script = assembleScript();
  console.log(script);
}

module.exports = { assembleScript, ICONS };
