# Shared Stats Models

ESPN, Fox and Paramount each re-invent the same five entities — team, competitor, contest, stat row, status — in mutually incompatible shapes.

This proposal defines a shared internal model layer, plus the normalization boundary that feeds it.

- Evidence gathered from `packages/maestro-sdk/src-sdk` at commit `e509eb11`.
- All `file:line` references verified against the working tree.

## Contents

| Doc | What it covers |
| --- | --- |
| [1. The case](01-the-case.md) | The argument the codebase already makes for itself, and the three `record()` implementations that disagree |
| [2. Status divergence](02-status-divergence.md) | One lifecycle, three encodings, five magic-number comparisons |
| [3. Entity vocabularies](03-entity-vocabularies.md) | The same team, spelled five different ways across clients |
| [4. What raw passthrough costs](04-cost-of-raw-data.md) | Three failure modes currently in `main`, including one latent defect |
| [5. The proposed models](05-proposed-models.md) | Five types, with the flow diagram of feeds into the normalization boundary |
| [6. Field-by-field mapping](06-field-mapping.md) | Every source path, per client, per model field |
| [7. Rollout](07-rollout.md) | Five phases, sequenced so nothing is rewritten twice |
| [8. Open decisions](08-open-decisions.md) | Four calls worth settling before phase 1 |

An HTML version of the same content, with interactive diagrams, is at [index.html](../index.html).

## The short version

- The problem isn't that the clients disagree. It's that nothing forces them to agree, so they drift.
- Paramount's own `footballFormat.bs` header already documents this exact failure mode.
- The fix it describes was applied to one service of one client. The drift it predicted is now live two directories away.

Five models, in `src-sdk/core`:

- `Stats.Competitor` — one side of a contest, team or individual
- `Stats.Contest` — a game, match or fight
- `Stats.Status` — the three-state lifecycle, one encoding
- `Stats.StatRow` — one comparison row
- `Stats.Fmt` — the existing formatter, promoted so all clients reach it
