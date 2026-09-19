# `outline.json`

The single artifact of stage 1. The model fills this. Markdown is rendered from it and never
edited by hand.

```json
{
  "source": "Tidewrack",
  "profile": "vertical-microdrama",
  "params": { "episodes": 6, "secondsPerEpisode": 75, "register": "a debt", "adaptMode": "original" },
  "arc": [ { "episode": 4, "intensity": 9, "position": "peak" } ],
  "characters": [ ... ],
  "environments": [ ... ],
  "props": [ ... ],
  "turns": [ ... ],
  "episodes": [ ... ]
}
```

## Top level

| Field | Required | Notes |
|---|---|---|
| `source` | yes | Series title. |
| `profile` | yes | Format profile name. `vertical-microdrama` unless there is a reason. |
| `params.episodes` | yes | Must equal the length of `episodes`. The `refs-complete` gate checks it. |
| `params.secondsPerEpisode` | yes | Carried into every episode's `targetSeconds` by the seed. |
| `params.register` | yes | What the drama runs on: a debt, a secret, a bargain, revenge, longing. Decides what a turn is. |
| `params.adaptMode` | yes | `original`, `adapted`, or `loose`. |
| `params.overrides` | no | Per-project threshold overrides, merged over the profile. Use sparingly and say why. |
| `arc` | no | From `ai-director`. Omitting it makes `arc-coverage` skip and say so. |

## `characters`

| Field | Required | Notes |
|---|---|---|
| `id` | yes | `C01`. Unique. Everything downstream references this, never the name. |
| `name` | yes | Functional characters get a label rather than a name. |
| `tier` | yes | `lead` (1 to 4), `support` (up to 6), `functional` (up to 6). |
| `role` | yes | One line of positioning. |
| `arc` | lead and support | What changes in them. Optional for functional; a tallykeeper is there to tally. |
| `from` | yes | Non-empty. Where they came from: an adapted source, a merge, or `["original"]`. |
| `otherAnchors` | yes | **At least three.** See `other-lock.md`. The gate will reject adjectives. |

Tiers exist because a single cast cap confuses two different questions: who the audience must
remember, and how many faces production has to keep consistent. Separating them lets the second
number stay honest.

## `environments`

| Field | Required | Notes |
|---|---|---|
| `id` | yes | `E01`. Unique. |
| `name` | yes | |
| `primary` | yes | Boolean. Counted against the environment cap, which scales with episode count. |
| `variantOf` | variants | The parent's id. A variant reuses the parent's generated plate. |
| `reusePlan` | variants | What changed: time, weather, foreground, what was removed. |

Generating a new environment is cheap. Keeping one more environment consistent across the run is
not. An environment appearing once should be cut or made a variant.

## `props`

Only three things at once qualify: **it gets a close-up, it appears across more than one episode,
and it carries plot.** The test: if it broke, was lost, or was swapped, would the story collapse?
If no, it is set dressing and belongs in the environment anchors.

| Field | Required | Notes |
|---|---|---|
| `id` | yes | `P01`. |
| `name` | yes | |
| `function` | yes | **What it carries dramatically.** If this cannot be written, it is not a prop. The gate checks the field is non-empty; only you can check it says something. |
| `turnIds` | no | Which turns it carries. Must point at real turns. |

## `turns`

A turn is this pipeline's unit of dramatic payoff. What counts as one is set by `params.register`.

| Field | Required | Notes |
|---|---|---|
| `id` | yes | `T01`. |
| `type` | yes | Free text, in the register's own language. |
| `weight` | yes | `major` or `minor`. Absent counts as minor. |
| `episode` | yes | The single source of truth for pacing. Episodes do not list their own turns. |
| `setup` | yes | What is in place beforehand. |
| `payoff` | yes | What actually lands. |

Rules the gates enforce: turns no more than `maxTurnGap` episodes apart, no dead run at the head
or the tail, at least one major turn, and the earliest major turn not saved for the finale.

## `episodes`

| Field | Required | Notes |
|---|---|---|
| `ep` | yes | Numbered from 1, continuous. |
| `synopsis` | yes | **Narrative prose.** Quoted dialogue means the script is being written two stages early. |
| `hook` | yes | What holds someone through the first seconds. |
| `cliff` | yes | What makes them tap the next episode. |
| `environmentIds` | yes | Must exist. Every registered environment must be used at least once. |
| `characterIds` | yes | Must exist. Every registered character must appear at least once. |
| `propIds` | no | Must exist where present. Every registered prop must be carried at least once. |
| `blockingPlan` | conditional | Required when more than `maxOnScreen` characters appear. |
| `warnings` | yes | Declared generation traps. May be empty, but the key must exist. |

**`blockingPlan` is judged by character count, which is a proxy.** If three characters appear in
an episode but never share a frame, write that as the plan: "all three appear, never together,
shot in separate scenes." That passes, and it is true.

**`warnings` is a declaration, not an accusation.** The gate scans the synopsis for known
generation traps (rain, water, crowds, hands, contact, fire, reflections, eating, on-screen text)
and fails when a hit is undeclared. Declaring it is the fix. It over-reports on purpose.
