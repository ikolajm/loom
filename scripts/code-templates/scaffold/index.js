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

// preview-page.tsx is generated: its ramps, roles, type list, spacing steps and radius
// names come from the configs, so the page cannot list a token set the build does not
// have. It used to be a static asset, which meant every token added to the system was a
// token the verification page silently stopped covering.

function generate(configs, outputDir) {
  const scaffoldDir = path.join(outputDir, 'scaffold');
  fs.mkdirSync(scaffoldDir, { recursive: true });

  const files = [
    { name: 'globals.css', content: globalsCss.generate(configs) },
    { name: 'ThemeProvider.tsx', content: themeProvider.generate(configs) },
    { name: 'layout.tsx', content: layout.generate(configs) },
    { name: 'preview-page.tsx', content: require('../generate-preview').generate() },
    { name: 'init.sh', content: setupScript.generate(), executable: true },
  ];

  for (const file of files) {
    const filePath = path.join(scaffoldDir, file.name);
    fs.writeFileSync(filePath, file.content, file.executable ? { mode: 0o755 } : {});
    console.log(`  scaffold/${file.name}`);
  }
}

module.exports = { generate };
