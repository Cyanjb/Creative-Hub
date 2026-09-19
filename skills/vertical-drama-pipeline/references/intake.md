# Stage 0 - the three doors

One question at the top, asked once: **what have you got?**

```
A  a finished story      a script, a novel, a treatment, anything written
B  a premise             an idea, a character, a vibe
C  an existing outline   already structured, wants it checked
```

Infer it where it is obvious. A pasted 40-page document is A. "I've got this idea about..." is B.
A pasted episode grid is C. Asking a question the message already answered is a cost, not care.

**The hard rule.** Stage 0 writes `outline.json` and disappears. Nothing downstream may know,
ask, or behave differently based on which door was used. If a downstream stage needs to know,
something went into `outline.json` that should not have.

---

## Path A - a finished story

1. **Land the text as a file first.** Pasted text gets written to a `.txt` before anything else.
   Verbatim evidence has to be comparable against a source, and a chat message is not a source.

2. **Chunk it.** Split on chapter headings where they exist, on length where they do not. Report
   the chunk count. If the tail did not fit, **say so out loud**. Silently processing a prefix and
   presenting it as the whole is the worst available failure here.

3. **Extract per chunk**, in parallel where the environment supports subagents. Per chunk:
   - **Plotlines**, organised by line rather than by chapter. A chapter is a physical split. A
     line is the adaptation unit.
   - **Characters**, with every name and form of address they are given in that chunk. Cross-chunk
     merging depends entirely on this list being complete.
   - **Candidate turns**, each with verbatim evidence.
   - **Locations where something actually happened.** Mentioned but unvisited does not count.

4. **Evidence is verbatim or it is not evidence.** A quoted fragment copied exactly from the
   source, never paraphrased, never tidied. This is the mechanism that stops an adaptation being
   invented from the title. If a claim cannot carry a quote, it is an impression and it does not
   go in the outline.

5. **Merge the roster.** Exact match on names and aliases first. Then surface containment
   candidates ("Lu" sits inside "Lu Xingyuan") **as candidates for the user to confirm, never as
   automatic merges.** Containment catches fathers and sons, brothers, and any two people who
   share a surname. The user will also spot merges containment cannot see, and those go in by
   hand.

6. **Cut, merge, then build the grid.** Then join Path B at its step 5.

---

## Path B - a premise only

**The deepest path and the one used most.** Its job is to get from a vibe to a locked structure
without either interrogating the user for twenty minutes or inventing a story on their behalf.

### B.1 One consolidated question block

Never serial. Ask everything in one message, then commit.

**Three have no sensible default and must be asked:**

- **Episode count and episode length.** Every downstream number comes from these.
- **The premise, in the user's own words.** However rough.
- **Register.** Not genre in the platform sense. What the drama runs on: longing, revenge, dread,
  a bargain, a secret, a debt, a transformation. This decides what a *turn* is in this series.
  Guessing it wrong wastes the entire grid, which is why it is asked rather than inferred.

**Four more are offered with a default stated, answerable with a shrug:**

- Who or what is the other here, and how far from human. Default: ask for one sentence, then
  propose three options at different distances.
- Whose story is it, and what do they want. Default: derive a proposal from the premise, show it,
  invite correction.
- Where does it happen. Default: propose two or three environments.
- Anything already locked: a character, an image already generated, a scene to keep. Default: none.

### B.2 Propose before building

Write the series back as **one short paragraph**. Not a document. "This is the series I think you
are describing."

A wrong premise caught here costs a paragraph. Caught after the episode grid, it costs the grid.

### B.3 Hand off to ai-director before any structure locks

This order is not negotiable. `ai-director` produces, for the series as a whole:

- The 10-point intensity arc across the full run, using its own beat names: Hook, Setup, Build,
  Peak, Turn, Button.
- An Emotion Card per major movement: surface emotion, true emotion, intensity, arc position, and
  what the audience should feel, which is not the same as what the character feels.
- The placement of **the Turn**, which `ai-director` defines as one hard stop from peak energy to
  stillness, used exactly once in a piece.

### B.4 Convert the arc into the turn schedule

This is the step that makes the handoff structural rather than decorative.

Write the arc into `outline.json` as the `arc` array, one entry per point:

```json
{ "episode": 4, "intensity": 9, "position": "peak" }
```

Then place the turns against it:

- Every arc point marked `peak` or `turn` must have a turn in `turns` on that episode or within
  one episode of it. **The `arc-coverage` gate enforces this.**
- `ai-director`'s Peak becomes the series' major turn.
- Arc intensity drives the `weight` field. High intensity is `major`, everything else is `minor`.

If the arc says episode 7 is a peak and the grid has nothing there, the gate fires. The emotional
design is doing structural work, not sitting in a document being admired.

Omitting the arc is allowed. The gate then skips and says so. A Path B run without it has thrown
away the main reason for the handoff.

### B.5 Then, and only then

Fill the roster, the environments, the props, and the per-episode synopses. Follow
`outline-pass.md` from here.

### B.6 Two rounds with an approval gate

Covered in `outline-pass.md`. Do not skip the approval.

---

## Path C - health check

**Runs gates. Generates nothing. Ever.**

1. **Convert what exists into `outline.json`.** Map the fields that are present. Ask about the
   absent ones **once, in a single block**. Anything still unknown is left absent and named as
   absent. Do not invent a field to make a gate green; that converts a diagnosis into a fiction.

2. **Run the gates.**

   ```bash
   node {baseDir}/scripts/pipeline.mjs checkup <outline.json> --stage outline
   ```

3. **Report.** Three rules:

   - **Failing gates do not block the report.** `checkup` always exits zero. A refusal to render
     because something failed is exactly backwards.
   - **No generation, and no fixes written into the file.** Saying "episodes 4 to 8 have no turn
     between them, the limit is two" is the job. Filling that gap is not, unless asked
     separately.
   - **Missing reads as missing.** A gate that could not run says so. A gate that ran and failed
     says so. Conflating the two makes the report useless for a partial outline, which is exactly
     what this mode is for.

### Path C is also the regression harness

Run it against an outline already shipped and liked. If it flags things known to be fine, **the
gates are wrong**, and they are far cheaper to fix now than after the first real series. Treat a
false positive here as a bug in this skill, not as a note for the user.
