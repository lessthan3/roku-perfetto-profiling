**For how this structure was built and how to apply it to other projects, see [monorepo-steps.md](monorepo-steps.md), and [monorepo-concepts.md](monorepo-concepts.md)**

---

# maestro-roku — Monorepo

This repo uses npm workspaces to manage the Roku app, the Maestro SDK, and the shared BrighterScript plugins as a single monorepo. All packages share one `node_modules/` at the root, reference each other by package name, and are built from a common toolchain.

If you're coming from one of the individual repos, the structure will feel familiar — your package is in the same shape it was, just living under `packages/` alongside the others.

## Getting Started

```bash
npm install   # installs and links all packages from the repo root
```

That's it. npm hoists everything into a shared `node_modules/` and symlinks all local packages so they resolve each other by name.

---

## Package Structure

Packages are organized under `packages/` and grouped by scope:

```text
.github/                                        (planned)
├── CODEOWNERS                                  per-workspace reviewer assignments
└── workflows/
    ├── app*.yml                                @roku/app-team
    ├── sdk*.yml                                @yourorg/sdk-team
    └── core*.yml                               @yourorg/core-team

.vscode/workspaces/                             VSCode multi-root workspace files
├── workspace.code-workspace                    full repo view
└── maestro-app.code-workspace                  app + SDK focused view

packages/
├── maestro-app/              @roku/app
│   └── .github/actions/      (planned)         colocated CI actions
├── roku-core/                @roku/core
│   └── .github/actions/      (planned)
├── maestro-sdk/              @roku/sdk
│   ├── bin/                  @sdk/bin
│   ├── src-sdk/core/         @sdk/core
│   ├── src-sdk/espn/         @sdk/espn
│   ├── src-sdk/fox/          @sdk/fox
│   ├── src-sdk/paramount/    @sdk/paramount
│   ├── src-test/             @sdk/test
│   └── .github/actions/                        colocated SDK release actions
└── roku-plugins/
    ├── bsc-core/             @roku/bsc-core
    ├── bsc-extends/          @roku/bsc-extends
    ├── bsc-npm/              @roku/bsc-npm
    ├── bsc-ropm/             @roku/bsc-ropm
    └── bsc-tdd/              @roku/bsc-tdd
```

All packages — including the nested `@sdk/*` ones — are registered in the root workspace and hoisted together. Any package can declare another as a dependency using its package name and npm resolves it locally, no path aliases needed.

---

## Running Commands

The root `package.json` defines a short alias for each workspace. Each alias is an open-ended selector — you append `-- <script>` to run any script in that workspace without having to `cd` anywhere:

| Command                   | Runs                         |
| ------------------------- | ---------------------------- |
| `npm run app build`       | `build` in `@roku/app`       |
| `npm run app dev`         | `dev` in `@roku/app`         |
| `npm run sdk dev`         | `dev` in `@roku/sdk`         |
| `npm run roku/core build` | `build` in `@roku/core`      |
| `npm run @all typecheck`  | `typecheck` in every package |
| `npm test --workspaces`   | `test` in every package      |

The `--` separator is standard npm behavior — everything after it is passed as arguments to the underlying command. So `npm run app build` becomes `npm run -w=@roku/app build`.

To run a script directly in a specific workspace without the root alias:

```bash
npm run -w=@roku/app build
npm run -w=@sdk/fox dev
```

---

## Bin Scripts

`@sdk/bin` is a workspace package whose sole job is exposing named bin scripts. Because npm links all workspace `bin` entries into the root `node_modules/.bin/`, those scripts are available via `npx` from anywhere in the repo without installing anything extra or knowing their path:

```bash
npx sdk-build      # runs packages/maestro-sdk/bin/buildTestSdk.py
npx sdk-package    # runs packages/maestro-sdk/bin/packageSDK.py
npx sdk-proxy      # runs packages/maestro-sdk/bin/setDeviceProxy.py
```

The names come from the `bin` field in `packages/maestro-sdk/bin/package.json`. Adding a new script is just adding an entry there — no root config changes needed.

---

## Cross-Package Dependencies

To declare a dependency on another package in this repo, reference it by name with `"*"` as the version — npm resolves it to the local workspace copy:

```json
{
  "dependencies": {
    "@roku/core": "*",
    "@roku/bsc-extends": "*"
  }
}
```

No path hacks, no manual symlinking. After `npm install`, the package is available in `node_modules/` like any other dependency.

---

## Git History

Each package was brought into the monorepo using `git subtree`, which splices a repository's full commit history into a subdirectory. If you see merge commits in the log like:

```text
Add 'packages/maestro-sdk/' from commit 'abc1234'
```

that's the subtree import. All history before that point is still present — `git log packages/maestro-sdk/` will show it.

---

## Branch Status

The monorepo lives on the `monorepo` branch, which runs in parallel with `main`. Teams on `main` are unaffected until the cutover happens.

### Which branch should I use?

- Working on the Roku app or SDK today → use `main` as you normally would
- Onboarding into the monorepo structure → use `monorepo`

### Cutover

When the team is ready to switch, DevOps will rename the branches on GitHub (`main` → `main-legacy`, `monorepo` → `main`). At that point, contributors refresh their local checkout:

```bash
git fetch --prune

git checkout develop        # move off main first
git branch -D main          # drop the stale local branch
git checkout main           # pulls the new main from origin
```

`main-legacy` stays accessible after cutover for any in-flight work that was branched off the old `main`.
