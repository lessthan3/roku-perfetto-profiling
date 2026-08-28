# Projects

Every repo Maestro development touches, checked out as a git submodule. All submodules point at the [`lessthan3`](https://github.com/lessthan3) org and are registered shallow.

Grouped by the role a repo plays, which is what decides who consumes it and what breaks when it changes.

## Client SDKs

The shipped, client-facing SDKs — one per platform. These are the products; everything else exists to build, test, or serve them. Each is modularised per client (ESPN, FOX, Paramount) on top of a shared core.

| Repo | Platform | Notes |
| --- | --- | --- |
| [maestro-android-sdk](https://github.com/lessthan3/maestro-android-sdk) | Android TV / Fire TV | Kotlin Multiplatform; also emits the tvOS/iOS and JS targets |
| [maestro-swift-sdk-kmp](https://github.com/lessthan3/maestro-swift-sdk-kmp) | tvOS / iOS | Swift SDK backed by KMP; wraps the generated xcframeworks |
| [maestro-swift-sdk](https://github.com/lessthan3/maestro-swift-sdk) | tvOS / iOS | Predecessor to the KMP-backed Swift SDK |
| [maestro-roku-sdk](https://github.com/lessthan3/maestro-roku-sdk) | Roku | BrightScript; core SDK plus tooling and client overrides |
| [maestro-roku-app-sdk](https://github.com/lessthan3/maestro-roku-app-sdk) | Roku | App-level Roku SDK, sideloaded to a device in dev mode |
| [maestro-web-sdk](https://github.com/lessthan3/maestro-web-sdk) | Web / BBD | Yarn monorepo — `packages/sdk` plus a Preact test app |

## Server

Backend services and the web platform the SDKs talk to.

| Repo | What it is |
| --- | --- |
| [maestro-platform](https://github.com/lessthan3/maestro-platform) | Core platform |
| [maestro-web](https://github.com/lessthan3/maestro-web) | Web front end |
| [node-services](https://github.com/lessthan3/node-services) | Node backend services |

## Shared

Consumed by more than one repo above. A change here can ripple across platforms, so these are the ones to check first when something breaks in several places at once.

| Repo | What it is |
| --- | --- |
| [sdk-testdata](https://github.com/lessthan3/sdk-testdata) | Test fixtures shared by every SDK — `core/`, plus `espn/`, `fox/`, `paramount/`. Mirrors the crossplatform-testing GCS bucket; check out as a submodule to pin fixtures or work offline |
| [roku-shared-tools](https://github.com/lessthan3/roku-shared-tools) | Tooling shared across the Roku repos |
| [app-builder-kmp](https://github.com/lessthan3/app-builder-kmp) | KMP-powered app-builder rewrites |

## Testing

| Repo | What it is |
| --- | --- |
| [maestrokit-crossplatform-testing](https://github.com/lessthan3/maestrokit-crossplatform-testing) | QA automation across Web, Roku, Android TV / Fire TV, and tvOS. **Not an SDK** — it patches SDK source at build time to inject test content, then tests the resulting sample app. Expects the SDK repos as siblings in one workspace |

## Examples

Minimal integration samples, one per platform. Reference material for client teams, not shipped.

| Repo | Platform |
| --- | --- |
| [maestro-tvos-sdk-example](https://github.com/lessthan3/maestro-tvos-sdk-example) | tvOS |
| [maestro-android-sdk-example](https://github.com/lessthan3/maestro-android-sdk-example) | Android |
| [maestro-roku-sdk-example](https://github.com/lessthan3/maestro-roku-sdk-example) | Roku |
| [maestro-bbd-sdk-example](https://github.com/lessthan3/maestro-bbd-sdk-example) | Web / BBD |

## Tooling

| Repo | What it is |
| --- | --- |
| [maestro-mcp](https://github.com/lessthan3/maestro-mcp) | MCP server for Maestro |

## Working with submodules

> [!WARNING]
> **Cloning everything pulls roughly 2 GB.** Prefer initialising only the submodules you need.
>
> The weight is committed build artifacts, not history depth — `.apk`, `.dex`, and `build/intermediates/` in `maestro-android-sdk`, per-run test screenshots in `maestrokit-crossplatform-testing`, `dist/` packages in `maestro-roku-sdk`, and binary frameworks in the Swift repos. Every submodule is **already registered `shallow = true`, and that does not help** — a shallow clone still fetches each blob in the commits it does keep. Expect no relief from tweaking depth.
>
> Heaviest repos, packed history:
>
> | Repo | Packed | Working tree |
> | --- | --- | --- |
> | `maestro-android-sdk` | 302 MB | 55 MB |
> | `maestrokit-crossplatform-testing` | 250 MB | 901 MB |
> | `maestro-roku-sdk` | 90 MB | 10 MB |
> | `maestro-swift-sdk-kmp` | 59 MB | 123 MB |
> | `maestro-swift-sdk` | 53 MB | 54 MB (history only — empty checkout) |
> | `maestro-web-sdk` | 50 MB | 12 MB |
>
> The four server repos are not yet cloned locally and are not counted above.

Clone only what you need — this is the recommended path:

```bash
git submodule update --init projects/maestro-roku-sdk
```

Clone everything, if you actually need it:

```bash
git submodule update --init --recursive
```

Submodules are pinned to a commit, not a branch. To move one forward, commit the updated pointer from this repo after pulling inside the submodule.
