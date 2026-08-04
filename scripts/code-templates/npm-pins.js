/**
 * Version pins for packages a consumer installs.
 *
 * Two surfaces tell a consumer what to install — init.sh's core-dep line (scaffold/
 * setup-script.js) and setup.sh's printed line (derived from manifest npmDependencies).
 * They were independent lists and disagreed on tailwind-merge; this is the one home.
 *
 * Only packages whose wrong version fails SILENTLY belong here. A package that errors
 * on the wrong version is self-reporting and does not need a pin — npm resolving to a
 * good default is fine when a bad default is loud.
 */

// tailwind-merge: the generated cn() registers Loom's token scales through v3's `theme`
// keys (radius/spacing). v2 ignores them without erroring — className overrides silently
// stop applying and atoms just render wrong. A hard minimum, not a preference.
const NPM_PINS = {
  'tailwind-merge': '^3',
};

// Bare package names → install specifiers, pins applied. Sorts on the package name so
// the pin suffix can't reorder the list.
function applyPins(names) {
  return [...names]
    .sort()
    .map((name) => (NPM_PINS[name] ? `${name}@${NPM_PINS[name]}` : name));
}

module.exports = { NPM_PINS, applyPins };
