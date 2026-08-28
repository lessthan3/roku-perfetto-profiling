[← Index](README.md) · Next: [Status divergence →](02-status-divergence.md)

# 1. The case

The argument was made in-repo before it was made here.

Paramount's football models carry a header comment that states this document's thesis exactly. It was written to justify a helper that fixed the problem inside *one service of one client*:

> Every model was growing its own `int`/`number`/`ordinal`/`record`/`playerName`, which is both duplication and a place for the four to quietly disagree — a rank rendering as `1st` in one card and `1th` in another is exactly the kind of drift this prevents.
>
> — `paramount/server/FootballService/models/footballFormat.bs:1-7`

- The fix worked, but stopped at the service boundary.
- Two directories away, the drift it warned about is live.

## Three `record()` functions, two outputs

Same input shape `{ wins, losses, ties/draws }`. Three implementations.

```brightscript
' footballFormat.bs:54  — drops empty ties
text = wins + "-" + losses

ties = record?.ties
if is.number(ties) and cint(ties) > 0
  text += "-" + cint(ties).toStr()
end if
' 4 wins, 5 losses, 0 ties  →  "4-5"
```

```brightscript
' Stats.Fight.bs:79  — always three parts
wins   = record?.wins ?? 0
losses = record?.losses ?? 0
draws  = record?.draws ?? 0

return wins.toStr() + "-" + losses.toStr() + "-" + draws.toStr()
' 24 wins, 4 losses, 0 draws  →  "24-4-0"
```

```brightscript
' Stats.FightDetails.bs:149  — byte-identical copy of the above
' 24 wins, 4 losses, 0 draws  →  "24-4-0"
```

| Implementation | Location | Zero ties | Output |
| --- | --- | --- | --- |
| `Fmt.record` | `footballFormat.bs:54` | dropped | `"4-5"` |
| `Parse.record` | `Stats.Fight.bs:79` | rendered | `"24-4-0"` |
| `Parse.record` | `Stats.FightDetails.bs:149` | rendered | `"24-4-0"` |

## The same drift in name formatting

`Fmt.playerName` exists and formats `"G. Minshew"`. Three Paramount cards ignore it and re-derive the same initial inline from `firstName`/`lastName`:

- `judgesScoresCard.bs:203`
- `taleOfTheTapeCard.bs:231`
- `fightCard.bs:412`

A helper that exists but isn't reachable from where the work happens gets reimplemented. That's a structural problem, not a discipline problem.
