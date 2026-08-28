# Monorepo Migration Guide

How this monorepo was built — and how to add new packages to it. Uses `git subtree` to preserve history and npm workspaces to wire packages together.

---

## Concepts

**`git subtree`** splices an external repo's full commit history into a subdirectory of this repo. No submodule pointers, no `.gitmodules`, no detached heads. The history becomes part of this repo's graph and travels with every clone.

**npm workspaces** declare all packages to npm at the root level. npm hoists shared dependencies into one `node_modules/`, symlinks local packages so they resolve each other by name, and lets you run any package's scripts from the root.

Together: each package has its own `package.json`, its own source, and its own scripts — but they share a toolchain, reference each other by name, and carry their full pre-monorepo history.

---

For the concrete setup steps (root workspace, subtree import, dependency wiring, running scripts), see [monorepo-steps.md](monorepo-steps.md).

---

## Isolation Guarantees

Each package is isolated in the following ways:

- **Source**: lives entirely under its own subdirectory in `packages/`
- **Scripts**: `package.json` scripts run with that package's directory as `cwd`
- **Version pinning**: can pin a dep to a version that differs from the root; npm nests it locally
- **Upstream sync**: `git subtree pull/push` can move changes in and out of the originating repo independently

Packages are _not_ isolated in:

- `node_modules/`: hoisted and shared (by design — one install, no duplication)
- Git history: all history lives in one graph (by design — no submodule ceremony)

---

## VSCode Workspaces

A monorepo contains a lot of files. Opening the root in VSCode means the file explorer, search, and go-to-symbol results span every package — which is fine for cross-cutting changes but noisy when you're focused on one area.

VSCode's [multi-root workspace](https://code.visualstudio.com/docs/editor/multi-root-workspaces) feature solves this. A `.code-workspace` file is a JSON document that lists exactly which folders VSCode should show, under whatever display names make sense. Opening it scopes the editor to just those folders.

Workspace files for this repo live at `.vscode/workspaces/`:

```text
.vscode/workspaces/
├── workspace.code-workspace          full repo view
└── maestro-app.code-workspace        app + SDK focused view
```

`maestro-app.code-workspace` is an example of a focused view — it surfaces the root project, the SDK sub-packages, and the test package, and nothing else:

```json
{
  "folders": [
    { "name": "project",       "path": "../../" },
    { "name": "roku-plugins",  "path": "../../packages/roku-plugins" },
    { "name": "@sdk/core",     "path": "../../packages/maestro-sdk/src-sdk/core" },
    { "name": "@sdk/paramount","path": "../../packages/maestro-sdk/src-sdk/paramount" },
    { "name": "@sdk/fox",      "path": "../../packages/maestro-sdk/src-sdk/fox" },
    { "name": "@sdk/test",     "path": "../../packages/maestro-sdk/src-test" }
  ],
  "settings": {
    "brightscript.bsdk": "${workspaceFolder}/node_modules/brighterscript"
  }
}
```

What this buys you:

- **File explorer** shows only the listed packages, in the order and with the names you choose
- **Search** (`Ctrl+Shift+F`) is scoped to those folders — no sifting through unrelated packages
- **Go to symbol / references** stays within the focused surface, so jump-to-definition doesn't land you somewhere unrelated
- **Per-workspace settings** (like `brightscript.bsdk` above) apply to the whole multi-root session without touching user or machine settings

Each team can maintain their own `.code-workspace` file. Add one per logical working context (app-only, SDK-only, plugins, full-repo) and commit them alongside the packages they focus on.

---

## `.gitignore` in Subfolders

Git evaluates `.gitignore` files relative to the directory they live in. Each package can carry its own `.gitignore` alongside its source, and git will respect it without any root-level changes. A `.gitignore` at `packages/maestro-sdk/.gitignore` applies to everything under that subdirectory, exactly as it would in the package's original standalone repo.

This means imported packages keep their ignore rules intact after a `git subtree add` — no merging into a root `.gitignore` needed. The root `.gitignore` only needs to cover things that are genuinely repo-wide (e.g. `node_modules/`, editor folders).

---

## CODEOWNERS per Workspace

`.github/CODEOWNERS` supports glob patterns, so each workspace can have its own reviewers. Patterns are matched in order — last match wins — so put more specific paths after broader ones:

```text
# .github/CODEOWNERS

# Catch-all: platform team reviews everything by default
*                              @yourorg/platform

# Per-workspace overrides
/packages/maestro-app/         @yourorg/app-team
/packages/roku-core/           @yourorg/core-team
/packages/maestro-sdk/         @yourorg/sdk-team
/packages/roku-plugins/        @yourorg/tooling-team

# CI/infra changes always need platform review regardless
/.github/                      @yourorg/platform
```

Teams only see review requests for their workspace. A change touching multiple packages requests reviews from each matching team.

---

## GitHub Workflows per Workspace

### Filter by path

A single workflow can scope itself to one workspace using `paths`:

```yaml
# .github/workflows/sdk.yml
on:
  push:
    paths:
      - 'packages/maestro-sdk/**'
  pull_request:
    paths:
      - 'packages/maestro-sdk/**'
```

The workflow only runs when files under that path change. Other packages' workflows are unaffected.

### CODEOWNERS for workflow files

Workflow files follow the same naming convention as the packages they serve (`sdk*.yml`, `app*.yml`), so CODEOWNERS filename wildcards can map each set of workflows back to the team that owns them:

```text
# .github/CODEOWNERS

# Each team owns the workflow files for their workspace
/.github/workflows/sdk*.yml    @yourorg/sdk-team
/.github/workflows/app*.yml    @yourorg/app-team
/.github/workflows/core*.yml   @yourorg/core-team

# Platform owns everything else in .github/
/.github/                      @yourorg/platform
```

The platform catch-all at the bottom covers shared workflows, action definitions, and any file that doesn't match a package-specific pattern. Because CODEOWNERS uses last-match-wins, put the catch-all after the specific patterns.

### Decompose workflows into reusable actions

Workflows that grow complex can be broken into composite actions. A composite action is just an `action.yml` — it can live anywhere in the repo, including inside the package it serves:

```text
packages/maestro-sdk/.github/
└── actions/
    ├── build/action.yml
    └── test/action.yml
```

Reference it from any workflow using a repo-relative path:

```yaml
# .github/workflows/sdk.yml
jobs:
  build:
    steps:
      - uses: actions/checkout@v4
      - uses: ./.github/actions/build          # root-level action
      - uses: ./packages/maestro-sdk/.github/actions/build   # package-level action
```

This keeps each package's CI logic colocated with its source. The workspace owns both its code and its build steps, and the top-level workflow file becomes a thin orchestrator.

For the "Adding a New Package" steps and per-package migration checklist, see [monorepo-steps.md](monorepo-steps.md).
