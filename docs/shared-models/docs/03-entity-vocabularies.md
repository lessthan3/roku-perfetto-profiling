[← Status divergence](02-status-divergence.md) · [Index](README.md) · Next: [What raw passthrough costs →](04-cost-of-raw-data.md)

# 3. The same entity, five vocabularies

- A team is the most-read entity in all three clients.
- No two definitions match — not even within a single client.
- Fox alone carries two incompatible team shapes, depending on which service produced it.

| Concept | Paramount NFL | Fox stats | Fox keyplays | ESPN |
| --- | --- | --- | --- | --- |
| **identity** | `team.id` | `team1` / `team2` | `entity_id` | `teams[k]["$key"]` |
| **short name** | `abbrev` → `shortName` | `abbreviation` | `abbreviation` | `shortDisplayName` |
| **display name** | `nickname` | `name` | `name` | `shortDisplayName` |
| **logo** | `image.url` | `image.flag ?? image.logo` | `images.team_kit` | `logo` / `logoDark` |
| **brand colour** | `colorPrimaryHex` | `color` | — | — |
| **score** | `scoreboard.away.total` | `team1.score` | `left_team_score` | `points` / `score` |
| **record** | `currentStandings` | — | — | `record` |
| **sides keyed by** | `away` / `home` | `team1` / `team2` | `left` / `right` | `homeAway` + `displayOrder` |

## The expensive row

The last row is the one that causes bugs — `away/home`, `team1/team2` and `left/right` are three different questions:

| Spelling | Answers | Kind |
| --- | --- | --- |
| `away` / `home` | which team hosts | semantic |
| `team1` / `team2` | what order the feed sent | arbitrary |
| `left` / `right` | where it sits on screen | presentational |
| `homeAway` + `displayOrder` | re-derived per card | derived |

Code that assumes one and reads another renders the wrong side — no error, no crash, just the away team's logo on the home team's row.

- Nothing in the type system distinguishes them, because there is no type.
- Each card decides for itself.
- A card that guesses wrong renders the wrong side without failing.

## Two team shapes inside one client

Fox stats and Fox keyplays disagree with each other:

```brightscript
' Fox stats — teamPoster.bs:39
teamName  = team.name ?? ""
teamImage = team.image?.flag ?? ""
if is.true(teamImage = "") then teamImage = team.image?.logo ?? ""
```

```brightscript
' Fox keyplays — KeyPlaysService.bs:128, :270
leftTeam = item?.left_team?.abbreviation
if is.null(leftTeam) or leftTeam = "" then leftTeam = item?.left_team?.name ?? ""

mainImage = team?.images?.team_kit ?? team?.images?.tertiary ?? team?.images?.primary
```

- Same client, same concept. Different field names, different fallback chains.
- Any helper written against one shape breaks on the other.
