# Test harness

Two containers. Neither is part of how a consumer installs Loom — **this containerises the test, not the product.**

A container isolates a runtime. Loom's output is files written into your repository, so containerising the generator itself would mean the atoms land inside the container and have to be copied back out: a layer added, the same trust boundary crossed, nothing gained. What a container is genuinely good for here is guaranteeing the *starting state* of a run, which is the one thing a developer machine cannot promise.

```bash
docker compose -f docker/compose.yml run --rm sweep       # differential token sweep
docker compose -f docker/compose.yml run --rm sweep-keep  # same, keeps output in generated/docker/
docker compose -f docker/compose.yml run --rm install     # end-to-end consumer install
```

## sweep — what it proves

Generates the catalog five times, changing one group of answer keys each time, and compares.

The defect class it exists to catch is invisible to a single generation: **a value that should be a token but is a literal in an atom.** Such a value looks correct in every individual run and reveals itself only by failing to move when the brand moves. `verify.js` structurally cannot find these, because one run has nothing to compare against.

Two assertions, and they are a pair:

- A colour change and a font change must **not** move any file in `catalog/`. An atom that moves is holding a literal.
- `tokens.css` **must** change for both. Without this, an inert generator that emitted a constant catalog would pass the first assertion trivially.

`controlHeight` and `edges` are **reported, not asserted**. Whether either is expected to move atom source or only token values depends on whether the generator emits a role name or a resolved class, and that has not been established on a real run. Encoding a guess as an assertion would make the harness lie in whichever direction the guess was wrong. Establish it, then promote it.

**Why this must run in a container.** `generate-components.js` resolves `CATALOG_DIR` to `<repo>/catalog` regardless of `--output`, so every variant overwrites the tracked catalog. On a developer machine that dirties tracked files; here the checkout is disposable. And `spec/config/local/` is sticky and silently preferred by every generator, so a "defaults" run on a machine that has ever generated a brand is not a defaults run. The root `.dockerignore` excludes both `spec/config/local/` and `spec/answers.json` — that exclusion is what makes the clean room clean, not the container.

## install — what it proves

`create-next-app` → `init.sh` → `setup.sh` → `npm install` → `npm run build`, from an image that has never seen Loom.

**Nothing else in this repo runs `init.sh`.** Every other reference to it is a documentation string or the generator that writes it. `verify.js` checks the generator's *output*; `catalog-playground/` is not installed through `init.sh` at all — it carries its own `package.json` and takes tokens from a predev hook. Until this container, the app-shell install path had only ever been executed by a human, by hand.

The consumer project is created inside the container and dies with it. That is deliberate: a checked-in fixture accumulates precisely what invalidates it — a superseded provider path, a hand-edited atom, a stale `loom-picks.json` — and then passes while a real consumer fails.

`PICKS=all` installs every atom instead of the archetype-seeded set. The default is what a real consumer gets; `all` is the run that would catch an under-declared npm dependency, a bug class this repo has hit before.

```bash
PICKS=all docker compose -f docker/compose.yml run --rm install
```

## What these do not prove

**Neither is hermetic.** The install test reaches the network for `create-next-app` and `npm install`, so an upstream change can turn it red without anything here changing. It is a smoke test, not a reproducibility guarantee.

**Neither catches platform-specific defects, and that limitation is not theoretical.** Both images are Linux, so both see LF line endings. Before [`../.gitattributes`](../.gitattributes) existed, a Windows checkout converted every tracked file to CRLF and broke the two mechanisms that compare bytes — `verify.js`'s `base-config-provenance` check, and the sha256 in every atom manifest that `check-local-edits.js` re-hashes. That defect was found by running on Windows, and these containers would have stayed green throughout it. A green container says the pipeline is correct on Linux and says nothing about the machine you are on.

## Node version

Both images default to `node:22-slim` and accept an override:

```bash
NODE_VERSION=18.18 docker compose -f docker/compose.yml run --rm install
```

The root `package.json` declares `engines.node >= 18.18`. Nothing has ever tested that floor — the override is how, and it is worth running once before the claim is trusted.
