# Five edits to existing skills

From `GAP-REPORT-shuohao-vs-creative-hub.md` items S2, S15, S18, S19 and S20. These are the
steals that are **not** micro-drama-specific, so they belong in the general skills and improve
every project rather than only the drama series.

## Before you start

**Do not apply these in `~/.claude/skills/synced/<bucket-id>/`.** That folder is a synced
snapshot with a `manifest.json` and a bucket marker, which means it is pushed down from your
Claude account rather than authored in place. Edits there get overwritten on the next sync.

Apply them wherever you author these skills, then let the sync carry them down.

Each edit below is an exact find-and-replace. The FIND text is copied verbatim from your current
files as of 2026-09-19. If a FIND block does not match, the file has changed since; re-read the
surrounding section before forcing it.

Three edits touch `production-bible-builder`, one touches `video-prompt-director`, one touches
`banana-pro-director-20`. Two of them share a block, so they are applied together.

---

## Edit 1 - turn Stage 6's sanity check into real checks

**File:** `production-bible-builder/SKILL.md`
**Why:** that sentence already specifies three deterministic conditions and then asks a model to
remember to run them. Two of the three are fully checkable. The third is not, and it should stop
sitting in the same sentence pretending to be.

### FIND

```
Every field traces back to ai-director's decision tables (§1.3) and the Emotion Card for that scene. Run the coverage sanity check before moving on: every beat covered, no two consecutive shots with identical size+angle, eyelines consistent.
```

### REPLACE

```
Every field traces back to ai-director's decision tables (§1.3) and the Emotion Card for that scene.

**Coverage check before moving on.** Run these as three separate passes over the finished table, not as one glance. Report failures by shot number.

1. **Every beat is covered.** Walk the beat sheet from the top. For each beat, name the shot that carries it. A beat with no shot is a hole; a beat with two shots is a decision nobody made. Name both out loud rather than assuming the table is complete.
2. **No two consecutive shots share size and angle.** Compare each row with the one above it. Identical size plus identical angle reads as a jump cut on the same setup. This is the 30-degree rule and it is mechanical: check it, do not eyeball it.
3. **Eyelines are consistent.** This one is a human check and cannot be done from the table alone. It needs the blocking in mind: who is looking at whom, from which side, and whether the camera has crossed the line between two shots. Do it deliberately, and say if you are unsure rather than passing it silently.

Checks 1 and 2 are mechanical and should never be skipped for a short table. Check 3 is judgement and should be flagged as such.
```

---

## Edit 2 - a sound description is an action instruction

**File:** `video-prompt-director/references/seedance.md`
**Why:** the engine generates audio in the same pass, so it reads the SFX line as something that
happens. Leave a sound in place after the action that made it is gone and the model will generate
the action back. Your audio section is strong on direction and silent on divergence.

### FIND

```
### Default audio for hero/static endings
The final shot should usually let the music settle and the SFX thin out. The poster frame is quiet.
```

### REPLACE

```
### Change the picture, change the sound
Audio is generated in the same pass as the image, which means **the SFX line is an action instruction, not decoration.** The model reads a named sound as an event that happens in the shot.

The failure mode: a shot is rewritten, the action changes, the SFX line is left alone. A bell clash still sits in the ambience after the bell has gone from the action, and the model puts the clash back into the picture to justify the sound. The shot now contains something nobody asked for and the cause is two lines apart in the prompt.

So: **whenever a shot's action changes, re-read its SFX line and change it with them.** Treat them as one edit. This applies to revisions more than to first drafts, because a first draft writes both at once and a revision usually does not.

The same logic runs the other way and is useful: naming a sound is a cheap way to get an action. "Chair legs scrape on stone" will produce a chair being pushed back.

### Default audio for hero/static endings
The final shot should usually let the music settle and the SFX thin out. The poster frame is quiet.
```

---

## Edit 3 - objects declare their scale band

**File:** `banana-pro-director-20/SKILL.md`
**Why:** rendering a handheld object at furniture size is a high-frequency accident, and it is
invisible until the object is composited next to a person. Your Mode 3 plates and the
commercial-pipeline product shots both benefit. One phrase in the prompt prevents it.

### FIND

```
13. **Character plates carry biological realism, never photographic capture behavior.**
```

### REPLACE

```
14. **Any object prompted on its own declares its scale band.** An object generated as a reference plate, with no person in frame to size it against, has no scale unless the prompt gives it one. Models put handheld objects at furniture size routinely, and the error is invisible until the object is composited next to a character. Name the band explicitly in the prompt body: **handheld scale** (fits in one hand: a key, a cup, a blade), **tabletop scale** (carried with effort or set down on a surface: a case, a lamp, a crate), **furniture scale** (occupies floor space: a chair, a door, a cabinet). Add a comparison where it is cheap ("handheld scale, roughly the length of a forearm"). This applies to Mode 3 plates that are objects rather than environments, and to any product or prop reference destined to be composited later. It does not apply to prompts that already contain a person, where the body supplies the scale.

13. **Character plates carry biological realism, never photographic capture behavior.**
```

**Note on placement.** This puts the new rule 14 immediately above the existing rule 13, so the
numbering runs 12, 14, 13. Renumber it to sit at the end as rule 14 if you prefer the list in
order; the placement above is just what makes the find-and-replace unambiguous.

---

## Edits 4 and 5 - anchors and variants (one block, applied together)

**File:** `production-bible-builder/SKILL.md`
**Why (edit 4):** "set dressing that recurs" is a maintenance criterion with no quality bar, so
it will collect atmosphere words. You already have the equivalent for characters, and better:
ai-director §3.3's distinctive asymmetries. Locations have nothing.
**Why (edit 5):** generating a new location is cheap, keeping one more location consistent across
a project is not, and nothing currently pushes back on the count.

### FIND

```
- Name, time of day, era
- Lighting logic (see ai-director's lighting table — what's the emotional read of this space?)
- Set dressing that recurs across shots in this location
- What NEVER appears here (style-breaking objects, anachronisms, off-brand elements)

This becomes the World Plate reference source for the shot list and storyboard stages.
```

### REPLACE

```
- Name, time of day, era
- Lighting logic (see ai-director's lighting table — what's the emotional read of this space?)
- **Three to five anchors** (see below)
- What NEVER appears here (style-breaking objects, anachronisms, off-brand elements)

**Anchors are what make a location recognisable across generations.** Three to five per
location, each a physical object or mark, each short enough to sit in a checklist:

> a patched awning over the left third of the frame · the broken seventh step · a brass bell
> gone green at the mouth · a water stain shaped like a hand on the back wall

Not: "an aged atmosphere", "the marks of years", "a sense of neglect". **The test is whether you
can tick it off against a generated frame.** If you cannot, it is not an anchor, it is a mood
word, and it will not survive the first generation. This is the location equivalent of the
distinctive asymmetries in a Character Card (ai-director §3.3), and it does the same job:
identity that a model can hold onto and a human can verify.

**Prefer a variant over a new location.** Generating a new environment costs almost nothing.
Keeping one more environment consistent across a whole project costs real attention, and it costs
it in every shot that environment appears in. So:

- A location appearing in only one scene should be **cut, or declared a variant** of a location
  you already have.
- A variant names its parent and lists **only what changed**: time of day, weather, what is in
  the foreground, what was removed. Everything else is inherited.
- A variant reuses the parent's generated plate as its reference image. That reuse is the entire
  point of the mechanism; a variant generated from scratch is just a second location with a
  misleading label.

As a working ceiling, a short piece supports three or four distinct locations before consistency
starts costing more than the variety is worth. Count variants against their parent, not
separately.

This becomes the World Plate reference source for the shot list and storyboard stages.
```

---

## After applying

Nothing here is executable, so there is no test to run. Three quick checks:

1. Each FIND block should have matched exactly once. If one matched twice, you have a duplicated
   section and should look at why before saving.
2. `production-bible-builder/SKILL.md` should now mention anchors in Stage 4 and carry a numbered
   coverage check in Stage 6.
3. The next time a location, a prop plate or a revised shot comes up in real work, see whether
   the new rule actually fires. A rule that never fires is either already internalised or was not
   worth writing, and both are worth knowing.
