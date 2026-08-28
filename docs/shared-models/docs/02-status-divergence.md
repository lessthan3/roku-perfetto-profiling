[← The case](01-the-case.md) · [Index](README.md) · Next: [Entity vocabularies →](03-entity-vocabularies.md)

# 2. One lifecycle, three encodings

- Every client models the same three-state contest lifecycle.
- No two agree on the representation, and one uses integers.
- No value can cross a client boundary without translation.

| Client | Type | Before | During | After | Defined in |
| --- | --- | --- | --- | --- | --- |
| **Fox** | integer | `FUTURE_EVENT = 2` | `LIVE_EVENT = 1` | `PAST_EVENT = 3` | `T.Fox.EventStatus` |
| **Paramount NFL** | string | `"PREGAME"` | `"LIVE"` | `"POSTGAME"` | `T.Paramount.GameStatus` |
| **Paramount MMA** | string | `"UPCOMING"` | `"LIVE"` | `"FINAL"` | `T.Paramount.FightStatus` |
| **ESPN** | unnormalized | raw `gameState` / `status.type` / `betStatus` read straight from the response | | | — |

The two Paramount enums are near-duplicates of each other, and the NFL file's own header admits it:

> Mirrors `src-sdk/paramount/server/StatsService/enums/enums.bs` (FightStatus).

Both ship a hand-rolled `normalize()`, each accepting an overlapping-but-unequal set of raw strings.

## The second problem: normalize() discards information

The table above understates the divergence. Each client accepts far more raw values than it can represent, so `normalize()` is lossy by construction.

| Client | Raw inputs accepted | Distinct outputs | Lost in the fold |
| --- | --- | --- | --- |
| Paramount NFL | 17 | 3 | `"HALFTIME"` is indistinguishable from `"IN_PROGRESS"` |
| Paramount MMA | 13 | 3 | `"ENDED"` is indistinguishable from `"FINAL"` |

- **A card cannot render what the model threw away.** A scoreboard wanting to show "HALF" has no field to read it from, because `HALFTIME` was flattened into `live` at parse time.
- **Unmodelled states have nowhere to go.** `DELAYED`, `POSTPONED`, `CANCELED` and `SUSPENDED` are accepted by neither normalizer — they fall through to `unknown`.
- **The fix is not a longer enum.** Adding `HALFTIME` as a fourth value forces every `isLive` caller to handle it. The lifecycle needs a coarse `phase` to branch on and a `detail` to read from — see [Stats.Status](05-proposed-models.md#statsstatus).

## "PRE" and "POST" are overloaded

The same two tokens carry a different meaning in each of two functions, and nothing but the callsite distinguishes them.

| Token | `seasonTypeLabel` (`Stats.Game.bs:220`) | `GameStatus.normalize` (`enums.bs:29`) |
| --- | --- | --- |
| `"PRE"` | Preseason | pregame |
| `"POST"` | Postseason | postgame |

- **Not a live bug.** Status reads `data.status`; season reads `data.season.seasonType`. The fields are separate today.
- **But both accept-lists are deliberately wide**, and the NFL enum's own header admits the real feed vocabulary is unknown. A renamed or relocated field would mislabel silently rather than fail.
- **The fix is a type, not a longer accept-list.** See [Stats.SeasonType](05-proposed-models.md#statsseasontype) — season becomes its own enum on `Stats.Contest`, so the two questions stop sharing a vocabulary.

## The three phases already exist

Both clients re-derive the same coarse grouping downstream of their own enums:

- `footballCardManifest.phaseKey()` maps the NFL enum to `"pre"` / `"live"` / `"post"`.
- `paramountStats.bs:221-227` hand-rolls that same mapping again, from raw MMA strings rather than the enum.
- `statsCardConfig.bs` keys every card list on those three phases.

The clustering is not new vocabulary. It is the vocabulary the config layer already speaks, restated once per client.

## How it normalizes

```brightscript
' one normalizer, every client vocabulary
Parse.status(raw) as Stats.Status

'   Fox            2 | 1 | 3                                    (integer)
'   Paramount NFL  PREGAME PRE SCHEDULED UPCOMING FUTURE
'                  LIVE IN IN_PROGRESS INPROGRESS ACTIVE HALFTIME
'                  POSTGAME POST FINAL COMPLETE COMPLETED ENDED  (17 inputs)
'   Paramount MMA  UPCOMING SCHEDULED PRE PREGAME FUTURE
'                  LIVE IN_PROGRESS INPROGRESS ACTIVE
'                  FINAL COMPLETE COMPLETED ENDED                (13 inputs)
'   ESPN           gameState · status.type · betStatus     (never normalized)

' returns phase + detail
'   future   -> scheduled · delayed · postponed
'   live     -> inProgress · halftime · betweenParts · suspended
'   past     -> final · canceled · abandoned
'   unknown  -> raw kept, never rendered
```

- The normalizer must accept an integer as well as strings — that single requirement lets Fox stop comparing against `2`.
- Both Paramount vocabularies already overlap on `"LIVE"`, `"SCHEDULED"` and `"PRE"`.
- The merged accept-list is barely larger than either one alone.

## Fox's enum is unreachable from the UI

Fox's enum lives in a server namespace no component imports. The UI compares against the literal instead:

```brightscript
Stats.Event.bs:85        if (m.top.status <> 2)
Stats.Event.bs:123       if (m.top.status <> 2)
statsSummaryCard.bs:77   is.true(eventInformation?.eventStatus <> 2)
scoreChip.bs:57          isCountdown = is.true(eventStatus = 2)
statsMomentumCard.bs:93  eventStatus: cardData?.eventStatus ?? 1   ' defaults to LIVE
```

That last line is the one to note — a missing status silently defaults to LIVE.

## What a shared status retires

- `T.Fox.EventStatus`
- `T.Paramount.GameStatus`
- `T.Paramount.FightStatus`
- five sites comparing `status <> 2`
- `paramountStats.bs`'s eight raw `= "LIVE"` / `= "FINAL"` / `= "UPCOMING"` compares — MMA never adopted its own `FightStatus.isLive`/`isFinal`/`isUpcoming`, which are dead code today
