# Audit Report Shape

Write the report to answer the pinned question in the first three lines. A reader who stops there should get the finding; everything after is evidence for someone who needs to act on it.

## Structure

1. **Answer** — the pinned question, answered in a sentence or two. Lead with the divergence if there is one.
2. **Comparison** — one row per repo, one column per thing that varies.
3. **Findings** — real problems, each with evidence. Omit the section entirely if there are none.
4. **Per-repo detail** — entry points and behavior, for whoever implements the follow-up.
5. **Not covered** — repos skipped, and why.

## Worked example

> **How does each SDK report playback errors upstream?**
>
> Three of four SDKs post a structured error event; the Roku SDK logs locally and drops it, so Roku playback failures are invisible in platform analytics. Android and Web agree on the payload shape; Swift omits `errorCode`.

| Repo | Commit | Status | Transport | Payload | Retries |
| --- | --- | --- | --- | --- | --- |
| `maestro-web-sdk` | `a1b2c3d` | implemented | `POST /events` | `{code, message, ctx}` | 3, backoff |
| `maestro-android-sdk` | `e4f5g6h` | implemented | `POST /events` | `{code, message, ctx}` | 3, backoff |
| `maestro-swift-sdk` | `i7j8k9l` | partial | `POST /events` | `{message, ctx}` — no `code` | none |
| `maestro-roku-sdk` | `m0n1o2p` | absent | — | — | — |
| `maestro-platform` | — | not covered | submodule not initialized | | |

> **Findings**
>
> 1. Roku playback errors never reach the platform. `projects/maestro-roku-sdk/src-sdk/core/playback.bs:212` writes to the local log and returns; no call site forwards it. Searched `error`, `err`, `handleErr`, `fault`, `reportError`.
> 2. Swift drops `errorCode`, so platform-side grouping by code silently buckets all iOS errors together. `projects/maestro-swift-sdk/Sources/Maestro/Telemetry/ErrorReporter.swift:47`.
> 3. Swift does not retry, so a transient failure loses the event outright. Same file, `:61`.

## Rules

**Cite `path:line` for every claim.** A row without evidence is a guess wearing a table.

**Record the commit.** Submodules are pinned; the audit is true of a SHA, not of a repo. A reader six weeks later needs to know what they are comparing against.

**Say what you searched when you report absence.** "Not implemented" is only credible with the attempted vocabulary attached — it lets a reader who knows the platform correct you in seconds instead of re-running the whole audit.

**Keep *not covered* distinct from *absent*.** Unknown and empty are different answers, and merging them is how an audit becomes actively misleading.

**Report, do not fix.** Findings hand off to deliberate work in the target repo. Recommendations only where the evidence supports them — an audit that ends in speculative advice devalues the part that was actually verified.
