[← Field-by-field mapping](06-field-mapping.md) · [Index](README.md)

# 7. The theme model

One `Theme` per brand, providing fonts and colors under a vocabulary every brand implements in full.

**The names are fixed. The values are the brand's.** A component asks for `H3` or `C2` and gets whatever that means in the brand it was compiled into.

## Shape

```
Theme
  fonts     H1–H6 × weight   →  face + size
  text      C1–C6            →  hex
  surface   S1–S6            →  hex
  semantic  live · win · alert · accent
```

Every brand implements every token. A brand that omits one fails the build rather than the render — the vocabulary is a fixed list, so a missing rung is checkable.

Two things stay out of the shared vocabulary: a brand's own concepts, which live in that brand's file and are reachable only from that brand's components; and raw hex, which no component names directly.

## Fonts

A rung and a weight — two axes, named separately.

`H1` is the largest heading, `H6` the smallest. The rung is a position in the brand's ramp, not a size, so the same name resolves to a different number in each brand. That is the point.

Weight is passed rather than baked into the name, so one rung never needs a family of suffixed variants.

```
Theme.font("H3")
Theme.font("H3", Weight.Semibold)
Theme.font("H5", Weight.Bold)
```

Resolution is per-brand:

| Token | ESPN | Paramount | Fox |
| --- | --- | --- | --- |
| `H1` | BentonSans-Bold 48 | ProximaNova-Bold 48 | VenuAero-Bold 48 |

A brand declares which weights it ships. Asking for a weight a brand does not have resolves to its nearest available cut rather than failing at runtime.

## Colors

Two ramps — ink and ground are different things.

`C` is text, `S` is surface. Both run brightest to dimmest. They are separate ramps because a value that works as text rarely works as a background.

| Rung | Text · `C` | Surface · `S` |
| --- | --- | --- |
| 1 | primary — brightest | card base |
| 2 | secondary | card focused |
| 3 | tertiary | track |
| 4 | quaternary | rail |
| 5 | | |
| 6 | dimmest | deepest |

```
Theme.text("C1")
Theme.surface("S2")
```

Same name, per-brand value:

| Token | Paramount | Fox |
| --- | --- | --- |
| `C1` | `#FFFFFF` | `#ffffffd9` |
| `C2` | `#CDCDCD` | `#ffffffb3` |

## Semantic

Colors that mean something rather than sit on a ramp.

A rung answers "how bright." A semantic token answers "what is this." These cannot be ramp positions, because their meaning — not their brightness — is what a component is asking for.

| Token | Means | Fox | Paramount |
| --- | --- | --- | --- |
| `live` | this is happening now | `#d70935` | `#FF3B30` |
| `win` | a positive outcome | — | `#2E7D32` |
| `alert` | needs attention | `#ff9eb3` | — |
| `accent` | the brand's own colour | — | — |

Retinting one never moves another. Two tokens that share a value today stay separate tokens if they mean different things.

## Use

Components name tokens; nothing else knows a value.

```
label.typography = "H3"
label.color      = "C2"
card.background  = "S1"
```

Config overrides name tokens too, so an override selects a rung rather than a literal:

```json
{
  "typography": "P4",
  "color": "C2",
  "bgColor": "S1"
}
```

The theme is built once and read by every component, so font caching is a property of the object rather than a flag at each call site.

Only the brand's theme file names a hex value or a font path. A component that cannot express what it wants in tokens is the signal to add a token — for every brand at once — not to reach past the theme.
