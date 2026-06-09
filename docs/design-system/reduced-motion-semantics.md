# Reduced-motion is per-atom semantic, not a blanket rule

`prefers-reduced-motion` is not a global switch you flip on every animated atom. Whether an atom honors it — and how — depends on **what kind of motion the atom is**. Treating it as a blanket "suppress all animation" rule breaks the atoms where the motion *is* the function.

The dividing line is who drives the motion.

## Autonomous vs. direct-manipulation

| Kind | The motion is… | `prefers-reduced-motion` | Loom atoms |
|------|----------------|--------------------------|------------|
| **Autonomous** | Animation the user did *not* trigger — it plays on its own | **Honor it** — suppress or snap to the end state | `reveal`, `stagger`, `count-up`, (marquee) |
| **Direct-manipulation** | The user is driving it; the motion reflects their own action back | **Do NOT honor it** — suppressing it breaks the feedback | `scroll-progress` |

For autonomous motion, the animation is decoration or delight — a user who asked for less motion wants it gone, and the end state (revealed element, final number) is what matters. For direct-manipulation motion, the movement is the user's own input rendered visible: a scroll-progress bar that froze to respect reduced-motion would just be broken. You can't "reduce" the motion of a thing the user is actively moving without removing the thing.

## Implementation also varies per atom

Honoring reduced-motion isn't one mechanism either — match it to how the atom animates:

- **`reveal`** → pure-CSS. The reduced-motion branch is a CSS media query that lands the element in its final state with no transition. No JS involved.
- **`count-up`** → JS, via `matchMedia('(prefers-reduced-motion: reduce)')`. The rAF loop is skipped and the final value is set immediately, because the animation is JS-driven and CSS can't intercept it.
- **`scroll-progress`** → deliberately omits any reduced-motion handling. Documented as intentional, not an oversight — it's direct-manipulation.

## The rule

When building a motion atom, ask **"did the user trigger this, or is it playing on its own?"** before reaching for `prefers-reduced-motion`:

- Autonomous → honor it; pick the mechanism (CSS media query for CSS transitions, `matchMedia` for rAF/JS).
- Direct-manipulation → do not honor it, and leave a comment saying so, or a future reader will "fix" the missing handler and break the atom.

## Related

- [tokens-as-tailwind-utilities.md](tokens-as-tailwind-utilities.md) — the easing/spring tokens these atoms consume
- [pipeline-architecture.md](pipeline-architecture.md) — where motion atoms sit in the catalog
