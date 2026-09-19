# Writing the script

One task writes one episode. You get the seeded skeleton, the synopsis, the turns this episode
must claim, and the previous episode's cliff. You fill `scenes`.

## Hard rules

### 1. The runtime budget comes before everything

The target is a wall. Dialogue runs at `wordsPerSecond`, action at `actionBeatSeconds` per beat.
At the defaults, **a 75-second episode is roughly 34 to 38 beats.** Know that before writing.

Check as you go:

```bash
node {baseDir}/scripts/pipeline.mjs stats <script.json>
```

**Over: cut action beats first, compress dialogue second. Under: add conflict, never add
pleasantries.** A scene of people being polite to each other is the standard way an underweight
episode gets padded, and it is worse than a short episode.

### 2. One beat is one thing

An action beat or a dialogue beat. Never both, never neither. The gate rejects both cases.

This separation is the foundation everything else stands on. A mixed beat cannot be timed, cannot
be handed to a TTS engine, and cannot be claimed by a shot.

### 3. Lines are short

At most `maxLineWords`, ten by default. Derived, not arbitrary: it is the most words that fit the
longest permitted cut. A longer line cannot be shot in one piece.

Vertical dialogue is punchier than screen dialogue anyway. If a line will not fit, it is usually
two lines with a reaction between them, which is better.

### 4. Actions are common ones

This will be performed by a video model, and it performs what it has seen a million times.

| Written as | What generates |
|---|---|
| The load strikes the gunwale, he blocks it with a thrust of the pole, the crate settles into the hold | Three objects interacting at speed. It will fail. |
| He carries the load aboard, she lends a hand and sets it down in the hold | Carry, assist, set down. All common. |

**Safe:** boarding, sitting, standing, handing something over, nodding, turning back, holding
something tightly, hauling, walking away, opening, closing, putting down.

**Rewrite or cut:** using a tool to block something, micro-expressions, movements measured in
inches, metaphorical images, several objects interacting at once.

**The dramatic information comes from the combination and the timing of common actions, not from
the intricacy of any one action.** The Harbourmaster closing a ledger and holding it against his
chest carries the scene. Nothing in it is hard to render.

The `common-action` gate catches three named traps and no more. It is narrow on purpose, because
a noisy gate gets switched off. The rest of this rule is discipline, not enforcement. If a flagged
beat has been tested and does render, keep it with `allowPrecision` and a stated reason.

### 5. Every scene has an action beat

A scene of pure dialogue is a radio play. There is nothing for the picture to do.

### 6. The hook is the first beat, and it moves

Cold open. The hook's physical form lands inside the first `hookWindow` beats, claimed by
`hookBeat`.

**It has to be given in motion.** A subject moving, not a still detail. Running through the
drained channel with a crate is a hook. Knuckles white on a rope is a dead frame; save the still
for the second landing.

The gate checks position. **It cannot check that the beat it points at is the hook**, and it
cannot check for motion at all. Re-point `hookBeat` whenever the opening changes, because
inserting a beat above it slides the claim silently onto the wrong beat.

Pick up the previous episode's cliff in the opening. Picking it up is not the same as resolving
it.

### 7. The last beat is the cliff

A sentence not finished, an action not explained, a number that does not add up. `cliff` is the
description; the final beat is the thing itself.

### 8. Claimed turns have to be performed

Every turn in `turnsClaimed` needs a run of beats actually delivering it. A turn is played, not
summarised. The gate checks the claim exists; only you can check the scene earns it.

## Revision discipline

### Change one beat, read three

After changing any beat, re-read the beat before and the beat after, checking three things:

- **where the character physically is**
- **what is in their hands**
- **who else is present**

While writing, spatial state is in your head. While editing, it is not. Reading the neighbours is
the only way to get it back, and position errors introduced by a single-beat edit are the most
common continuity fault there is.

### Change the picture, change the sound

When an action changes, the sound that goes with it changes too. This matters more than it
sounds: on an engine that generates audio in the same pass, **a sound description is an action
instruction.** Leave a bell clash in the ambience after removing the bell and the model will
generate the clash.

Nothing in this stage holds sound yet. The habit belongs here anyway, because this is where the
action changes.

### Renumber the claims

Inserting or deleting a beat moves every index after it. `hookBeat` is the one that silently
survives being wrong. Check it after any structural edit.

## Feel, not enforced

- **Short lines, dense action.** Two or three lines, then something happens. Four consecutive
  lines of dialogue is flat.
- **Subtext in `delivery`.** "Says one thing, body says another" belongs there. A line that says
  its own subtext out loud has none.
- **Voice-over sparingly.** Two or three per episode at most. It earns its place at the moment of
  mismatch between the surface and what is underneath, and nowhere else.
- **Changing location is free, attention is not.** Generating a new environment costs nothing,
  but every change makes the viewer rebuild where they are. Four locations in seventy-five
  seconds is worse than one location with the screws tightened.
- **Names sound like people.** A character's speech should be recognisable with the name covered.
  Read a scene with the labels hidden and see whether you can still tell who is talking.
