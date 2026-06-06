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
const themeToggle = require('./theme-toggle');
const layout = require('./layout');
const designSystemPage = require('./design-system-page');
const setupScript = require('./setup-script');
const colorsView = require('./colors-view');
const typographyView = require('./typography-view');

function generate(configs, registry, outputDir) {
  const scaffoldDir = path.join(outputDir, 'scaffold');
  fs.mkdirSync(scaffoldDir, { recursive: true });

  const files = [
    { name: 'globals.css', content: globalsCss.generate(configs) },
    { name: 'ThemeProvider.tsx', content: themeProvider.generate(configs) },
    { name: 'ThemeToggle.tsx', content: themeToggle.generate() },
    { name: 'layout.tsx', content: layout.generate(configs) },
    { name: 'design-system-page.tsx', content: designSystemPage.generate(configs, registry) },
    { name: 'init.sh', content: setupScript.generate(), executable: true },
    { name: 'ColorsView.tsx', content: colorsView.generate() },
    { name: 'TypographyView.tsx', content: typographyView.generate() },
  ];

  for (const file of files) {
    const filePath = path.join(scaffoldDir, file.name);
    fs.writeFileSync(filePath, file.content, file.executable ? { mode: 0o755 } : {});
    console.log(`  scaffold/${file.name}`);
  }
}

module.exports = { generate };
