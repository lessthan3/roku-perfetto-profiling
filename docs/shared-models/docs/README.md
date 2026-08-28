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
| [5. The proposed models](05-proposed-models.md) | Five types, and where the normalization boundary sits |
| [6. Field-by-field mapping](06-field-mapping.md) | Every source path, per client, per model field |
| [7. The theme model](07-theme-model.md) | One `Theme` per brand — fonts, text and surface ramps, and semantic colors, under a vocabulary every brand implements |
| [8. The event model](08-event-model.md) | One `Track.Event` per interaction — action, cause, surface, target, props and context, shaped per destination by its own emitter |

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

[Chapter 7](07-theme-model.md) defines the theme model — the same naming discipline applied to fonts and colors.

## The other direction

Data comes in and interactions go out, and both cross a client boundary. [Chapter 8](08-event-model.md) applies the same rule outbound: one shape in the middle, and the destination's vocabulary resolved at the boundary rather than at the call site.

Six models, in `src-sdk/core`:

- `Track.Event` — one interaction, whatever the destination calls it
- `Track.Action` — the verb, ten values, one place to ask what happened
- `Track.Cause` — user, dwell, timer or system
- `Track.Surface` — the region of UI, by kind and role rather than by component name
- `Track.Target` — what inside it the action landed on
- `Track.Context` — session, page, contest and device, resolved once

The contest lifecycle is the seam between the two halves: `context.contest.status.phase` is the same `Stats.Phase` chapter 5 defines, so both directions carry one encoding of it.
