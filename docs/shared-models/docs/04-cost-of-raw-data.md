[← Entity vocabularies](03-entity-vocabularies.md) · [Index](README.md) · Next: [The proposed models →](05-proposed-models.md)

# 4. What passing raw data costs today

Three failure modes, all currently in `main`.

## Unguarded traversal into response shape

- No model boundary means leaf UI walks the API's own tree.
- ESPN's doubles branch dereferences six levels with no guard at any step.
- An athlete without a country crashes the card.

```brightscript
' CompetitorsMatchup.brs:26-31
athlete1 = athletes[displayOrderedCompetitors[i].athletes[0]["$key"]]
athlete2 = athletes[displayOrderedCompetitors[i].athletes[1]["$key"]]
flags = [athlete1.country.flag.href, athlete2.country.flag.href]
```

No guard on `athletes[…]`, on `.country`, or on `.flag`.

Fox hands the raw feed blob to leaf cards directly:

```brightscript
' statsGameInfoCard.bs:39-46
sub onCardData(cardData)
  updateEventTitle(cardData?.eventInformation)
  updateEventSubtitle(cardData?.eventInformation)
  updateScoreboard(cardData?.eventInformation)
end sub
```

- `eventInformation` is the untransformed API shape.
- `Stats.Event.bs` carries `' todo: move to using event` comments at the sites that pass it through — the author flagged this while writing it.

## The same helper, forked into safe and unsafe copies

`GetTeamByKey` exists four times in one ESPN directory:

| Copy | Signature | Guards `invalid`? |
| --- | --- | --- |
| `MatchPredictor.brs:101` | `(key as string, teams as object)` | no |
| `OnTheCourt.brs:274` | `(key as string, teams as object)` | no |
| `RecentGames.brs:302` | `(key as string, teams as object)` | no |
| `PlayerCard.brs:240` | `(key as dynamic, teams as dynamic)` | **yes** |

```brightscript
' MatchPredictor.brs:101 — also OnTheCourt, RecentGames
function GetTeamByKey(key as string, teams as object) as object
  if teams.DoesExist(key)      ' crashes when teams is invalid
    return teams[key]
  else
    return invalid
  end if
end function
```

```brightscript
' PlayerCard.brs:240 — the only guarded copy
function GetTeamByKey(key as dynamic, teams as dynamic) as object
  if key = invalid or teams = invalid then return invalid

  if teams.DoesExist(key)
    return teams[key]
  end if

  return invalid
end function
```

Whether a missing team crashes depends on which card the user is looking at.

## A guard that cannot fire

This line reads as a null-check but never rejects anything:

```brightscript
' BetsDataModel.brs:61
if athletes = invalid or (event?.competitions = invalid and event?.competitions.Count() = 0) then return invalid
```

- `and` should be `or`. As written, the competitions guard is dead code and `parseMatchTable` always returns a table.
- It hasn't crashed only because of short-circuit evaluation — when the left side is true, the right side (which dereferences a value just proven possibly-invalid) never runs.

> Real defect, independent of the model work. Fix it regardless of whether this proposal proceeds.
