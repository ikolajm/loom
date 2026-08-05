/**
 * Scaffold generator — orchestrates individual scaffold modules.
 * Writes: scaffold/ directory in generated/ output.
 *
 * Each module is a standalone generator with a generate() function.
 * This index wires them together and writes output.
 */
const fs = require('fs');
const path = require('path');

const globalsCss = require('./globals-css');
const themeProvider = require('./theme-provider');
const layout = require('./layout');
const setupScript = require('./setup-script');

// preview-page.tsx is a static asset (no config interpolation) — copied verbatim
// into generated/scaffold/, then placed at src/app/preview/page.tsx by init.sh.
const previewPage = fs.readFileSync(path.join(__dirname, 'preview-page.tsx'), 'utf8');

// `picks` is the archetype's curated atom list when the answers file named a
// productType, and null otherwise — see the orchestrator, which owns that resolution
// because `configs` (loadAllConfigs) carries token data, not answers.
function generate(configs, outputDir, picks = null) {
  const scaffoldDir = path.join(outputDir, 'scaffold');
  fs.mkdirSync(scaffoldDir, { recursive: true });

  const files = [
    { name: 'globals.css', content: globalsCss.generate(configs) },
    { name: 'ThemeProvider.tsx', content: themeProvider.generate(configs) },
    { name: 'layout.tsx', content: layout.generate(configs) },
    { name: 'preview-page.tsx', content: previewPage },
    { name: 'init.sh', content: setupScript.generate(picks), executable: true },
  ];

  for (const file of files) {
    const filePath = path.join(scaffoldDir, file.name);
    fs.writeFileSync(filePath, file.content, file.executable ? { mode: 0o755 } : {});
    console.log(`  scaffold/${file.name}`);
  }
}

module.exports = { generate };
