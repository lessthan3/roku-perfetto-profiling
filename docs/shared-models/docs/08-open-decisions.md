[← Rollout](07-rollout.md) · [Index](README.md)

# 8. Decisions worth making explicitly

These change the shape of the models — worth settling before phase 1.

## Record format

`"4-5"` (drop empty ties) or `"24-4-0"` (always three parts)?

- Football and MMA currently disagree — see [1. The case](01-the-case.md).
- MMA draws are meaningful in a way NFL ties arguably aren't.
- May warrant a per-sport flag rather than one global answer.

| Option | Behaviour | Cost |
| --- | --- | --- |
| Always drop zero | `"4-5"`, `"24-4"` | MMA loses a draw column it may want |
| Always three parts | `"4-5-0"`, `"24-4-0"` | NFL shows a `-0` the design doesn't ask for |
| Per-sport flag | Each keeps today's output | One more parameter to thread |

## Sides

Should `Stats.Contest` expose `home`/`away` **as well as** an ordered `competitors` array, or only the array?

- Fights have no home side.
- Head-to-head cards read far better with named sides.
- Proposal includes both. Cost: two representations of the same competitors that can drift if one is mutated without the other.

## Node vs assocarray

The models are drawn as plain maps. Making them SceneGraph nodes gets typed fields and observability, at the cost of the field-boundary crossing that `Stats.Game` already caps plays for:

```brightscript
' Stats.Game.bs:90
' How many of the most recent plays the Recent Plays card shows. The TV design lays out
' exactly five; the cap lives here so the other ~195 plays in a game never cross the
' SceneGraph field boundary.
const FB_RECENT_PLAYS = 5
```

If the models become nodes, that constraint applies to every collection field, not just plays.

This decision is no longer fully open, though. Nodes win:

- **Passed by reference.** A node handed from a Task to a card is the same object on both sides. An assocarray gets copied at the SceneGraph field boundary regardless, so that cost is paid either way — nodes just make what crosses the boundary typed instead of opaque.
- **The XML interface is a contract, not a convention.** A field declared in `Stats.Contest.xml` has a name and a type the SceneGraph runtime enforces. An assocarray key is trust-based — nothing stops a card reading a key that was never set, or a Task writing one nothing reads. That gap is exactly how `Stats.Event.xml`'s own interface became a second, undocumented model — the failure mode phase 4 closes (see [5. The proposed models](05-proposed-models.md#where-normalization-lives--and-where-it-must-not)).
- **Native components already expect nodes.** `Stats.Competitor[]`/`Stats.StatRow[]` as `roArray`s of nodes hand directly to List/Grid components that only accept ContentNode content. An assocarray needs a conversion step at that boundary too.
- **The Task/render-thread boundary needs a field either way.** SceneGraph's field system is that boundary regardless of node vs assocarray — a plain assocarray built inside a Task still crosses back through one opaque field, reopening the untyped-blob problem this proposal exists to close.

Decided: `Stats.*` are ContentNodes, with a shared interface no client subclasses.

- Keeps the Task/UI boundary typed.
- Works with the SDK's existing node-based components.
- Only the per-collection cap question above stays open.

## CardModel's contract

- `CardModel.data` stays an untyped assocarray under this proposal.
- Typing it per card is a larger change, out of scope here.
- Obvious next step once the models exist — `data` is currently where all the shape-safety gets lost again on the way to the UI.
