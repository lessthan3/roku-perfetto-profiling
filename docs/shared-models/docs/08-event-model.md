[← The theme model](07-theme-model.md) · [Index](README.md)

# 8. The event model

One `Track.Event` per interaction, described in a vocabulary every destination is shaped from.

**The vocabulary is fixed. The payload is the destination's.** A surface reports that a card was engaged, and each destination receives whatever that means on its own wire.

[Chapter 5](05-proposed-models.md#normalization) resolves a client's vocabulary on the way in. This one defers a destination's until the way out. A surface never names a wire key, and an emitter never sees anything but a finished event.

## Denormalization

Normalization collapses many spellings into one. **Denormalization is that run backwards** — one model field expanded into whatever each destination calls it, wherever each destination puts it.

An emitter is a spec for one destination, and it is the only place that destination's spelling exists. Given a finished event it decides four things and nothing else:

- **Which key** a model field lands under, and whether it lands at all — a destination takes what it asked for and ignores the rest.
- **How a value spells out** — an enum as one destination's tokens, a duration as seconds or as milliseconds, an id as a scalar or a list.
- **What absence looks like** — a sentinel, an empty string, or an omitted key.
- **Which constants** ride along — values that describe the destination rather than the event.

None of that reaches the event. Two destinations that want the same fact under different names are two rows in two emitters, not two fields on the model.

```
   Track.Event                    Emit.maestro          Emit.fox          Emit.adobe
   ───────────                    ────────────          ────────          ──────────

   action ───────────────────┬──> e1_phylum
                             └──────────────────────────────────────────> the trackAction name

   surface.role ─────────────┬──> e2_class
                             └──────────────────────────────────────────> columnHeaderTitle

   surface.name ─────────────┬──> e4_family
                             └──────────────────────────────────────────> subColumnHeaderTitle

   surface.index ───────────────────────────────────────────────────────> subColNum

   targets[0].id ────────────┬──> entity_id
                             └────────────────────────> listing_id

   targets[0].name ──────────┬──> card
                             ├────────────────────────> button_text
                             └──────────────────────────────────────────> rowHeaderTitle

   targets[0].index ─────────┬──> card_index
                             └──────────────────────────────────────────> posRowNum

   contest.status.phase ────────> game_state            —                 —
                                  pre | in | post

   props.span.durationMs ────┬──> visibility_duration_timer
                             └──────────────────────────────────────────> elapsedTime
                                                                          seconds

   absent value                   a sentinel            key omitted       ""
   constants                      —                     —                 the column it sits in
```

- **`targets[0].name` lands three times under three names** — a card, a button label, a row title. It is one fact, so a surface reports it once.
- **`targets[0].id` splits by destination** — an entity to one, a listing to another. Neither name belongs on the model.
- **`action` reaches Adobe as the call itself**, not as a field. A destination is free to encode a model value in its event name.
- **`contest.status.phase` lands once.** The other two destinations do not ask for it, so nothing spells it out for them.

A destination that wants a fact the event does not carry is the signal to add the field to `Track.*` — at which point every destination can have it.

## Shape

```
Track.Event
  action   what happened      view · focus · blur · engage · expand
                              collapse · dismiss · start · end · heartbeat
  cause    what caused it     user · dwell · timer · system
  surface  where it happened  kind · role · variant · id · name · template · index
  targets  what it landed on  kind · id · name · list · index
  props    action-specific    declared per role
  context  ambient            session · page · contest · device
  at       when               ms since epoch
```

Every destination is fed from this one object. A destination that needs a value the event does not carry is the signal to add a field — for every destination at once — not to grow a payload beside it.

## Action

The verb, and nothing else.

| Action | Means |
| --- | --- |
| `view` | became visible |
| `focus` | focus arrived |
| `blur` | focus left — carries `props.span.durationMs` |
| `engage` | acted on |
| `expand` · `collapse` | opened or closed in place |
| `dismiss` | closed or removed |
| `start` · `end` | a lifecycle boundary |
| `heartbeat` | a periodic liveness signal |

`expand` and `collapse` are verbs rather than a string carried by `engage`, so there is exactly one place to ask whether something was expanded.

An action never names its surface. `engage` on a panel and `engage` on an overlay are the same verb, so the list does not grow when a surface kind is added.

`focus` and `blur` are a pair. A dwell span is two events with one duration, not a bespoke shape per destination.

## Cause

Why the event fired.

| Cause | Means |
| --- | --- |
| `user` | a remote press or a click |
| `dwell` | focus settled past a threshold |
| `timer` | a timecode, an interval, a debounce fallback |
| `system` | visibility, lifecycle, data arrival |

Every event answers it. Without `cause`, an automatic view and a deliberate one are the same event, and a destination that wants them separated has to be given two event names.

## Surface

The region of UI the event happened in.

```
Track.Surface
  kind      sdk · page · pinchback · panel · overlay · module
  role      stats · keyPlays · betting · fantasy · commerce · multiView · broadcast
  variant   "" unless one client ships two of a role
  id        the instance
  name      the authored name
  template  the authored template the instance came from
  index     position among sibling surfaces on the page
```

**`role` is the shared vocabulary; the component name is not.** A stats panel is `role: stats` in every client. Which component implements it is the client's business, and the destination's name for it is the emitter's.

`variant` exists only where one client ships two surfaces of a role — a fight stats panel and a football stats panel are both `stats`.

An overlay and a panel can share a role. Betting is betting whichever surface kind presents it.

## Target

What inside the surface the action landed on.

```
Track.Target
  kind   card · cta · tab · play · stream · product · bet · surface
  id     the entity
  name   the label
  list   which list within the surface; "" for the primary
  index  position within that list; -1 when position has no meaning
```

`id` and `name` are both carried, so no call site chooses between identifying a thing and labelling it. A destination that wants one takes one.

`targets` is a list. An action on several streams is several targets, not a field whose type changes with the event.

`kind: surface` covers an action whose object is another surface — opening a panel is an `engage` whose target is that panel.

## Props

Facts specific to what happened, declared per role rather than pooled.

```
Span      durationMs
Text      text · ctaText · data
Betting   inGameBets · totalBets · betType
Fantasy   teamsManaged
Commerce  entityType · entityName · price · sale
Play      playType · description · sportUri
Layout    layoutType
```

`Span` and `Text` are available to any role. The rest attach to the role that means them.

A value a surface cannot express in its role's props is the signal to add one, for every client that has that role.

## Context

The ambient facts, resolved once when the event is built.

```
Track.Context
  client      espn · fox · paramount
  sdkVersion
  viewerId
  session     { sdk, page, pinchback }
  page        { eventId, league, sport, airing }
  contest     as Stats.Contest
  device      { orientation }
```

**`contest` is the shared inbound model.** `contest.status.phase` is the `Stats.Phase` of [chapter 5](05-proposed-models.md#statsstatus), so the lifecycle has one encoding across both directions and every client carries it without restating it.

Context is captured at construction, not merged in at dispatch. An event that already knows its own page can be queued, replayed, or delivered to a second destination without being rebuilt.

## Emitters

One emitter per destination, each owning the four decisions above and nothing else.

```
Emit.maestro(event)   ' the taxonomy envelope plus metadata
Emit.fox(event)       ' the host SDK's own callback shape
Emit.adobe(event)     ' a trackAction call and its cdata
```

An emitter reads the event and writes a payload. It never reaches back — there is no field a surface fills on its behalf, and no hook by which one destination's needs alter another's output.

Adding a destination is one emitter. It changes nothing about the event, and nothing about any other destination.

## Routing

A client declares which emitters it runs and what each one wants.

```yaml
clients:
  fox:
    emit:
      maestro: all
      fox:
        - { action: [engage, expand, collapse], target: cta }
  paramount:
    emit:
      maestro: all
      adobe:
        - { surface: panel, role: stats }
```

Every client runs `maestro`. A client that also has its own analytics runs a second emitter named for that destination — which is why `fox` appears at both levels: the client, and the destination it forwards to.

A UI fact is reported once. Every destination that subscribes to it gets it, in its own shape, without a second report being written by hand.

## Use

Surfaces name model values; nothing else knows a wire key.

```
Track.emit(m.top, Action.engage, {
  target: Track.card(item.id, item.title, index)
})

Track.emit(m.top, Action.expand, {
  target: Track.cta("See All Stats")
})
```

The surface supplies what only it knows — which target, which props. Action and cause come from the interaction. Surface and context are resolved from where the event was raised.

Only an emitter names a wire key, a sentinel, or a destination's constant. A surface that cannot say what it means in the model is the signal to extend the model — for every destination at once — not to reach past it.
