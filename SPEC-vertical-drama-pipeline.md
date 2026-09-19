# Spec: `vertical-drama-pipeline`

A vertical micro-drama production pipeline for Cyan's stack. English output. Three doors in, one road out.

Date: 2026-09-19
Status: **specification only. No code exists and none should be written from this document until the open questions in section 13 are answered.**
Companion document: `GAP-REPORT-shuohao-vs-creative-hub.md`

---

## 1. What this skill is, and what it is not

It owns the **structure** of a vertical micro-drama series: the episode grid, the cast, the world, the script with real timings, and the shot list. It owns the **data** that connects those stages, and the **validators** that refuse to let a stage pass with a structural fault in it.

It does not own craft decisions that already have owners. It calls them.

| It does | It does not |
|---|---|
| Decide how many episodes, how long, and what happens in each | Decide what a scene should feel like (`ai-director`) |
| Hold the cast, the world, the props and the style lock as data | Write character or outfit image prompts (`banana-pro-director-20`) |
| Write the script as structured beats with computed durations | Write the final Seedance video prompt (`video-prompt-director`) |
| Cut the script into segments and cuts with real numbers | Write the storyboard sheet prompt (`storyboard-to-video-workflow`) |
| Design voices and produce the line book | Quote or log credits (`credit-watch`) |
| Run every gate and report every failure by exact location | Assemble or colour-match the edit (`ai-footage-recut`) |

**The one-sentence boundary:** this skill decides *what happens, when, for how long, and with whom*; the prompt skills decide *how it is written for the engine*.

### Name and triggers

Proposed name: `vertical-drama-pipeline`.

Deliberately not `*-director`. There are already four of those (`ai-director`, `video-prompt-director`, `cinematic-shotlist-director`, `banana-pro-director-20`) and a fifth would make routing worse for both a model and for you.

Triggers to claim: vertical drama, micro-drama, microdrama, short drama, vertical series, episode grid, drama pipeline, drama bible, episode outline, drama health check, shot list from script.

Boundaries to write into the description, because these are the four skills it sits closest to:

- **Not `production-bible-builder`.** That skill builds a Craft-based pre-production foundation for a **single video**: one ad, one music video, one short film. This one runs a **multi-episode series** and holds its state in files rather than documents. If the user says "one video" or "one film", hand off. If they say "episodes" or name an episode count, this skill owns it.
- **Not `ai-director`.** That skill decides emotional intent. This one calls it (see Path B, step 3) and consumes the result. It never re-derives an Emotion Card itself.
- **Not `cinematic-shotlist-director`.** That skill turns a supplied script or treatment into a one-off cinematic shot list, with transition design as its centre of gravity. This one produces shot lists as one stage of a longer chain, driven by beat coverage rather than by transitions. If there is no episode structure, use that one.
- **Not `storyboard-to-video-workflow`.** That skill owns everything from the storyboard sheet onward. This skill's last stage hands it a locked shot list and stops. Overlap is a bug.

Expect to tune these in the first week of real use. Skill boundaries never survive first contact exactly as written.

---

## 2. Design constraints

### 2.1 The "other" constraint is a lock, not a vibe

The concept is deliberately otherworldly: not-quite-human characters and settings, so that the work does not compete with or displace human micro-drama actors.

That positioning is a genuine advantage (no likeness rights, no displacement, wider visual freedom) and it is also **exactly the kind of intention that evaporates under generation pressure.** "Otherworldly" is an adjective. Adjectives do not survive contact with an image model, which will happily render a normal human and call it mysterious.

So it becomes a structural rule with a gate behind it, called the **OTHER-LOCK**:

- Every character in `cast.json` carries at least **three specific, physical, non-human anchors.** Physical means a thing you can point at in a rendered frame: the proportion of a limb, a surface that is not skin, an eye without a visible sclera, a joint that bends the wrong way, a colour no person has, a feature that repeats where a human has one. Not a mood, not an origin story, not "ethereal".
- A vagueness ban list sits in the skill's references, and the gate fails an anchor that matches it. Starting list: ethereal, otherworldly, mysterious, haunting, unearthly, ancient, timeless, alien (unqualified), uncanny, dreamlike, luminous (unqualified), not-quite-human. These are conclusions, not descriptions. If the anchors are right, the reader reaches the conclusion without being told.
- The same lock applies to the world. Every environment carries at least one anchor that could not exist in a photograph of a real place.
- The style formula, per `ai-director` §3.1, carries one clause naming the register of the otherness, locked once and pasted everywhere.

**The craft tension you need to know about before you build this.** Generation models are strongest on actions they have seen a million times, which is the common-action principle stolen from shuohao (gap report S13). Non-human characters performing non-human actions is the combination most likely to break. The working hypothesis in this spec, which is **a hypothesis and not a tested fact**, is:

> Make the **body** strange and the **behaviour** ordinary. A creature boarding a boat, sitting down, handing something over, turning back, holding something tightly. The strangeness carries in the design, which the reference images lock. The motion stays in territory the model can render.

Test this before committing to a full series. It is open question 3 in section 13.

### 2.2 Vertical shot discipline

Hard rules, all parameterised so you can override them, all defaulted for 9:16:

- **Aspect ratio is 9:16 everywhere.** The storyboard sheet, the panels, the frames, the final render. `poker-fish-prompts` already learned this the hard way, including the correction dated 2026-08-16 about the contact sheet also being vertical. That lesson carries over.
- **Two people in frame, not three.** Their storyboard gate caps on-screen characters at 3. Vertical is a narrower frame and 3 is already crowded. Default cap is **2**, and a third requires a written blocking note explaining how the frame handles it.
- **Cuts are short.** Default band 1.5 to 4.0 seconds, target around 2.5. Their 2 to 5 second band with a 3 second target is for a wider frame and a slower breath.
- **Safe area.** The top and bottom of a vertical frame belong to platform interface. The frame prompt for every cut declares the aspect ratio and carries a safe-area clause keeping the load-bearing subject out of the top and bottom bands. Default 12%.
- **Every episode opens on motion.** The located-hook rule from the gap report (S12), plus the craft rule that the hook must be a moving subject and not a still insert.

### 2.3 Everything downstream is path-blind

The three intake doors converge on one file. This is a hard architectural rule, not a preference:

> **Stage 0 writes `outline.json` and then disappears. Nothing downstream is permitted to know, ask, or behave differently based on which door was used.**

If a downstream stage ever needs to know the intake path, that is a sign the wrong thing went into `outline.json`, and the fix belongs in Stage 0.

---

## 3. Architecture: the spine

Five files per project, one per stage. Each is the single artifact of its stage. Readable documents and review pages are rendered from them and never edited by hand.

```
<project>/
├── outline.json      what happens: episodes, turns, cast roster, world roster, props
├── cast.json         who: character design, anchors, other-lock, voice
├── world.json        where and with what: environments, lighting states, props
├── script.json       the drama: scenes, beats, dialogue, computed durations
└── shots.json        how it is shot: segments, cuts, frames, binding maps
```

Three rules hold the spine together.

**Rule 1: the model fills the JSON, nothing else.** Markdown for reading and HTML for review are both generated. If a human edits the Markdown, that edit is lost, and this must be said out loud in the skill so nobody is surprised.

**Rule 2: each stage seeds from the one above it.** Every stage ships a `seed` operation that mechanically copies settled facts down and leaves only the genuinely new work blank. The facts that move are not re-derived by a model. From the gap report S4, and it is the entire fix for the handoff drift you have now.

What each seed carries:

| Seed | Carries down | Leaves blank |
|---|---|---|
| outline → cast | id, name, tier, arc, role, merged-from note | anchors, other-lock, appearance, voice, image prompts |
| outline → world | environment ids, names, which episodes they appear in, which turns they carry, prop ids and dramatic functions | anchors, lighting states, scale bands, image prompts |
| outline → script | target seconds per episode, hook, cliff, the turns this episode must claim, candidate scenes and characters | the actual scenes and beats |
| script → shots | the full beat list per scene, each beat's computed seconds, speaker, kind | the segment and cut structure |

**Rule 3: a downstream stage may never re-decide an upstream fact.** If the outline says 90 seconds, the script does not get an opinion. If the script says three characters are in the scene, the shot list cannot add a fourth. Disagreement means going back up and changing the source, which then invalidates downstream work loudly rather than quietly. The reconciliation gates (section 7) are what make "loudly" possible.

**IDs.** `C01` for characters, `E01` for environments, `P01` for props, `T01` for turns, `E01-01` for segments. Stored in data, rendered as names in every human-facing view. From their `novel-script/references/schema.md`: data holds the id, the interface shows the name.

---

## 4. Stage 0: three-way intake

One question at the top, asked once, never as an interrogation: **what have you got?**

```
A  a finished story      script, novel, treatment, anything written
B  a premise             an idea, a character, a vibe
C  an existing outline   already structured, wants it checked
```

If the answer is obvious from what was pasted in, do not ask. A pasted 40-page document is Path A. "I've got this idea about..." is Path B. A pasted episode grid is Path C.

---

### Path A: finished story

For when there is a real document to adapt.

1. **Land the text as a file.** Pasted text gets written to a `.txt` first, because verbatim evidence checks (step 4) need a source to compare against, and a chat message is not a source.
2. **Chunk it.** Split on chapter headings where they exist, on length where they do not. Report the chunk count and say out loud if the tail was truncated rather than silently dropping it.
3. **Extract per chunk**, in parallel where the environment supports it: plotlines (organised by line, not by chapter, because the line is the adaptation unit), characters with every name and nickname they are given, candidate dramatic turns, and locations where something actually happened.
4. **Every extracted turn carries verbatim evidence.** A quoted fragment of the source, copied exactly, never paraphrased and never translated. This is the mechanism that stops an adaptation being invented from the title. A gate checks that the evidence string appears in the source file character for character.
5. **Merge the character roster.** Exact-match merge on names and aliases, then surface containment candidates ("Lu" is contained in "Lu Xingyuan") as **candidates for you to confirm, never as automatic merges.** Same surnames catch fathers and sons. You also spot merges that containment cannot see, and those go in by hand.
6. **Cut, merge, then build the grid.** Then join the shared road at Stage 1.

Volume ceiling is declared and enforced. When the material exceeds it, the skill says so explicitly rather than quietly processing a prefix.

---

### Path B: premise only. **The strongest path.**

This is the one you will use most, so it gets the most design. Its job is to get from a vibe to a locked structure without either interrogating you for twenty minutes or inventing a story on your behalf.

**B.1 One consolidated question block.** Never serial. Both `ai-director` Phase 0 and shuohao's Step 0 independently landed on this rule, and they are right. Three questions have no sensible default and must be asked:

- **Episode count and episode length.** These set every downstream number.
- **The premise in your own words.** However rough.
- **Register.** Not "genre" in the platform sense. What the drama runs on: longing, revenge, dread, a bargain, a secret, a debt, a transformation. This determines what a turn *is* in this series, and guessing it wrong wastes the whole grid.

Four more are offered with defaults stated, answerable with a shrug:

- Who or what is the "other" here, and how far from human (default: ask for one sentence, then propose three options)
- Whose story is it and what do they want (default: derive a proposal from the premise, show it, let you correct it)
- Where does it happen (default: propose two or three environments from the premise)
- Anything already locked, a character, an image you have already generated, a scene you want kept (default: none)

**B.2 Propose before you build.** Take the answers and write back a single short paragraph: this is the series I think you are describing. One paragraph, not a document. Wrong premise caught here costs one paragraph. Wrong premise caught after the episode grid costs the grid.

**B.3 Hand off to `ai-director` before any structure locks.** This is the integration you asked for and the order matters.

`ai-director` produces, for the series as a whole:
- The 10-point intensity arc across the full run (its §1.2 curve: Hook, Setup, Build, Peak, Turn, Button)
- An Emotion Card per major movement: surface emotion, true emotion, intensity, arc position, and what the audience should feel
- The placement of **the Turn**, which `ai-director` defines as one hard stop from peak energy to stillness, used exactly once

**B.4 The arc becomes the turn schedule.** This is the conversion step, and it is the part that makes the handoff real rather than decorative:

> The 10-point intensity curve is sampled across the episode count. Each local peak becomes a candidate turn with a weight. `ai-director`'s Peak becomes the series' major turn. `ai-director`'s Turn becomes a structural requirement on the episode where it lands. Intensity values drive the `weight` field on each turn, which the turn-spacing gate then enforces.

The emotional design is doing structural work, not sitting in a document being admired. If the arc says episode 7 is a peak and the grid has nothing in episode 7, the gate fires.

**B.5 Only now: cast, world, episode grid.** With the arc fixed, fill the roster, the environments, the props (selected against the collapse test), and the per-episode synopses.

**B.6 Two rounds, with an approval gate between them.** From their `novel-outline/references/outline-pass.md`:

- **Round one, fast.** Fill all four blocks, pass the skeleton gates, stop. Put exactly three decisions in front of you: what got cut, who got merged, and which episode carries the major turn.
- **You approve or you do not.** Nothing proceeds without it.
- **Round two, detailed.** Absorb the notes, pass the gates again, then write the per-episode synopses in batches.

The reason for the cheap first round, in their words and it is correct: getting it wrong in round one costs one skeleton, getting it wrong after all the synopses are written costs everything.

---

### Path C: health check on an existing outline

**Runs gates. Generates nothing. Ever.**

1. Convert what you have into `outline.json`. Fields that are present get mapped. Fields that are absent get asked about once in a single block, and anything still unknown is explicitly marked missing rather than invented.
2. Run every outline gate.
3. Report.

Three rules define this mode:

- **Failing gates do not block the report.** The report is the whole point. A refusal to render because something failed would be exactly backwards.
- **No generation, no suggestions written into the file.** It may say "episodes 4 through 8 have no turn between them, the gap limit is 2". It may not fill that gap. Fixing is a separate, explicit request.
- **Missing data reads as missing, not as failing.** A gate that cannot run because the field does not exist says "cannot check, field absent". A gate that ran and failed says so. Conflating the two makes the report useless for a partial outline, which is exactly what Path C is for.

Path C is also the **regression harness for the whole skill.** Run it against an outline you already shipped and liked. If it flags things you know are fine, the gates are wrong, and they are cheaper to fix now than after the first real series.

---

## 5. Shared downstream: stages 1 to 5

Identical for all three paths.

### Stage 1: outline

Produces `outline.json`. The episode grid, cast roster with tiers, environment roster, prop list, and the turn schedule.

Per episode: a narrative synopsis, a hook, a cliff, the environments and characters and props used, a blocking plan where three or more characters appear, and a warnings list for generation-difficulty flags.

Register rule: the synopsis is **narrative prose**. Quoted dialogue in a synopsis means the script is being written two stages early, and the gate catches it.

### Stage 2: cast

Seeds from `outline.json`. Produces `cast.json`.

Per character: the settled identity fields carried down, then the design work. Physical anchors (3 to 5, drawable and checkable). The other-lock anchors (at least 3, specific, not on the vagueness list). At least one **asymmetry**, per `ai-director` §3.3, because an asymmetric feature is the single most reliable identity anchor. Appearance, temperament, how they speak. The image prompt and its negatives, carrying the locked style formula. And the voice block (section 8).

Image prompts are not written here. This stage produces the **brief**; `banana-pro-director-20` writes the prompt. The handoff is the character record.

### Stage 3: world

Seeds from `outline.json`. Produces `world.json`.

Per environment: 3 to 5 anchors, at least one of them impossible in a photograph. Lighting states derived backwards from the episodes the environment appears in, not a full day-and-night set that will never be used. An empty-plate image prompt with a no-people negative, because environment and character are two separate asset layers and mixing them destroys both.

Variant mechanism: an environment that appears only once is either cut or declared a variant of a parent, listing only what changed, and reusing the parent's generated plate as a reference. Generating a new environment is cheap. Keeping one more environment consistent for eight episodes is not.

Per prop: selected against the three conditions and the collapse test (gap report S17), a stated dramatic function, 3 to 5 anchors fine enough to survive a close-up, its state variants, a declared scale band whose English phrase appears in the prompt, and a white-background plate with a no-hands negative, because a hand holding the prop is the most common contamination in a plate that has to be composited.

### Stage 4: script

Seeds from `outline.json`. Produces `script.json`. **The stage where the duration math lives.**

Per episode: target seconds, hook, cliff, a `hookBeat` coordinate claiming where the hook physically lands, the turns claimed from the outline, and the scenes.

Per scene: the environment, the lighting state, the characters present, the props used, and a **beat flow**.

A beat is one of exactly two things, never both and never neither:

- An **action beat**: one narrative sentence, one thing happening, no quoted dialogue.
- A **dialogue beat**: a speaker, a line, and a delivery note carrying the subtext.

Everything downstream depends on this separation. Prose that mixes them cannot be timed, cannot be fed to a TTS engine, and cannot be claimed by a shot.

The craft rules for this stage, all lifted from the gap report and all needing to sit in a reference file the writing pass actually reads: duration budget before anything else; common actions only, with the comparison table; short lines and dense action; subtext in the delivery note rather than said out loud; sparing voice-over; every episode's last beat is a cliff; change one beat and read three.

### Stage 5: shots

Seeds from `script.json`. Produces `shots.json`. **The stage where coverage lives.**

Three layers, from shuohao and adjusted for your engines:

- **Segment**: one generation call. Capped by the engine and by a recommended working limit below it.
- **Cut**: one edit inside a segment. 1.5 to 4.0 seconds. Declares which script beats it claims.
- **Frame**: one keyframe per cut. The first pinned at 0.00 seconds, the rest at their cut marks.

Per cut: seconds, claimed beat range, shot size from a controlled vocabulary, camera move from a controlled vocabulary, characters and props in frame, the frame prompt, and the binding map entry.

Per segment: the scene it belongs to, the cuts, the soundscape, and the music direction. A segment never crosses a scene boundary, because one segment means one environment anchor.

The binding map is **yours, not theirs.** `storyboard-to-video-workflow` Part 3 already defines it better than shuohao's equivalent, with an inclusion and an exclusion line per reference. This stage produces it as structured data, and the gate checks completeness: every subject visible in a cut has a bound reference, and every bound reference has both lines.

Handoff: a locked `shots.json` goes to `storyboard-to-video-workflow` for the sheet prompt and the Seedance master prompt. This skill stops there.

---

## 6. Runtime math

The fix for hole 4. All parameters, all overridable, defaults chosen for English vertical drama.

| Parameter | Default | Where it comes from |
|---|---|---|
| `wordsPerSecond` | 2.5 | Your own `screenwriter/timing-and-cutting.md`: 150 words per minute. **Inherited, not measured. Calibrate before trusting it.** |
| `actionBeatSeconds` | 2.0 | Shuohao uses 2.5 for a wider frame and slower cutting. Vertical beats are shorter. |
| `tolerance` | 0.15 | Theirs, kept. ±15% on an episode's target. |
| `maxLineWords` | 10 | Derived: `maxCutSeconds × wordsPerSecond`. A line must fit in one cut. |
| `minCutSeconds` | 1.5 | Vertical attention. |
| `maxCutSeconds` | 4.0 | Vertical attention. |
| `targetCutSeconds` | 2.5 | Guidance for the writing pass, not a gate. |
| `maxSegmentSeconds` | engine-dependent | 15 on Seedance 2.0, 30 on 2.5. See open question 1. |
| `recommendedSegmentSeconds` | 12 | Below the engine ceiling on purpose, because prompt clauses start competing past a few hundred words and your `storyboard-to-video-workflow` already warns about exactly this. |
| `maxOnScreen` | 2 | Vertical frame. |
| `hookWindow` | 3 | The hook must land within the first 3 beats of the episode. |
| `maxTurnGap` | 2 | Episodes between turns. Shuohao uses 3 for 60-episode runs. Short vertical runs need a faster pulse. |
| `safeAreaPercent` | 12 | Top and bottom reserved for platform interface. |

**How a duration is computed:**

- A dialogue beat: word count divided by `wordsPerSecond`. Punctuation and pauses count as time, because they are time.
- An action beat: `actionBeatSeconds` each.
- A scene: the sum of its beats.
- An episode: the sum of its scenes, which must fall inside `targetSeconds × (1 ± tolerance)`.

**A 60-second episode is roughly 22 to 26 beats. A 90-second episode is roughly 34 to 38.** These are derived from the defaults and should be printed in the writing reference so the pass has a target before it starts rather than a correction after.

**The configuration gate.** Because these are all tunable, they can be set to a combination where no valid script exists. One check, run before any content gate: `maxLineWords ≤ maxCutSeconds × wordsPerSecond`. If a ten-word line takes longer than the longest permitted cut, every script will fail and the reason will not be obvious. This is not in shuohao. It is one line and it saves an afternoon.

**When an episode is over or under**, the guidance is theirs and it is good: over means cut action beats first and compress dialogue second; under means add conflict, never add pleasantries.

---

## 7. The gates

Roughly fifty-five checks across five stages. **Do not build them all at once.** Section 12 phases them.

Every gate follows the same shape, stolen from `novel-script/scripts/novel-script.mjs`: a stable id, a human-readable label, a boolean, and a **detail string naming the exact episode, scene and beat that failed.** The detail string is the deliverable. A boolean alone is a shrug.

Every gate has a **breach case** in the self-test: a deliberately broken fixture that proves the gate actually blocks. Shuohao's five skills carry 1,170 assertions between them with one breach case per gate, and that is why their gates can be trusted. A gate with no breach case is an assertion that a gate exists.

### Stage 1, outline (12)

| id | Checks |
|---|---|
| `cast-cap` | Leads 1 to 4, support ≤ 6, functional ≤ 6. Tighter than shuohao because every non-human face is an expensive asset to keep consistent. |
| `world-cap` | Distinct environments within the cap, which scales with episode count. Any single-use environment declares a variant plan or gets cut. |
| `prop-cap` | Tracked props ≤ 6, each with a stated dramatic function. No function means it is not a prop. |
| `turn-gap` | Gap between turns ≤ `maxTurnGap`. No dead zone at the head or the tail. |
| `major-turn` | At least one major turn exists, and the earliest one is not in the final episode. |
| `arc-coverage` | Every peak in the `ai-director` intensity arc has a turn on or adjacent to its episode. **This is the gate that makes the Path B handoff structural.** Skips with a message when no arc was supplied. |
| `ep-fields` | Synopsis, hook and cliff all present on every episode. |
| `narrative-register` | No quoted dialogue in any synopsis, hook or cliff. |
| `refs-complete` | Every referenced id exists. No character who never appears. No environment never used. No prop never carried. |
| `crowd-plan` | Three or more characters in an episode requires a written blocking plan. |
| `risk-flags` | Keyword scan of every synopsis against the generation-trap list; any match must be declared in that episode's warnings. Over-report rather than under-report. |
| `other-lock` | Every character carries ≥ 3 other-lock anchors, and none matches the vagueness ban list. |

### Stage 2, cast (8)

`anchors-count` (3 to 5 per character) · `other-lock-cast` (≥ 3 specific non-human anchors) · `asymmetry` (at least one asymmetric anchor) · `voice-complete` (all six voice fields plus a non-empty English TTS prompt) · `voice-distinct` (no two characters share the same pitch-and-pace pair) · `prompt-nonempty` · `style-lock` (the locked style phrase appears in every image prompt, and the negative list matches the chosen preset rather than contradicting it) · `refs-cast` (ids reconcile to `outline.json`).

`voice-distinct` is mine, not theirs. It is a cheap proxy for the failure where every character is written with the same voice because nobody compared them side by side.

### Stage 3, world (8)

`anchors-world` (3 to 5 per environment, ≥ 1 impossible in a photograph) · `lighting-states` (≥ 1, each a full prompt) · `no-people` (environment plate prompts carry the no-people negative) · `prop-states` (≥ 1 per prop) · `prop-scale` (the declared scale band's English phrase literally appears in the prompt) · `prop-plate` (white background plus a no-hands negative) · `variant-integrity` (`variantOf` points at a real parent and lists what changed) · `style-lock-world` (consistent with `cast.json`).

### Stage 4, script (11)

`duration` (episode estimate inside target ±tolerance) · `line-length` (≤ `maxLineWords`) · `param-coherence` (the configuration gate from section 6) · `speaker-legal` (the speaker is present in the scene, or explicitly voice-over) · `hook-cliff` (both present on every episode) · `hook-located` (`hookBeat` resolves to a real beat and lands within `hookWindow`) · `has-action` (every scene has ≥ 1 action beat, because a scene of pure dialogue is a radio play with nothing to generate) · `action-register` (no quoted dialogue inside an action beat) · `common-action` (keyword scan against the banned-precision list: micro-expressions, tool-mediated interaction, sub-inch movement, metaphorical imagery; overridable per beat with a stated reason) · `turns-claimed` (the turns the outline assigns to this episode are claimed by the script) · `refs-script` (characters, environments, lighting states and props all reconcile upstream).

### Stage 5, shots (14)

`beat-coverage` (**the important one**: every script beat claimed exactly once, in order, contiguously, with the unclaimed or double-claimed beat named) · `segment-cap` (0 < segment total ≤ engine cap, warning above the recommended limit) · `cut-band` (every cut inside min and max) · `dialogue-fit` (claimed line seconds ≤ cut seconds) · `ep-duration` (episode total inside the script target ±tolerance) · `crowd-vertical` (≤ `maxOnScreen` per cut without a written blocking note) · `segment-id` (format and unbroken sequence) · `size-phrase` (the shot size's phrase appears in the frame prompt) · `camera-vocab` (the camera move is in the controlled vocabulary and appears in its own shot's text) · `no-repeat-coverage` (**no two consecutive cuts share the same shot size and angle**; this is `production-bible-builder` Stage 6's sanity check, finally as code) · `style-phrase` (the locked style phrase in every frame prompt) · `binding-complete` (every subject visible in a cut has a bound reference carrying both an inclusion and an exclusion line) · `soundscape-present` (every segment has a non-empty soundscape that does not restate dialogue) · `vertical-frame` (aspect declared, safe-area clause present).

`no-repeat-coverage` is the nicest fusion in this spec: your craft rule, their enforcement mechanism.

### The skip rule

Any gate that depends on an optional upstream file reports **"not provided, skipped, treated as pass"** rather than failing. A validator that fails on a missing optional input gets switched off within a week. A validator that says out loud which checks it could not run stays on, and is what lets someone start at the script with no outline.

---

## 8. The voice layer

The fix for hole 1, and the piece with no precedent anywhere in your current library.

### The voice card, in `cast.json`

| Field | Language | Notes |
|---|---|---|
| `timbre` | English | The grain of it. |
| `pitch` | English | Low, mid, high, or a description. |
| `pace` | English | Speed and where the breaths fall. |
| `accent` | English | Including none. |
| `emotion` | English | The resting emotional state under the voice. |
| `referenceHint` | English | The "sounds like someone who..." line. For you, not for the engine. |
| `prompt` | English | **One field, one version, for the engine.** |
| `voiceId` | opaque | Populated after `create_voice`, so episode two does not recreate the voice. Not in shuohao; added because your engine has persistent voices and theirs does not. |

**Their hard-won rule, worth copying exactly:** the engine prompt gets exactly one version. Shuohao's schema notes that they deliberately removed the readable translated variant of the TTS prompt, because in production someone copied the wrong one and fed prose into the engine. One field, one language, no ambiguity about which one to paste.

**The other-lock applies to voices too.** A not-quite-human character should not default to a human voice with reverb on it. The voice card carries at least one non-human quality that is a described mechanism rather than an effect name: something about how the sound is produced, not which plugin was used on it.

### The line book

Generated from `script.json`. The dialogue regrouped by character instead of by scene.

For each character: the voice prompt at the top, then every line they speak across the batch, in order, each tagged with its episode, scene, beat index, delivery note and computed duration.

This is the artifact that turns a script into a TTS run. It is what you paste into `mcp__Higgsfield__generate_audio_batch` or feed to `mcp__Runway__generate_speech` without hand-assembling anything. Voice-over lines group separately, because they carry no lip-sync constraint and can be generated with different settings.

### The alignment sheet

Generated from `shots.json`. The inverse view: every line mapped to the cut that claims it, so you know which audio file goes under which clip.

Columns: segment id, cut index, cut seconds, character, line, computed line seconds, and slack. Slack is the gap between the line and the cut, and it is the number that tells you whether the delivery has room to breathe or is going to sound rushed. `dialogue-fit` guarantees slack is not negative. It does not guarantee it is comfortable, and seeing the number is how you find out.

### What this layer does not do

Lip sync. Shuohao explicitly declares it out of scope and defers it to the generation pipeline, and that is the right call here too. Seedance generates audio in the same pass; whether generated dialogue or separately generated TTS wins is a production decision per project, not a pipeline decision. The line book supports either, and `video-prompt-director` already owns the in-prompt dialogue route through the `{ }` channel.

---

## 9. Stack mapping

Their pipeline targets MiniMax H3 and codex's built-in image generation. Neither is yours.

| Their layer | Yours |
|---|---|
| MiniMax H3, multi-picture alignment, `[Shot k]` cut marks, `<d>` dialogue blocks | **Seedance 2.5** via `omni_reference` with the binding map from `storyboard-to-video-workflow`, or **2.0** with first-last-frame. The prompt is written by `video-prompt-director`, not by this skill. |
| codex `$imagegen` for character sheets and plates | **Higgsfield MCP** (Banana Pro, Soul Cinema, GPT-2), driven through `banana-pro-director-20`. `generate_image_batch` for a roster run. |
| Nothing | **Runway MCP** for `generate_speech`, `generate_sound_effect`, `generate_music`. **Higgsfield MCP** for `create_voice`, `generate_audio_batch`, `dubbing`. |
| Nothing | **`credit-watch`** pre-flight quote before any batch, reconciliation after. Runs at every generating step, not once at the end. |
| Nothing | **`ai-footage-recut`** downstream: `cutsheet.py` takes the locked cut durations, `qc.py` checks the render. Because durations are now computed rather than estimated, the cut sheet can be generated directly from `shots.json` rather than hand-authored. |
| `report.html` written next to the JSON | **Craft** for the readable bible via `mcp__Craft_Workspace__craft_write`, plus a single-page HTML review artifact for the gate panel. |
| Their `.gates.jsonl` | Deferred. You already have the generation-failure log in `video-prompt-director` Step 0, which is the more valuable half. |

**One structural consequence worth naming.** `credit-watch` plus computed durations gives you something shuohao cannot have: a real cost estimate for an episode **before a single clip is generated.** The shot list knows the segment count and each segment's duration, and `credit-watch` knows the per-second rate. That number is worth surfacing at the end of stage 5, and it is a genuine advantage of building this on your stack rather than theirs.

---

## 10. File layout

```
vertical-drama-pipeline/
├── SKILL.md                      router, the three paths, the stage sequence
├── references/
│   ├── schema-outline.md         outline.json, field by field
│   ├── schema-cast.md            cast.json, including the voice block
│   ├── schema-world.md           world.json, environments and props
│   ├── schema-script.md          script.json, beats and timing
│   ├── schema-shots.md           shots.json, segments, cuts, binding
│   ├── intake-a.md               Path A: chunk, extract, merge, evidence
│   ├── intake-b.md               Path B: questions, ai-director handoff, arc conversion
│   ├── intake-c.md               Path C: health check rules
│   ├── outline-pass.md           cutting, merging, turn placement, prop selection
│   ├── episode-pass.md           writing synopses in batches
│   ├── script-pass.md            writing beats: duration budget, common actions, the hook rule
│   ├── shots-pass.md             segmenting, cutting, vertical rhythm, binding discipline
│   ├── other-lock.md             the anchor rules and the vagueness ban list
│   ├── voice-pass.md             designing voices, the line book, the alignment sheet
│   └── SOURCES.md                what was ported from shuohao, what was written fresh
├── scripts/
│   ├── pipeline.mjs              seed, validate, checkup, render, lines, align
│   └── selftest.mjs              one breach case per gate, calls no model
└── examples/
    └── (your own fixture, written for this project, not theirs)
```

Zero dependencies, standard library only, as theirs is. Node is already on the machine and a skill that needs an install is a skill that stops working.

**Write your own example fixture.** Shuohao's `CLAUDE.md` makes this point and it is correct: a borrowed example is both a broken link (the skill should be copyable whole) and a demonstration of somebody else's genre. It also makes the second point that matters more: **settle the story before writing any shots.** Build the fixture's story first. If you write the shot list first, every later attempt to change the story is just a new motive bolted onto the same picture, and three versions in it is still the same version.

---

## 11. Out of scope

Stated so it does not creep.

- **Writing the final engine prompt.** `video-prompt-director` and `storyboard-to-video-workflow` own that. This skill produces briefs and structured records.
- **Generating anything.** No images, no video, no audio. It produces the material that generation steps consume, and the generating skills already exist.
- **Lip sync.** Section 8.
- **Editing and assembly.** `ai-footage-recut` owns it, and now gets better input.
- **Distribution, titles, thumbnails, platform strategy.** Other skills.
- **A second Emotion Card system.** It calls `ai-director`. It does not reimplement it.
- **Interface localisation.** English in, English out.

---

## 12. Build order

Five phases. Each one is independently useful, which matters because you should stop if a phase does not earn its place.

**Phase 1: the spine, the outline gates, and Path C.**
`outline.json` schema, the outline validator with its twelve gates, `checkup`, and the self-test with a breach case for each. Ships **Path C complete** and Path B as far as the episode grid.
*Why first:* Path C is the cheapest thing to validate against reality. Run it on an outline you already wrote and liked. If it flags things you know are fine, the gates are wrong, and finding that out now costs nothing.

**Phase 2: script and the duration math.**
`script.json` schema, the outline-to-script seed, the eleven script gates, the timing engine. **Closes hole 4.** Calibrate `wordsPerSecond` against a real TTS render during this phase, not after.

**Phase 3: shots and coverage.**
`shots.json` schema, the script-to-shots seed, the fourteen shot gates, beat coverage first. **Closes the drift that hole 3 causes.** Blocked on open question 1, so answer that before starting.

**Phase 4: voice.**
The voice block in `cast.json`, the line book, the alignment sheet, the MCP wiring. **Closes hole 1.** Deliberately fourth, because a line book needs a script with lines in it. It is your most-wanted hole and it still has to wait for its input to exist.

**Phase 5: the rest.**
Cast and world gates, Path A ingestion, the HTML review page with the gate panel, the `credit-watch` integration at stage 5.

Deferred indefinitely, and revisit only if you find yourself asking the question it answers: the gate-failure log and its statistics. Their own note says to ship it on one skill and wait, because a feature nobody opens should not be copied five times. That is the right instinct and it applies here too.

---

## 13. Open questions

Answer these before code. Two of them can change the architecture.

**1. Does Seedance 2.5 honour in-prompt cut timing inside a single generation?**
**This is the one that matters most.** The whole segment-and-cut model assumes an engine that cuts where it is told, which MiniMax H3 does through explicit multi-image alignment. Your `seedance-25-reference.md` says timestamps are supported at one-second granularity and multi-shot is first-class, which is encouraging and is not the same claim. If the answer is yes, a segment is one generation. If the answer is no, the structure is unchanged but a segment becomes an **editing** unit: generate each cut separately, assemble in HyperFrames, and `cutsheet.py` takes over. Both work. They cost very different amounts. **One test with a three-cut segment answers it.**

**2. Seedance 2.0 or 2.5 as the default target?**
It sets `maxSegmentSeconds` (15 or 30), changes whether the binding map uses `@imageN` syntax at all, and changes whether audio is generated in the same pass. Your `video-prompt-director` router already handles this per project. The pipeline needs a default.

**3. Does the "strange body, ordinary behaviour" hypothesis hold?**
Section 2.1. If non-human characters performing common human actions generates cleanly, the action vocabulary from shuohao transfers whole. If it does not, the common-action list needs rebuilding for non-human bodies and that is a real piece of work. Test with one character and three actions before committing to a series.

**4. What is an episode, in seconds?**
The gate maths need a default. 60 seconds, 90, 120? It sets beats per episode, cuts per episode, and the cost per episode. You know the platform norms far better than I do.

**5. Where does a project live?**
Files on disk, a Craft folder, or both. The JSON spine needs a filesystem; the readable bible probably wants to be in Craft where you already work. My assumption is both, with the JSON as the source of truth and Craft as a rendered view. Confirm before the schemas assume a location.

**6. Is `maxLineWords = 10` right?**
It is arithmetic, not taste. Derived from a 4-second maximum cut. It may read clipped. It is a parameter and it is cheap to change, and the first real script will tell you more than this document can.

**7. What is on your generation-trap list?**
The `risk-flags` gate needs the actual keyword list. Yours is scattered across `commercial-pipeline/references/fix-playbook.md`, the Craft failure log, and `poker-fish-prompts`' six card rules. Consolidating it is a half-hour of reading your own notes and it is the highest-value half hour in this whole plan, because it is knowledge you already paid for that is currently only retrievable by remembering.

**8. Do you want this to remain one skill?**
Shuohao split five ways. This spec keeps one skill with five stages, because your library already has a routing skill (`production-bible-builder`) and adding five more triggers to a 44-skill library makes routing worse, not better. If the SKILL.md grows past roughly 400 lines, revisit. The reference files keep most of the weight off the main file by design.

---

## 14. Attribution

Per the gap report section 5. `references/SOURCES.md` carries two lists:

- **Ported from shuohao-skills (Apache 2.0, Copyright 2026 烁皓)**: any function whose structure, logic or comments are recognisably theirs. Likely candidates if they get ported rather than reimplemented: the coverage cursor walk, the `gateReport` scaffold, and the Path A chunking and alias-merge logic. Each gets the Apache notice, a link to the source, and a note on what changed.
- **Independently implemented after reading shuohao-skills**: everything else, which is most of it.

If the first list is empty, **say so explicitly** in the file. That sentence is the whole point of having the file.

Do not ship their sample story or their example JSON. The licence permits it with attribution. It is still their story and it has no place in this.

---

*Specification ends. No code until section 13 questions 1 and 3 are answered.*
