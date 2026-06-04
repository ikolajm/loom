/**
 * Generates ColorsView.tsx — static template that imports config at runtime.
 * No config data baked in; reads from @/config/ JSON imports.
 */

function generate() {
  return `import colors from '@/config/base/colors.json';
import standards from '@/config/standards.json';

function ColorSwatch({ token }: { token: string }) {
  return (
    <div className="flex flex-col gap-component-compact">
      <div className="h-12 rounded-component border border-outline-subtle" style={{ backgroundColor: \`var(--\${token})\` }} />
      <span className="text-label-sm text-on-surface-variant">{token}</span>
    </div>
  );
}

function PaletteSwatch({ shade, hex, light }: { shade: string; hex: string; light: boolean }) {
  return (
    <div
      className={\`flex flex-col items-center justify-end h-12 rounded-component px-1 pb-1 \${light ? 'text-neutral-900' : 'text-white'}\`}
      style={{ backgroundColor: hex }}
    >
      <span className="text-label-sm">{shade}</span>
    </div>
  );
}

function isLightShade(family: string, shade: string): boolean {
  const n = parseInt(shade);
  if (family === 'neutral') return n > 30;
  return n < 500;
}

const defaultMode = (standards as any).colors['default-mode'] as 'light' | 'dark';
const roleGroups = Object.entries((colors.roles as any)[defaultMode] as Record<string, Record<string, string>>);
const paletteGroups = Object.entries(colors.palette);

export function ColorsView() {
  return (
    <div className="flex flex-col gap-section">
      <div className="flex flex-col gap-component-compact">
        <h2 className="text-display-sm">Colors</h2>
        <p className="text-body-sm text-on-surface-variant">Semantic color roles for the current theme. Toggle the theme to see alternate values.</p>
      </div>

      <div className="flex flex-col gap-section">
        <div className="flex flex-col gap-group">
          <h3 className="text-title-md">Semantic Roles</h3>
          <div className="flex flex-col gap-group">
            {roleGroups.map(([group, roles]) => (
              <div key={group} className="flex flex-col gap-group">
                <h3 className="text-title-sm capitalize">{group}</h3>
                <div className="grid grid-cols-4 gap-component">
                  {Object.keys(roles).map((role) => (
                    <ColorSwatch key={role} token={role} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-group">
          <h3 className="text-title-md">Base Palette</h3>
          <div className="flex flex-col gap-group">
            {paletteGroups.map(([family, shades]) => (
              <div key={family} className="flex flex-col gap-component-compact">
                <h3 className="text-label-md capitalize text-on-surface-variant">{family}</h3>
                <div className="grid grid-cols-5 gap-1 sm:grid-cols-10">
                  {Object.entries(shades).map(([shade, hex]) => (
                    <PaletteSwatch key={shade} shade={shade} hex={hex as string} light={isLightShade(family, shade)} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
`;
}

module.exports = { generate };
