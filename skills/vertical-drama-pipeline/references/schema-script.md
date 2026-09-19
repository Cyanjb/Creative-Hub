# `script.json`

The single artifact of stage 4. One file covers an episode range, normally three episodes.

```json
{
  "source": "Tidewrack",
  "profile": "vertical-microdrama",
  "episodes": [
    {
      "ep": 1,
      "targetSeconds": 75,
      "hook": "...",
      "cliff": "...",
      "turnsClaimed": ["T01"],
      "hookBeat": [1, 1],
      "scenes": [ ... ]
    }
  ]
}
```

Produce it with `seed`, never by hand:

```bash
node {baseDir}/scripts/pipeline.mjs seed script <outline.json> --eps 1-3 > script.json
```

The seed carries down `targetSeconds`, `hook`, `cliff` and `turnsClaimed`, plus a `seedNote`
holding the synopsis, the candidate cast, environments, props, the blocking plan and the
warnings. **Those facts are settled. Do not think them through again.** Delete `seedNote` once
the episode is written.

## episode

| Field | Required | Notes |
|---|---|---|
| `ep` | yes | Matches the outline. |
| `targetSeconds` | yes | Seeded from `params.secondsPerEpisode`. The runtime gate measures against it. |
| `hook` | yes | The description. Not the beat. |
| `cliff` | yes | The description. Not the beat. |
| `turnsClaimed` | yes | Turn ids. May be empty, but the key must exist. |
| `hookBeat` | yes | `[scene, beat]`, **1-indexed**, claiming where the hook physically lands. |
| `scenes` | yes | In playing order. |

### `hookBeat`

A hook description with no claimed location produces the failure where the hook says one thing
and the opening shoots another. The gate resolves the coordinate to a position counted **from the
top of the episode across all scenes**, and fails if it is past `hookWindow` (three by default).

**It checks position, not meaning.** Insert a beat above the hook and the claim silently slides
onto the wrong beat while still passing. Re-point `hookBeat` whenever the opening changes.

## scene

| Field | Required | Notes |
|---|---|---|
| `environmentId` | yes | `E01`. Reconciled against the outline when one is supplied. |
| `lighting` | no | Free text now. Becomes a reconciled field once `world.json` exists. |
| `characterIds` | yes | Who is in this scene. A speaker must be in here or be `VO`. |
| `propIds` | no | Reconciled against the outline. |
| `flow` | yes | The beats, in order. |

## beat - exactly one of two things

**Action beat:**

```json
{ "action": "She stops, sets her feet, and hauls the crate up onto the sill." }
```

**Dialogue beat:**

```json
{ "speaker": "C01", "line": "That one clears the week.", "delivery": "flat, already sure of it" }
```

| Field | Notes |
|---|---|
| `action` | Narrative prose, one thing happening. **No quoted dialogue.** Mixed beats cannot be timed, cannot be fed to a TTS engine, and cannot be claimed by a shot. |
| `speaker` | A character id from this scene, or `"VO"`. Whose voice-over it is goes in `delivery`. |
| `line` | The words spoken. At most `maxLineWords`. |
| `delivery` | Tone, subtext, what the body is doing under it. Optional, worth writing every time. |
| `allowPrecision` | Escape hatch on an action beat. A **stated reason** why a flagged precision trap is being kept. An empty string is not a reason. |

A beat that is both is rejected. A beat that is neither is rejected.

## Runtime maths

Deterministic, from the format profile:

- **Dialogue seconds** = word count divided by `wordsPerSecond` (2.5 by default).
- **Action seconds** = `actionBeatSeconds` per beat (2.0 by default).
- **Episode estimate** = the sum, which must land inside `targetSeconds × (1 ± tolerance)`.

At the defaults: **a 75-second episode is roughly 34 to 38 beats.** A 60-second episode is
roughly 27 to 31. Know the target before writing, not after correcting.

```bash
node {baseDir}/scripts/pipeline.mjs stats <script.json>
```

**`wordsPerSecond` is inherited, not measured.** It comes from the `screenwriter` skill's 150
words per minute and has never been checked against a real TTS render of this material. Until it
has, the tolerance band is a band around a guess. Say so if runtime is the subject.

## ID discipline

Characters, environments and props are stored as ids and shown as names. The renderer resolves
them when given `--outline`. Data holds the id, the reading view shows the name.
