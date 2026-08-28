# Monorepo Setup — Step by Step

Concrete steps for setting up the root workspace and importing packages. See [monorepo-concepts.md](monorepo-concepts.md) for concepts and per-package configuration guidance.

---

## Step 1 — Root Workspace Setup

If starting from scratch (this is already done in this repo):

**`package.json`** at the root:

```json
{
  "name": "maestro-roku-monorepo",
  "private": true,
  "workspaces": [
    "packages/*",
    "packages/maestro-sdk/src-sdk/*",
    "packages/maestro-sdk/src-test"
  ],
  "scripts": {
    "app": "npm run -w=@roku/app",
    "sdk": "npm run -w=@roku/sdk",
    "roku/core": "npm run -w=@roku/core",
    "@all": "npm run --workspaces"
  }
}
```

Glob patterns under `workspaces` tell npm which directories contain packages. Each matched directory must have a `package.json` with a `name` field. Nesting is fine — `packages/maestro-sdk/src-sdk/*` registers each sub-SDK as its own workspace.

---

## Step 2 — Import a Repo with `git subtree`

For each external repo you want to absorb:

```bash
# Add the remote (one-time per source repo)
git remote add sdk-remote git@github.com:yourorg/maestro-sdk.git

# Pull the repo's history into a subdirectory
git subtree add --prefix=packages/maestro-sdk sdk-remote main --squash
```

`--squash` collapses the imported history into one merge commit so your log stays readable. Drop `--squash` to splice every commit in verbatim (slower, but `git log packages/maestro-sdk/` shows full blame history either way once merged).

The subtree add produces a merge commit like:

```text
Add 'packages/maestro-sdk/' from commit 'f04de86'
```

That's the marker in `git log`. The package's history before that point is still present.

### Pulling upstream changes later

```bash
git subtree pull --prefix=packages/maestro-sdk sdk-remote main --squash
```

---

## Step 3 — Configure Each Package

Each imported package needs its `package.json` `name` to match the workspace scope you plan to use:

```json
{
  "name": "@roku/sdk",
  "version": "0.0.0",
  "private": true
}
```

If the package previously had its own `node_modules/` checked in or a lockfile, remove them — the root handles all of that now.

---

## Step 4 — Wire Cross-Package Dependencies

For any package that depends on another package in this repo, declare it with `"*"` as the version:

```json
{
  "name": "@roku/app",
  "dependencies": {
    "@roku/core": "*",
    "@roku/sdk": "*"
  }
}
```

After `npm install` from the root, npm symlinks `node_modules/@roku/core` → `packages/roku-core` and `node_modules/@roku/sdk` → `packages/maestro-sdk`. Imports resolve by package name with no path hacks.

---

## Step 5 — Hoist Shared Dev Dependencies

Move shared toolchain dependencies (TypeScript, BrighterScript, linters, test runners) to the root `package.json`. Per-package `devDependencies` should only contain what's genuinely specific to that package.

Root `package.json`:

```json
{
  "devDependencies": {
    "typescript": "^5.0.0",
    "brighterscript": "^0.68.0"
  }
}
```

npm hoists these into the root `node_modules/` and all workspaces see them. If a package needs a different version of a shared tool, declare it locally — npm will nest it under that package's own `node_modules/` and use it only there.

---

## Step 6 — Run from the Root

The root `package.json` scripts are open-ended workspace selectors. Each one forwards to a named workspace, and you append `-- <script>` to choose which script to run:

```bash
npm install                    # link everything, install all deps

npm run app build           # build @roku/app
npm run sdk dev             # dev @roku/sdk
npm run @all typecheck      # typecheck every package
npm test --workspaces          # test every package
```

Direct workspace invocation also works:

```bash
npm run -w=@roku/app build
npm run -w=@sdk/fox dev
```

---

## Adding a New Package

1. If it comes from an existing repo: `git subtree add --prefix=packages/<name> <remote> main --squash`
2. If it's new: `mkdir packages/<name> && echo '{"name":"@scope/name","version":"0.0.0","private":true}' > packages/<name>/package.json`
3. Add the path glob to root `workspaces` if not already covered
4. Add a root script alias if you want a short `npm run <alias>` for it
5. `npm install` from the root to link it in

---

## Checklist for Each Migrated Package

- [ ] `package.json` has the correct `name` matching the workspace scope
- [ ] Cross-repo dependencies use `"*"` versions
- [ ] Per-package `node_modules/` removed
- [ ] Per-package lockfile removed
- [ ] Shared dev tools removed from per-package `devDependencies` (or left if version-pinned)
- [ ] Root `workspaces` glob covers this package's directory
- [ ] Root script alias added (optional but convenient)
- [ ] Package-level `.gitignore` present if needed
- [ ] `.github/CODEOWNERS` entry added for this package's path
- [ ] Workflow added under `.github/workflows/` with a `paths` filter for this package
- [ ] Package CI logic extracted to `packages/<name>/.github/actions/` if non-trivial
