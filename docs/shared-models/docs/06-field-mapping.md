[← The proposed models](05-proposed-models.md) · [Index](README.md) · Next: [Rollout →](07-rollout.md)

# 6. Field-by-field mapping

Every source path, per client, per model field.

- These are the actual expressions in the working tree, not paraphrases.
- Where a client resolves a value through a fallback chain, the whole chain is given — that chain gets deleted once the client's Task owns it.
- See [5. The proposed models](05-proposed-models.md#where-normalization-lives--and-where-it-must-not) for why that logic lives in the Task, not a client-specific ContentNode.

---

## Stats.Competitor

```mermaid
flowchart LR
  subgraph ID["→ id as string"]
    direction TB
    A1["<b>Paramount NFL</b><br/>team.id.toStr()"]
    A2["<b>Paramount MMA</b><br/>as.string(fighter?.id)"]
    A3["<b>Fox keyplays</b><br/>entity_id"]
    A4["<b>ESPN</b><br/>teams[k].id — int, must coerce"]
  end
  subgraph NM["→ shortName / displayName"]
    direction TB
    B1["<b>Paramount NFL</b><br/>team?.abbrev · team?.nickname"]
    B2["<b>Paramount MMA</b><br/>firstName + ' ' + lastName"]
    B3["<b>Fox stats</b><br/>team.name"]
    B4["<b>Fox keyplays</b><br/>abbreviation ?? name"]
    B5["<b>ESPN</b><br/>shortDisplayName — used for both"]
  end
  subgraph LG["→ logo"]
    direction TB
    C1["<b>Paramount NFL</b><br/>team?.image?.url"]
    C2["<b>Fox stats</b><br/>image?.flag ?? image?.logo"]
    C3["<b>Fox keyplays</b><br/>images?.team_kit ?? tertiary ?? primary"]
    C4["<b>ESPN</b><br/>logo / logoDark"]
  end
  subgraph SC["→ score / primaryColor"]
    direction TB
    D1["<b>Paramount NFL</b><br/>scoreboard.away.total · colorPrimaryHex"]
    D2["<b>Fox stats</b><br/>team1.score · team.color"]
    D3["<b>Fox keyplays</b><br/>left_team_score — string '0'"]
    D4["<b>ESPN</b><br/>points / score — two fields"]
    D5["<b>ESPN · Fox keyplays</b><br/>no brand colour in feed → ''"]
  end

  ID --> OUT["<b>Stats.Competitor</b>"]
  NM --> OUT
  LG --> OUT
  SC --> OUT

  style OUT fill:#0B6E99,stroke:#0B6E99,color:#fff
  style D5 fill:#FBEAE7,stroke:#B3402F,color:#B3402F
  style A4 stroke:#B3402F
  style B5 stroke:#B3402F
```

| Model field | Paramount NFL | Paramount MMA | Fox stats | Fox keyplays | ESPN |
| --- | --- | --- | --- | --- | --- |
| `id` | `team.id.toStr()` | `as.string(fighter?.id)` | `team1` / `team2` | `entity_id` | `teams[k].id` ⚠ int |
| `shortName` | `team?.abbrev` | — | `abbreviation` | `abbreviation ?? name` | `shortDisplayName` |
| `displayName` | `team?.nickname` | `firstName + lastName` | `team.name` | `name` | `shortDisplayName` ⚠ |
| `logo` | `team?.image?.url` | `faceoffView?.url` | `image?.flag ?? image?.logo` | `team_kit ?? tertiary ?? primary` | `logo` / `logoDark` |
| `score` | `scoreboard.away.total` | — | `team1.score` | `left_team_score` ⚠ string | `points` / `score` |
| `primaryColor` | `team?.colorPrimaryHex` | — | `team.color` | ✗ none | ✗ none |
| `record` | `Fmt.record(currentStandings)` | `Parse.record(fighter?.record)` | — | — | `record` |

Two details drive real decisions:

- **ESPN's `id` is an integer.** Every other feed gives a string. The parse must coerce, or lookups silently miss.
- **ESPN reuses `shortDisplayName`** for both `shortName` and `displayName`. One of the two is approximate until a better field is found.

---

## Stats.Contest — sides

This is the mapping with the highest bug potential.

```mermaid
flowchart LR
  S1["<b>Paramount NFL</b> — semantic<br/>data.awayTeam · data.homeTeam<br/><i>already correct</i>"]
  S2["<b>Fox stats</b> — feed order<br/>info.team1 · info.team2<br/><i>order ≠ home/away</i>"]
  S3["<b>Fox keyplays</b> — positional<br/>left_team · right_team<br/><i>screen position, not identity</i>"]
  S4["<b>ESPN</b> — derived per card<br/>homeAway + displayOrder, SortBy<br/><i>re-derived at each card</i>"]
  S5["<b>Paramount MMA</b> — no sides<br/>fighterDetails[].corner"]

  R{{"resolve sides<br/>once, at parse time<br/>not in every card"}}

  S1 --> R
  S2 --> R
  S3 --> R
  S4 --> R
  S5 --> R

  R --> H["<b>home / away</b> as Stats.Competitor<br/><i>head-to-head cards read these — never an index</i>"]
  R --> C["<b>competitors[]</b> as Stats.Competitor<br/><i>feed order preserved · fight cards<br/>and anything without a home side</i>"]

  style R fill:#0B6E99,stroke:#0B6E99,color:#fff
  style S1 stroke:#1F7A4D
  style S2 stroke:#B3402F
  style S3 stroke:#B3402F
  style S4 stroke:#B3402F
  style H fill:#E4F1F7,stroke:#0B6E99
  style C fill:#E4F1F7,stroke:#0B6E99
```

`away/home`, `team1/team2` and `left/right` answer three different questions — semantic, feed-ordered, and positional. Today each card decides for itself.

Fix: resolve once at parse, and expose *both* named sides and an ordered array. Covers head-to-head and fight cards without either borrowing the other's assumption.

---

## Stats.StatRow

```mermaid
flowchart LR
  P["<b>Paramount</b> · Parse.Football.gameRow<br/>key · label<br/>away / home → { value, note, share }<br/>previewRow adds { rank, rankValue }<br/><i>already the target shape</i>"]
  F["<b>Fox</b> · teamGoals row<br/>template · text<br/>value · barPercentage<br/><i>barPercentage ≡ share</i><br/><i>no key — row identity is positional</i>"]

  P --> T
  F --> T

  T["<b>Stats.StatRow</b><br/>key as string<br/>label as string<br/>home / away as Stats.StatValue<br/>{ value, note, share, rank }<br/><b>leader</b> — 'home' | 'away' | ''<br/><i>computed once, by rank not raw value</i>"]

  T --> FMT["values pass through Stats.Fmt.decimal<br/><i>a pre-formatted feed string is left alone</i>"]

  style T fill:#0B6E99,stroke:#0B6E99,color:#fff
  style P stroke:#1F7A4D
  style F stroke:#B3402F
```

| Model field | Paramount | Fox | Note |
| --- | --- | --- | --- |
| `key` | `key` | ✗ none | Fox rows addressable only by position |
| `label` | `label` | `text` / `template` | |
| `home` / `away` | `{ value, note, share }` | `value` + `barPercentage` | `barPercentage` ≡ `share` |
| `rank` | `previewRow` only | — | |
| `leader` | ✗ new | ✗ new | computed by rank, not raw value |

- `leader` is the one genuinely new field.
- Computed by league rank, not raw value — so lower-is-better stats like yards allowed don't highlight the wrong side.

---

## Stats.Status

Covered in full in [2. Status divergence](02-status-divergence.md), including the normalize flow diagram.

| `phase` | Fox | Paramount NFL | Paramount MMA | ESPN |
| --- | --- | --- | --- | --- |
| `future` | `2` | `"PREGAME"` `"PRE"` `"SCHEDULED"` `"UPCOMING"` `"FUTURE"` | `"UPCOMING"` `"SCHEDULED"` `"PRE"` `"PREGAME"` `"FUTURE"` | raw `gameState` `"pre"` |
| `live` | `1` | `"LIVE"` `"IN"` `"IN_PROGRESS"` `"INPROGRESS"` `"ACTIVE"` `"HALFTIME"` | `"LIVE"` `"IN_PROGRESS"` `"INPROGRESS"` `"ACTIVE"` | raw `"in"` |
| `past` | `3` | `"POSTGAME"` `"POST"` `"FINAL"` `"COMPLETE"` `"COMPLETED"` `"ENDED"` | `"FINAL"` `"COMPLETE"` `"COMPLETED"` `"ENDED"` | raw `"post"` |
| `unknown` | — | fallback | fallback | ✗ no fallback today |

The `detail` sub-status is what keeps these folds from losing information:

| `phase` | `detail` | Sourced from |
| --- | --- | --- |
| `future` | `scheduled` | the default for any accepted future value |
| `future` | `delayed` `postponed` | ✗ no client accepts these today — they fall to `unknown` |
| `live` | `inProgress` | `"LIVE"` `"IN"` `"IN_PROGRESS"` `"ACTIVE"` · Fox `1` |
| `live` | `halftime` | `"HALFTIME"` — accepted by NFL today, then flattened into `live` and lost |
| `live` | `betweenParts` | any other stoppage between parts — ✗ not accepted today |
| `live` | `suspended` | ✗ not accepted today |
| `past` | `final` | `"FINAL"` `"POSTGAME"` `"COMPLETE"` · Fox `3` |
| `past` | `canceled` `abandoned` | ✗ not accepted today |

Overtime and "which part" are deliberately absent from this table — they belong to `Stats.Format`, not to status. `period > format.regulationParts` answers "is this overtime" for every sport. Halftime is the exception that stays a status: it is a broadcast state the feed names directly, and its position varies by sport (after part 2 of 4 in the NFL, 2 of 3 in hockey), so no rule over part count picks it out.
