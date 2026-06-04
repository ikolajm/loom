/**
 * Generates TypographyView.tsx — static template that imports config at runtime.
 * No config data baked in; reads from @/config/ JSON imports.
 */

function generate() {
  return `import typography from '@/config/base/typography.json';

const SAMPLE = 'The quick brown fox jumps over the lazy dog';

function TypographySample({ family, tier, size, lineHeight }: {
  family: string; tier: string; size: string; lineHeight: string;
}) {
  return (
    <div className="flex flex-col gap-component-compact">
      <p className={\`text-\${family}-\${tier}\`}>{SAMPLE}</p>
      <p className="text-label-sm text-on-surface-variant">
        {family}/{tier} — {size} / {lineHeight}
      </p>
    </div>
  );
}

const tiers = ['sm', 'md', 'lg'] as const;
const families = Object.entries(typography.textStyles) as [string, any][];

export function TypographyView() {
  return (
    <div className="flex flex-col gap-section">
      <div className="flex flex-col gap-component-compact">
        <h2 className="text-display-sm">Typography</h2>
        <p className="text-body-sm text-on-surface-variant">Text style families across sm / md / lg tiers. Styles are applied via generated CSS classes.</p>
      </div>
      <div className="flex flex-col gap-section">
        {families.map(([name, def]) => (
          <div key={name} className="flex flex-col rounded-card border border-outline-subtle">
            <div className="flex flex-col gap-component-compact px-group py-group border-b border-outline-subtle">
              <h3 className="text-title-sm capitalize">{name}</h3>
              <p className="text-label-sm text-on-surface-variant">
                {def.font} · {def.weight}{def['letter-spacing'] !== '0' ? \` · \${def['letter-spacing']}\` : ''}
              </p>
            </div>
            <div className="flex flex-col px-group py-group gap-group">
              {tiers.map((tier) => {
                const t = def[tier];
                if (!t) return null;
                return <TypographySample key={tier} family={name} tier={tier} size={t.size} lineHeight={t['line-height']} />;
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
`;
}

module.exports = { generate };
