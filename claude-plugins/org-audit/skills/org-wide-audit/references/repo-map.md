# Repo Map

Everything under `projects/` in the `dev-tools` repo. `.gitmodules` is authoritative — this map is orientation, and goes stale as repos are added. Verify a repo's stack by looking at it, not by trusting the row below.

## SDKs — the implementations

The core of most audits. The same product feature usually exists once per platform here, which is exactly where divergence lives.

| Repo | Platform | Stack |
| --- | --- | --- |
| `maestro-roku-sdk` | Roku | BrightScript / BrighterScript, npm toolchain |
| `maestro-roku-app-sdk` | Roku (app layer) | BrightScript / BrighterScript, npm toolchain |
| `maestro-android-sdk` | Android / TV | Kotlin, Gradle, multi-module |
| `maestro-swift-sdk` | iOS / tvOS | Swift |
| `maestro-swift-sdk-kmp` | iOS / tvOS | Kotlin Multiplatform under `MaestroKMP/` |
| `maestro-web-sdk` | Web | TypeScript, npm workspaces under `packages/` |
| `app-builder-kmp` | Shared | Kotlin Multiplatform |
| `roku-shared-tools` | Roku | Shared BrighterScript tooling, consumed by the Roku repos |

## Examples — the consumption surface

Thin apps wiring an SDK up. They answer "what does integration look like" and "which API surface is public", not "how does it work". A feature missing here means it is not *demonstrated*, which is not the same as not implemented.

`maestro-android-sdk-example`, `maestro-roku-sdk-example`, `maestro-tvos-sdk-example` (Xcode), `maestro-bbd-sdk-example`

## Platform and services — the other side of the wire

For audits about contracts: event schemas, config payloads, API shapes. When SDKs disagree about a field, this is where the answer to "which one is right" lives.

`maestro-platform`, `maestro-web`, `node-services`, `maestro-mcp`

## Testing and fixtures

`maestrokit-crossplatform-testing` — cross-platform test suite, TypeScript, `packages/` + `platforms/`. Its platform adapters are a fast way to see how a behavior is expected to present on each target.

`sdk-testdata` — shared fixtures, split `core/ espn/ fox/ paramount/`. The tenant split is a useful signal in itself: a feature that only exists under one tenant directory is tenant-specific.

## Searching per ecosystem

Match the platform's vocabulary, not the one from the repo you looked at first. The same concept is spelled differently on each target, and a term that works in one repo routinely scores zero in another for reasons that have nothing to do with the feature being absent.

| Ecosystem | Globs | Notes |
| --- | --- | --- |
| BrightScript | `--include=*.bs --include=*.brs --include=*.xml` | **Always `-i`** - the language is case-insensitive, so casing carries no meaning and a case-sensitive grep produces false absences. `sub`/`function` declarations; components are XML + code pairs. Exclude `dist/`, `out/`. |
| Kotlin | `--include=*.kt --include=*.kts` | Gradle modules are top-level dirs; `build.gradle.kts` shows the real module graph. Exclude `build/`, `.gradle/`. |
| Swift | `--include=*.swift` | Exclude `.build/`, `Pods/`, `DerivedData/`. |
| TypeScript | `--include=*.ts --include=*.tsx` | Exclude `node_modules/`, `dist/`, `build/`, `*.d.ts` when hunting implementations. |
| Config / schema | `--include=*.json --include=*.yml --include=*.yaml --include=manifest` | Where cross-platform contracts and feature flags surface. |

A blanket exclude for a full sweep:

```bash
# hits with context
grep -rni "<term>" projects/ --exclude-dir={node_modules,dist,build,out,.build,Pods,DerivedData,.gradle,vendor,.git}

# distribution across repos - drop the :0 lines or the hits are buried
grep -rci "<term>" projects/ --exclude-dir={node_modules,dist,build,out,.build,Pods,DerivedData,.gradle,vendor,.git} | grep -v ':0$'
```

Write the brace list inline, exactly as above. It is brace expansion, so it only works in the Bash tool - and it only works *inline*. Hoisting it into a variable (`EXCL=--exclude-dir={a,b}` then `$EXCL`) is silently broken: brace expansion runs before parameter expansion, so grep receives one literal `{a,b}` pattern, excludes nothing, and reports no error. Verified against this repo - the variable form returned every vendored hit the inline form correctly dropped.

Two things worth checking before concluding anything about a repo:

- **`CLAUDE.md` / `CONTEXT.md` / `docs/`** — several repos carry them. Good for orientation and vocabulary; they state intent, so never let one stand as evidence of behavior.
- **`.github/workflows/`** — reveals what actually gets built, tested, and released, which is often the fastest way to find the real entry points in an unfamiliar repo.
