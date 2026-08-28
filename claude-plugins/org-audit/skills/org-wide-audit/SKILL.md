---
name: org-wide-audit
description: Audit how a feature, pattern, or convention is implemented across every Maestro repository, using the submodules under `projects/` in the dev-tools repo as the working set. Use whenever a question spans more than one repo - "how does X work across our SDKs", "which platforms implement Y", "are we consistent about Z", "where is W defined org-wide", comparing Roku vs Android vs Swift vs Web behavior, or planning a change that has to land in several repos at once.
---

# Org-Wide Audit

This repo (`dev-tools`) exists so every Maestro repository is checked out on one disk under `projects/`. That makes it the only place an org-wide question can be answered by reading real source instead of guessing from memory or from READMEs.

An audit answers one question across many repos and returns a **comparison**, not a pile of per-repo summaries. The value is in the divergence: which repos implement the feature, which do it differently, and which do not have it at all.

## Non-negotiables

**Read-only.** Never edit, format, build, checkout, stage, or commit inside `projects/*`. Each submodule is a pinned commit of a real repo; a stray write shows as a dirty submodule pointer in `dev-tools`. Fixes belong in the target repo as separate, deliberate work — an audit only reports.

**Evidence, not inference.** Every claim cites `projects/<repo>/<path>:<line>`. Read the implementation. A README, a doc page, a `CHANGELOG`, or a type signature describes intent — the audit reports behavior, so confirm it in the code that runs. This is [the planning rule](../../../rules-code/rules/code-planning.md) applied at org scale: treat each claim as a hypothesis and go look.

**"Absent" is a finding, and the most expensive one to get wrong.** Never report a repo as lacking a feature on the strength of one grep that returned nothing. Platforms rename things — the Web SDK's `onPlaybackError` is the Roku SDK's `handleErr`. Before writing "not implemented", search for the *concept* under that platform's vocabulary, and say which spellings you tried.

## Workflow

### 1. Pin the question

State the audit as one sentence before searching: *"How does each SDK report playback errors upstream?"* If the request is broader than a sentence, split it into separate audits rather than blurring them together.

Settle two things with the user only if the request is genuinely ambiguous — otherwise pick the obvious reading and say which you picked:

- **Scope** — all repos, or just the SDKs? Examples and test-data repos usually answer "how is this *consumed*", which is a different question from "how is this *implemented*".
- **Depth** — an inventory (who has it) is cheap; a semantics audit (does it behave the same) is not.

### 2. Establish the working set

`.gitmodules` is the authoritative repo list. The checkout is usually partial, so resolve what is actually readable:

```bash
git submodule status                     # ' ' clean, '-' not initialized, '+' pointer moved
ls -A projects/<repo> | head             # a lone .git means no working tree
```

See [references/repo-map.md](references/repo-map.md) for what each repo is and which ones are likely to matter for a given question.

An uninitialized submodule is **unknown**, never **absent** — collapsing those two is the single easiest way to publish a wrong audit. To read one, ask before running it (it is a network fetch, and can be large):

```bash
git submodule update --init --depth 1 projects/<repo>
```

If the user declines, or a repo fails to fetch, the audit still ships — list those repos under *Not covered* with the reason.

### 3. Sweep, then read

Two passes. Cast wide with cheap searches to find candidate files, then actually read the ones that matter.

Grep the whole working set at once rather than repo by repo — one pass over `projects/` gives you the cross-repo hit distribution immediately, and that distribution is itself the first draft of your findings:

```bash
grep -rn "<term>" projects/ --include=<glob>
```

Search case-insensitively (`-i`) by default. BrightScript is a case-insensitive language, so `error`, `Error`, and `ERROR` are the same identifier on Roku and a case-sensitive grep will report a feature absent that is sitting right there. Vary the term across each platform's vocabulary too — [references/repo-map.md](references/repo-map.md) lists file globs and naming conventions per ecosystem. Then open the real call sites. A hit count is a lead, not a finding; a feature can be referenced in ten files and implemented in one.

Watch for the two failure modes that make sweeps lie:

- **Vendored and generated code** — `dist/`, `build/`, `node_modules/`, `Pods/`, `.build/`, lockfiles. These inflate hit counts and can show a feature in a repo that only depends on it. Exclude them, and treat a hit that appears only under one of these paths as a dependency, not an implementation.
- **Shared source** — `roku-shared-tools`, `sdk-testdata`, and the KMP repos are consumed by several other repos. One implementation surfacing in four checkouts is one implementation. Attribute it to its home repo and record the others as consumers.

### 4. Record findings in one shape

Capture the same fields for every repo as you go, so the comparison is a read of your notes rather than a second investigation:

| Field | Notes |
| --- | --- |
| Repo | directory under `projects/` |
| Commit | `git -C projects/<repo> rev-parse --short HEAD` |
| Status | implemented / partial / absent / not covered |
| Entry point | `path:line` where the behavior actually starts |
| Behavior | what it does, in the audit's terms — not the platform's |
| Divergence | how it differs from the others |

Record the commit for every repo you touch. Submodules are pinned, so an audit describes a specific commit, not "the repo" — without the SHA a reader cannot tell a stale finding from a current one.

Describing behavior in the audit's vocabulary rather than each platform's is what makes rows comparable. "Retries three times with backoff, then drops the event" compares across repos; "calls `retryWithBackoff()`" does not.

### 5. Report

Lead with the answer to the pinned question, then the comparison table, then per-repo detail. [references/report.md](references/report.md) has the structure and a worked example.

Divergence is the payload. When repos differ, say which is the outlier and what the practical consequence is — a behavior difference users can observe outranks a naming difference. Where the audit found a real problem, list it as a finding with its evidence; do not fix it as part of the audit, and do not pad the report with recommendations the evidence does not support.

State what you could not cover. An audit that quietly skipped four uninitialized repos reads exactly like one that checked all eighteen.

## Cost

A wide sweep across eighteen repos burns context fast. Keep `grep` output narrow and read only the files that earned it — `-l` for a file list, and `-rc ... | grep -v ':0$'` for the per-repo distribution, since `-c` alone prints a `:0` line for every file it searched and buries the hits. If the user asks for the fan-out to run in parallel, dispatch one read-only agent per repo with the field list from step 4 as its brief, and do the comparison yourself once they return — the comparison is the part that needs the whole picture in one head.
