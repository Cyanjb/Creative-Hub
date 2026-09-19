---
name: vertical-drama-pipeline
description: >
  Run a vertical micro-drama series from intake to locked script: the episode grid, the cast,
  the world, and the script with real computed runtimes. Three ways in at stage 0 (a finished
  story, a premise only, or an existing outline for a health check), one shared pipeline after
  that. Quality is enforced by a validator script rather than by instructions, with 23 gates
  across the two stages that are built. Use whenever the work is a multi-episode vertical drama
  or micro-drama series: "start a drama series", "episode grid", "micro-drama", "vertical
  series", "check this outline", "drama health check", "write episode 3", "how long does this
  episode actually run". Also use when an outline already exists and the user wants it audited
  rather than extended. Do NOT use for a single video however elaborate (production-bible-builder),
  a one-off cinematic shotlist (cinematic-shotlist-director), the storyboard sheet or the final
  engine prompt (storyboard-to-video-workflow, video-prompt-director), or emotional intent
  (ai-director, which this skill calls rather than replaces).
---

# Vertical Drama Pipeline

Owns the **structure** of a vertical micro-drama series, the **data** that connects its stages,
and the **validators** that refuse to let a stage pass with a structural fault in it.

It does not own craft decisions that already have owners. It calls them.

`{baseDir}` is this file's directory. The script is `{baseDir}/scripts/pipeline.mjs`. Zero
dependencies, Node 18 or later, standard library only.

## Boundaries

| This skill decides | Another skill decides |
|---|---|
| How many episodes, how long, what happens in each | What a scene should feel like (`ai-director`) |
| The cast, the world, the props, the style lock, as data | Character and outfit image prompts (`banana-pro-director-20`) |
| The script as timed beats with computed runtimes | The final Seedance prompt (`video-prompt-director`) |
| Which turns land where, and whether the script claims them | The storyboard sheet (`storyboard-to-video-workflow`) |
| Whether any of it actually passes | What a generation costs (`credit-watch`) |

**The boundary test: does the request name episodes?** Episodes means this skill. One video,
however elaborate, means the others.

## What is built, and what is not

| Stage | File | Gates | Status |
|---|---|---|---|
| 1 outline | `outline.json` | 12 | **built** |
| 2 cast | `cast.json` | 8 | not built |
| 3 world | `world.json` | 8 | not built |
| 4 script | `script.json` | 11 | **built** |
| 5 shots | `shots.json` | 14 | **blocked**, see below |

The shots stage is deliberately absent. Its whole three-layer model assumes the video engine
honours in-prompt cut timing inside one generation, which is unverified on Seedance. Until
one three-cut test answers that, hand the locked script to `storyboard-to-video-workflow` and
`cinematic-shotlist-director` as you would today. Say this plainly if asked, rather than
improvising a shots stage.

Cast and world stages are not built yet either. Their fields can be written by hand against the
schemas and nothing downstream breaks, because every cross-stage gate skips cleanly when its
input is absent and says so.

---

## Stage 0 - intake ⛔ ask once

One question at the top: **what have you got?**

```
A  a finished story      a script, a novel, a treatment, anything written
B  a premise             an idea, a character, a vibe
C  an existing outline   already structured, wants it checked
```

Do not ask if it is obvious. A pasted 40-page document is A. "I've got this idea about..." is B.
A pasted episode grid is C.

Read `{baseDir}/references/intake.md` and follow the path. **Path B is the deepest and the one
used most.** It asks one consolidated question block, proposes the series back in a single
paragraph, then hands off to `ai-director` for the intensity arc **before any structure locks**,
and converts that arc into the turn schedule.

**Stage 0 writes `outline.json` and then disappears.** Nothing downstream may know, ask, or
behave differently based on which door was used. If a later stage needs to know, the wrong thing
went into `outline.json`.

---

## Stage 1 - outline

Read `{baseDir}/references/outline-pass.md` and `{baseDir}/references/schema-outline.md`.
Produce `outline.json`.

Two rounds, with an approval gate between them:

1. **Fast round.** Fill the roster, the world, the props and the turn schedule. Pass the gates.
   Stop. Put exactly three decisions to the user: what got cut, who got merged, which episode
   carries the major turn.
2. **Detailed round.** Absorb the notes, write the per-episode synopses in batches of no more
   than six, pass the gates again.

Getting it wrong in round one costs one skeleton. Getting it wrong after the synopses costs
everything.

```bash
node {baseDir}/scripts/pipeline.mjs validate <outline.json> --stage outline
```

Twelve gates, all code: cast caps by tier, environment cap scaled to episode count, prop cap
with a stated function each, turn spacing with no dead head or tail, a major turn that is not
saved for the finale, every `ai-director` peak covered by a turn, all three episode fields
present, narrative register with no quoted dialogue, complete references with nobody unemployed
and nothing unused, a blocking plan whenever more than two characters share an episode,
generation traps declared in warnings, and the other-lock.

**Fix every violation and re-run until it passes.** Do not argue with a gate; change the outline
or change the profile.

---

## Stage 4 - script

Seed first. Never re-derive what the outline already settled.

```bash
node {baseDir}/scripts/pipeline.mjs seed script <outline.json> --eps 1-3 > <workdir>/script.json
```

The seed carries down the target runtime, the hook, the cliff, the turns this episode must claim,
and the candidate cast, environments, props and warnings as a `seedNote`. `scenes` stays empty.
That is the only genuinely new work.

Then read `{baseDir}/references/script-pass.md` and `{baseDir}/references/schema-script.md` and
write the beats. **Default batch is three episodes.** The script is the most-rewritten layer in
the pipeline, so write small, get a decision, move on.

```bash
node {baseDir}/scripts/pipeline.mjs stats <script.json>
node {baseDir}/scripts/pipeline.mjs validate <script.json> --stage script --outline <outline.json>
```

Eleven gates: a configuration coherence check that runs first, episode runtime within tolerance,
line length, speaker legality, hook and cliff on paper, the hook located within the opening
window, at least one action beat per scene, action register, precision traps, turns claimed, and
reconciliation against the outline.

Delete `seedNote` when the episode is written.

**When an episode is over**, cut action beats first and compress dialogue second. **When it is
under**, add conflict, never add pleasantries.

---

## Health-check mode (Path C)

Runs gates. **Generates nothing. Ever.**

```bash
node {baseDir}/scripts/pipeline.mjs checkup <outline.json> --stage outline
```

`checkup` never exits non-zero and never blocks on a failure, because the report is the point.
It may say a gap exists. It may not fill it. Fixing is a separate, explicit request.

Data that is absent reads as absent, not as failing. Do not invent a field to make a gate green.

---

## The format profile

Every threshold lives in one block at the top of `pipeline.mjs`. Nothing below it is hardcoded.

```bash
node {baseDir}/scripts/pipeline.mjs profile vertical-microdrama
```

The default is `vertical-microdrama`: 9:16, two on screen, 2.5 words per second, 2.0 seconds per
action beat, tolerance 15%, ten words per line, hook inside three beats, turns no more than two
episodes apart.

A second format later (a commercial series, a YouTube run) is a new entry in that object, not a
fork of this skill and not a rewrite. A single project can override values through
`params.overrides` in its own file.

**One number needs your attention.** `wordsPerSecond` is 2.5, inherited from the `screenwriter`
skill's 150 words per minute. It has never been measured against a real TTS render of this
material. Until it has, the tolerance band is a band around a guess. Say so when runtime is the
subject.

---

## Rendering

```bash
node {baseDir}/scripts/pipeline.mjs render <outline.json> --stage outline --md
node {baseDir}/scripts/pipeline.mjs render <script.json>  --stage script --md --outline <outline.json>
```

Markdown is **generated, never edited by hand.** An edit to the rendered file is lost on the next
render. Data holds the id, the reading view shows the name.

---

## What the gates cannot do

Say this out loud rather than letting it be discovered.

- **`hook-located` checks position, not meaning.** It proves the hook is claimed inside the
  opening window. It cannot tell whether the claimed beat is the hook. Insert a beat above it and
  the claim silently slides onto the wrong beat. Re-point `hookBeat` whenever the opening changes.
- **`common-action` is narrow on purpose.** It catches three named traps. It is not a general
  judge of whether a video model can render an action. The craft rules in `script-pass.md` do
  that work and no gate enforces them.
- **`other-lock` checks that anchors are specific, not that they are good.** Three vivid anchors
  that do not cohere into one creature will pass.
- **`risk-flags` over-reports by design.** A hit is a prompt to declare the risk, not an
  accusation. Declaring it is the fix.

## Boundaries (what this skill does not do)

No image, video or audio generation. No engine prompts. No storyboard sheets. No lip sync. No
editing or assembly. No second Emotion Card system; it calls `ai-director`. No interface
localisation; English in, English out.

## Self-test

```bash
node {baseDir}/scripts/selftest.mjs
```

188 assertions, no model called, no quota spent. **Every one of the 23 gates has a breach case**
proving it blocks, because a gate with only a passing fixture is an assertion that a gate exists
rather than a promise that it works. Run this after changing the script.

## Bundled example

`{baseDir}/examples/tidewrack-outline.json` and `tidewrack-script.json`. An original six-episode
series written for this skill, four characters, three environments, two props, three turns, all
23 gates passing. It doubles as the self-test fixture. The story was settled before any of it was
written down, which is the order that keeps a fixture from being three versions of one picture
with different motives bolted on.
