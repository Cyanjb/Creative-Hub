# Gap Report: shuohao-skills vs Cyan's Creative Hub

Date: 2026-09-19
Their repo: `eternityspring/shuohao-skills`, Apache 2.0, read at commit `HEAD` of `main` (shallow clone)
Your skills: 44 folders under `~/.claude/skills/synced/5b6c3f83-.../`, all 42 with a `SKILL.md` read or surveyed

---

## 0. Housekeeping first

### Their selftests run clean on this machine

You asked me to run these before trusting anything. I did, on Node v22.22.2:

| Skill | Assertions | Result |
|---|---|---|
| novel-art | 158 | pass |
| novel-characters | 355 | pass |
| novel-outline | 249 | pass |
| novel-script | 154 | pass |
| novel-storyboard | 254 | pass |
| **Total** | **1,170** | **all pass, exit 0** |

No npm install, no API key, about one second total. The scripts are real and they work. This matters because the whole reason to look at this repo is the claim that quality is enforced by code rather than by prompt text, and the claim holds up.

### I did not run install.sh

Confirmed. I cloned into a scratch directory outside your project and read from there. Nothing was symlinked into your skills folder and nothing of theirs can compete for your triggers.

### One practical warning about editing your own skills

Your skills do not live at `~/.claude/skills/<name>/`. They live at:

```
~/.claude/skills/synced/5b6c3f83-c361-4478-b163-427670c5f122_5f743feb-ae06-407b-ac79-07070a936e1a/<name>/
```

That folder has a `manifest.json` and a `.bucket-<id>` marker, which means it is a **synced snapshot**, probably pushed down from your Claude account rather than authored in place. Every edit in this report names a file inside that folder for precision, but you should make the actual change wherever you author these skills. If you edit the synced copy directly, the next sync may overwrite you.

---

## 1. Your four suspected holes: verdicts

I went looking for evidence to kill each one, not to confirm it. Three survive outright, one survives with exceptions you should know about.

### Hole 1: no voice or TTS layer. CONFIRMED, and it is the cheapest one to close.

What I searched: every `.md` in all 44 skills for `TTS`, `text-to-speech`, `voice-over`, `voiceover`, `elevenlabs`, `voice clone`, `speech synth`. Nine files matched. None of them design a voice.

What you actually have:

- `video-prompt-director/SKILL.md:162` says, flatly: **"No dialogue unless the user explicitly requests it."** That is your default.
- `video-prompt-director/references/seedance.md:213` lists dialogue as item 3 under "Character audio", qualified "(only if explicitly requested)".
- `video-prompt-director/references/seedance.md:412` gives you the Seedance 2.5 bracket syntax: `( )` music, `< >` SFX, `{ }` dialogue, `【 】` subtitles. Then line 415 notes the house rules keep those channels empty anyway.
- `production-bible-builder/SKILL.md` Stage 5b asks for "three voice triggers", each at most three comma-separated qualities ("authoritative, grief, controlled"). That is the closest thing you own to a voice spec, and it exists only inside an optional audition step for a single lead.
- `video-prompt-director/SKILL.md:347` bans "robotic voice, text-to-speech cadence, presenter voice" as negatives. You know what bad TTS sounds like. You have nothing that specifies good TTS.

So you have a **channel** and no **content layer**. There is no per-character voice card, no timbre or pitch or pace or accent spec, no line book, no TTS prompt, and nothing that assigns a spoken line to a specific clip.

The part that makes this the cheapest hole: **the tooling is already connected and authenticated in this session.** Higgsfield MCP exposes `create_voice`, `create_voice_from_confirmed_audio`, `list_voices`, `generate_audio`, `generate_audio_batch`, `voice_change` and `dubbing`. Runway MCP exposes `generate_speech` and `generate_sound_effect`. Nothing in your skill library drives any of them. You are paying for the capability and not using it.

Their implementation to copy is in `novel-characters/references/schema.md`: a `voice` object with `timbre`, `pitch`, `pace`, `accent`, `emotion`, `referenceHint`, and a separate English `prompt` for the TTS engine. They also made one hard-won decision worth stealing outright, stated in that file: the TTS prompt has **no translated version, deliberately**, because in production someone copied the wrong one and fed prose into the engine. One field, one language, no ambiguity.

### Hole 2: no deterministic validators. CONFIRMED for pre-production, but you are not starting from zero.

The exception you should not be talked out of: **`ai-footage-recut/scripts/cutsheet.py` is a genuine deterministic validator.** It authors cut timings in integer frames rather than decimal seconds, derives every start from the previous shot's length, and returns a `problems` list when the durations do not sum to the target runtime or when a shot is under one frame. Its docstring explains exactly why, and it is the same species of thinking as shuohao's gates. `ai-footage-recut/scripts/qc.py` is also real: a black-frame sweep across every frame of a render, a crop-sharpness measurement, and an R/G and B/G ratio reader for colour matching, with the frame written out with the sample box drawn on it because a box that drifted gives confident wrong numbers.

Now the confirmation. Across the twelve skills that make up your actual drama path (`ai-director`, `production-bible-builder`, `banana-pro-director-20`, `storyboard-to-video-workflow`, `video-prompt-director`, `video-prompter`, `cinematic-shotlist-director`, `commercial-pipeline`, `poker-fish-prompts`, `hook-generator`, `blender-seedance-camera`, `midjourney-prompt-writer`), the script count is **zero**. Every rule in those skills is prose an instance may or may not honour.

And the prose is good. `ai-director` has ten numbered hard rules. `poker-fish-prompts` has six card-handling rules with the line "These six rules cost six regenerations on DEEP END." `production-bible-builder` Stage 6 asks you to "run the coverage sanity check before moving on: every beat covered, no two consecutive shots with identical size+angle, eyelines consistent." That last sentence is three deterministic checks written as a request. Nothing runs them.

So: the finding is not "you have no validators." It is **"your only validators are downstream of the money."** `cutsheet.py` catches a bad edit after every clip has been generated and paid for. Nothing catches a bad plan before.

### Hole 3: no structured handoff between stages. CONFIRMED, hard, no exceptions.

I grepped `ai-director`, `production-bible-builder`, `storyboard-to-video-workflow`, `video-prompt-director`, `cinematic-shotlist-director` and `banana-pro-director-20` for `.json`, "JSON schema" and "structured output". **Zero hits.** There is no machine-readable artifact anywhere in the pipeline.

The handoff mechanism is stated plainly in `production-bible-builder/SKILL.md`:

- Stage 2: "Paste both into the Story Bible document once locked."
- Stage 3: "Paste the resulting character sheet images/prompts into the Characters document as they're built."
- Stage 7: "Reference the Consistent Elements document for style formula and character cards so nothing gets retyped from scratch."

That last line names the exact failure and then asks a language model to remember not to commit it. The handoff is a human, or an instance, re-reading a Craft document and re-deriving facts that were already settled. Every re-derivation is a chance to drift, and drift is cumulative across eight stages.

Their counter-pattern is one sentence, repeated in three of their skills: **"這些事實不要讓模型重新想一遍"**, which is to say, do not make the model think these facts through again. They implement it as a `seed` command that mechanically lifts settled fields from the upstream JSON into the downstream skeleton, leaving only the genuinely new design work blank. `novel-script`'s seed lifts target seconds, hook, cliff, claimed turns, candidate scenes and characters. `novel-storyboard`'s seed lifts the full beat list with per-beat seconds already computed.

### Hole 4: no runtime math. CONFIRMED, and you already own the method.

Nothing in the drama path converts dialogue into seconds. Three near-misses, and the second one is important:

1. `youtube-channel-research/SKILL.md:106-107`: "Estimate word count at the analyzed channel's words-per-minute pace (measure from transcripts; default 145 wpm if unmeasurable)." Correct instinct, wrong pipeline. It sizes a YouTube script, not a shot.

2. **`screenwriter/timing-and-cutting.md` contains a complete per-beat timing algorithm.** It specifies: dialogue at ~150 words per minute, that is 2.5 words per second; a simple action line at 1 to 2 seconds; a complex one at 3 to 5; a large physical event at 5 to 10; a marked pause at 3 to 5 minimum; a reaction shot at 2 to 3. It then gives a cutting-priority list from safe to never-touch. This is a genuinely good method and **you already have it.** Three problems: it is written in Russian, it targets features and series rather than 60-second vertical episodes, and it is prose. The skill's three tools (`build_screenplay.js`, `build_bilingual.js`, `build_treatment.js`) are .docx formatters, not timers. Nothing computes.

3. `ai-footage-recut/scripts/cutsheet.py` does exact frame arithmetic, but on clips that already exist.

So the verdict stands: a written line of dialogue has no duration anywhere in your pipeline, which means your shot durations in `cinematic-shotlist-director` and your Duration column in `production-bible-builder` Stage 6 are estimates with nothing behind them. The fix is unusually cheap because the method is already yours. It needs translating to English, retargeting to vertical lengths, and putting into code.

---

## 2. What you already have, and where you are ahead of them

Stating this properly so the STEAL list below is not padded. On these, copying anything from shuohao would be a downgrade.

| Capability | Where yours lives | Theirs |
|---|---|---|
| Emotion-to-technique decision tables (shot size, angle, movement, lens, DoF, lighting, colour, cut rhythm, performance) | `ai-director/SKILL.md` §1.3 | Nothing comparable. Their craft guidance is a handful of prose rules per pass file. |
| The Turn as a named structural beat, one per film | `ai-director/SKILL.md` §1.2 | No equivalent concept. |
| Muscle-level performance direction with FACS Action Units, plus the ban on hedging a code with an emotion word | `ai-director/SKILL.md` §1.4b, `video-prompt-director/references/facs.md` | Nothing. Their acting guidance is "write common actions". |
| Acting spine: objective, obstacle, tactic, beat shift, subtext | `video-prompt-director/references/acting.md` | Nothing. |
| Reference binding map with an inclusion **and** an exclusion line per asset | `storyboard-to-video-workflow/SKILL.md` Part 3 | `novel-storyboard/references/frame.md` covers mounting, but has no exclusion discipline. Yours is better. |
| Realism overlay for "make it not look AI" | `video-prompt-director/SKILL.md` Step 3 and the negatives list | Nothing. |
| Credit cost tracking, pre-flight quote, post-run reconciliation, opt-in per project | `credit-watch/SKILL.md` | **Nothing at all.** They have no concept of generation cost. You are well ahead here and it matters more than it sounds, because every gate you add saves a regeneration. |
| A generation failure log with structured write-back | `video-prompt-director/SKILL.md` Step 0 | Their `.gates.jsonl` is the mirror image: they log *rule* failures, you log *generation* failures. Neither one replaces the other. |
| The Forbidden List, with the rule that a negation must name its replacement | `production-bible-builder/SKILL.md` Stage 5 | Their negative prompts are per-asset and mechanical. Your framing is stronger. |
| Screen test / audition before committing to paid scenes | `production-bible-builder/SKILL.md` Stage 5b | Nothing. |
| Hard-locked vertical short format (15s, 6 shots, 9:16) with payoff-variety tracking | `poker-fish-prompts/SKILL.md` | Their storyboard skill is format-agnostic. |
| Post-render technical QC on actual pixels | `ai-footage-recut/scripts/qc.py` | Nothing. Their pipeline ends at the prompt. |
| Trigger boundary discipline ("Do NOT trigger for...") in descriptions | Most of your `SKILL.md` frontmatter | They use trigger lists without exclusions. Yours is better and it is why their install.sh would have hurt you. |

Two of these deserve a sentence more.

**Your architecture and theirs disagree on principle.** Their `CLAUDE.md` states the rule: a skill must be self-contained and copyable on its own, depending on no other skill including official ones, with external methodology internalised into its own references. Your architecture does the opposite on purpose: `production-bible-builder` routes to `ai-director`, which routes to `video-prompt-director`, which routes to `blender-seedance-camera`. Neither is wrong. Theirs optimises for distribution to strangers, yours for a single operator with a deep library. Do not let their rule talk you into duplicating `ai-director` into five places.

**They do one thing inside that rule that you should copy regardless:** when they internalised MiniMax's official prompting methodology, they wrote it into `novel-storyboard/references/h3-prompt.md` with a header naming the source, rather than citing an external document that might move. Do that when you lift anything from them.

---

## 3. The STEAL list

Twenty-one items. Each one names the skill, the file, and the edit. Ordered by value, not by their pipeline order.

Six of these describe a new skill rather than an edit to an existing one. Those are marked `→ NEW SKILL` and are specified in full in the companion document, `SPEC-vertical-drama-pipeline.md`.

---

### S1. Gates as code, with the `add(id, label, ok, detail)` shape
**Their source:** `novel-script/scripts/novel-script.mjs:125-247` (`gateReport`), same pattern in all five.
**Verdict: STEAL. → NEW SKILL** (and retrofit later per S2).

The pattern is four lines of infrastructure. A `gates` array, an `add(id, label, ok, detail)` function, a `bad` object with one bucket per failure type, one pass over the data filling buckets, then one `add` call per gate at the bottom. Every gate returns a stable id, a human label, a boolean, and a detail string naming exactly which episode and which scene failed. The same array drives the CLI output, the HTML report panel, and the failure log. No gate is allowed to be prose.

The specific thing to copy is the **detail string**, not the boolean. `"Episode 3 S02 runs 14.2 seconds over (est 212.4s / target 180s)"` is actionable. `"duration check failed"` is not.

### S2. Retrofit: turn `production-bible-builder` Stage 6's sanity check into three real checks
**Your file:** `production-bible-builder/SKILL.md`, Stage 6, the line beginning "Run the coverage sanity check before moving on".
**Verdict: STEAL.**

That sentence already specifies three deterministic checks: every beat covered, no two consecutive shots with identical size plus angle, eyelines consistent. Replace the sentence with a call to the new skill's shot-list validator once it exists, and until then rewrite it as an explicit numbered checklist with a "report each failure by shot number" instruction. The first two are fully checkable in code. The third is not, and should be labelled as a human check rather than sitting in the same sentence pretending to be one.

### S3. A JSON spine, with Markdown and HTML rendered from it
**Their source:** `novel-outline/references/schema.md` and the `render` subcommand in every script.
**Verdict: STEAL. → NEW SKILL.**

One structured file per stage is the single artifact. The model only ever fills the JSON. The readable document and the review page are generated from it and are never edited by hand. This is the load-bearing decision that makes everything else possible: gates need data, seeds need data, and duration math needs data.

Their ID discipline goes with it: `C01` for characters, `S01` for scenes, `P01` for props, stored in the data, rendered as names in the interface. `novel-script/references/schema.md` puts it in one line: "data holds the id, the interface shows the name."

### S4. `seed`: mechanically prefill the next stage from the last one
**Their source:** `novel-script/scripts/novel-script.mjs:307` (`seedFromOutline`), `novel-art` `seed`, `novel-characters` `seed`, `novel-storyboard` `seed`.
**Verdict: STEAL. → NEW SKILL. This is the fix for Hole 3.**

Each stage ships a `seed` command that reads the upstream JSON and writes a downstream skeleton with the settled facts already filled in and only the genuinely new work left blank. Their `novel-characters` seed doc has the clearest statement of the split: what moves across is "facts the outline already settled", what stays blank is "design work that belongs to this layer".

The rule that makes it work, and that you should write into the new skill verbatim in your own words: **a downstream stage is never allowed to re-decide an upstream fact.** If the outline says this episode is 90 seconds, the script does not get to have an opinion. If the script says these three characters are in this scene, the shot list cannot add a fourth. Disagreement means going back up and changing the source, not quietly diverging.

### S5. Runtime math: words to seconds, with a tolerance band
**Their source:** `novel-script/scripts/novel-script.mjs:22-47`. Constants: 4.5 Chinese characters per second, 2.5 seconds per action beat, ±15% tolerance, 35 characters maximum per line.
**Verdict: STEAL, with your own numbers. → NEW SKILL. This is the fix for Hole 4.**

Take their structure, not their constants, because theirs are for spoken Chinese. Use the number you already own: `screenwriter/timing-and-cutting.md` says 150 words per minute, that is 2.5 words per second. Keep their ±15% tolerance, their per-action-beat constant as a tunable, and their principle that punctuation counts toward duration because a pause is also time.

One addition of my own that their version lacks: **gate the configuration, not just the content.** If maximum line length and maximum cut length and words-per-second are all tunable, they can be set to a combination where no valid script exists. A check that `maxLineWords ≤ maxCutSeconds × wordsPerSecond` costs one line and prevents an afternoon of confusion.

Calibrate the words-per-second figure against one real render from Higgsfield or Runway before trusting the tolerance band. Until you do, it is an inherited guess.

### S6. Beat coverage: every beat claimed exactly once, in order, contiguously
**Their source:** `novel-storyboard/scripts/novel-storyboard.mjs:604-633`.
**Verdict: STEAL. → NEW SKILL. The best single idea in the repo.**

Each shot declares which script beats it covers as a range `[from, to]`. The validator walks the shots for a scene with a cursor starting at beat 1. If a shot's start does not equal the cursor, it reports either "beat N is unclaimed" or "beat N is claimed twice", naming the shot. At the end, if the cursor has not passed the last beat, it names the uncovered tail.

Why it matters more than it sounds: it makes the script and the shot list **mechanically inseparable**. Rewrite a line, re-run the validator, and it names every shot that just became invalid. That is the single continuity check you currently perform by re-reading, and it is exactly where drift enters.

### S7. Cross-stage reconciliation gates, with an explicit skip
**Their source:** `novel-script/scripts/novel-script.mjs:190-246`, the `SKIP_OUTLINE` and `SKIP_ART` constants.
**Verdict: STEAL. → NEW SKILL.**

Downstream validators accept optional upstream files. Given them, they reconcile: does this character id exist, is this lighting state registered, is this prop real. Not given them, the gate reports "not provided, skipped, treated as pass" rather than failing.

The design point is the skip. A validator that fails when an optional input is missing gets switched off within a week. A validator that says out loud which checks it could not perform stays on. This is how the new skill supports someone who starts at the script with no outline.

### S8. Voice cards and a line book
**Their source:** `novel-characters/references/schema.md`, the `voice` object; `novel-script/SKILL.md` Step 4, the line book grouped by character with a voice-prompt button per group.
**Verdict: STEAL. → NEW SKILL. This is the fix for Hole 1.**

Per character: `timbre`, `pitch`, `pace`, `accent`, `emotion`, `referenceHint` in English prose for you, plus a single English `prompt` for the engine. Their production lesson, stated in the schema file: **give the TTS prompt exactly one version in one language.** A second "translated for readability" version gets copied into the engine by mistake.

Then the line book: the script's dialogue re-grouped by character rather than by scene, so every line one character speaks sits in one list with the voice prompt at the top. That is a TTS run in one copy-paste, and it is the artifact that makes `mcp__Higgsfield__generate_audio_batch` and `mcp__Runway__generate_speech` usable without hand-assembly.

Add one field they do not have, because your engines differ from theirs: a `voiceId` slot to hold the Higgsfield voice id once `create_voice` has been run, so the second episode does not recreate the voice.

### S9. Dialogue has to fit the cut
**Their source:** `novel-storyboard/scripts/novel-storyboard.mjs:576`.
**Verdict: STEAL. → NEW SKILL.**

One line: the spoken seconds of the lines a cut claims must not exceed the cut's own duration. It is trivial once S5 and S6 exist, and it catches the single most common failure in dialogue-driven vertical work, which is a four-second line written into a three-second shot and discovered after the clip is paid for.

### S10. Hard cut-length band and a generation cap
**Their source:** `novel-storyboard/scripts/novel-storyboard.mjs:26-32` and the three-layer model in its header comment.
**Verdict: STEAL, with your numbers. → NEW SKILL.**

Their three layers: a **segment** is one generation call capped by the model's limit; a **cut** is a 2 to 5 second edit inside it; a **keyframe** is one still per cut, the first pinned to 0.00 seconds and the rest to their cut marks.

Their comment on why they do not economise on cuts is worth quoting in spirit: an extra cut costs almost nothing, so they do not ration cuts, they only guard rhythm. For vertical this is more true, not less. Your numbers should be tighter than theirs, because 9:16 attention is faster than their assumed 3-second breath. The spec proposes a 1.5 to 4.0 second band with a 2.5 second target, and a recommended per-generation cap well below the engine's ceiling.

### S11. Health-check mode that runs gates and generates nothing
**Their source:** `novel-outline/SKILL.md` "體檢模式" (checkup mode), and the `checkup` subcommand.
**Verdict: STEAL. → NEW SKILL. This is your Path C.**

Paste in an outline you already have, convert it to the schema (asking about or explicitly marking missing fields), run the gates, print the diagnosis. Their framing is the right one: failing gates do not block the report, because the report **is** the point. You want the lesions on the table, not a refusal.

### S12. Located hook: the hook is a beat, not a label
**Their source:** `novel-script/scripts/novel-script.mjs:150-170`, the `hookBeat` gate; craft rules in `novel-script/references/script-pass.md` rule 6.
**Verdict: STEAL. → NEW SKILL, and it improves your `hook-generator`.**

Every episode carries a `hookBeat` field, a `[scene, beat]` coordinate claiming where the hook physically happens. The gate resolves that coordinate to a position in the full episode and fails if it is past beat 3. Their reasoning: a hook description with no claimed location produces the failure where "the hook says suitcase and the opening shoots eight beats of fog".

Their craft rule that the gate cannot enforce is worth writing down anyway, because it is directly useful to `hook-generator`: **the hook must be given in motion.** Not a still detail (knuckles white on a case) but a moving subject (running through fog holding the case). Static detail shots are dead openings; save the still for the second landing.

Edit to `hook-generator/SKILL.md`: add a rule that a hook for a video opening must specify a moving subject, and that a static insert is a second-beat payoff rather than an opening.

### S13. The common-action principle
**Their source:** `novel-script/references/script-pass.md` rule 4, with the comparison table.
**Verdict: STEAL. → NEW SKILL, and it belongs in `video-prompt-director` too.**

Their table, which is the clearest statement of this I have seen anywhere:

| Written as | Example | What generates |
|---|---|---|
| Precise physical interaction | "The load strikes the gunwale, the brass bell shatters the sound. Old Zhou blocks it with a thrust of the pole, and the load settles into the hold" | Pole, load and hull all interacting. Guaranteed failure. |
| Common action | "Second Master Hu carries the load aboard, Old Zhou lends a hand and sets it down in the hold" | Carry, assist, set down. All common. |

The test: is this action common in everyday footage? Boarding, sitting, handing something over, nodding, turning back, holding tight, standing up, all safe. Using a tool to block something, micro-expressions, movements measured in inches, metaphorical images, all rewrite or cut. Their conclusion is the part to internalise: **dramatic information comes from the combination and timing of common actions, not from the intricacy of any one action.**

Edit to `video-prompt-director/SKILL.md`: add this as a named rule in the universal rules section, with the table. It sits naturally next to your realism layer and it is the same class of knowledge as your Craft failure log, except it is preventive rather than diagnostic.

### S14. Change one beat, read three
**Their source:** `novel-script/references/script-pass.md`, the revision-discipline section; and `novel-storyboard/references/storyboard-pass.md`, the "changed a cut without reading its neighbours" entry.
**Verdict: STEAL. → NEW SKILL.**

After changing any beat, re-read the beat before and the beat after, checking three things specifically: **where the character physically is, what is in their hands, and who else is present.** Their reasoning is the sharp part: while writing, spatial state is in your head; while editing, it is not, and re-reading the neighbours is the only way to get it back.

This is a rule a validator cannot enforce and a rule that pays for itself immediately. Put it in the new skill's editing discipline and repeat it in `cinematic-shotlist-director/SKILL.md` under Continuity discipline, which currently lists what to track but not when to check it.

### S15. Change the picture, change the soundscape
**Their source:** `novel-storyboard/references/storyboard-pass.md` common-ailments table, and `novel-storyboard/references/h3-prompt.md`.
**Verdict: STEAL. Direct edit to `video-prompt-director`.**

They got bitten: the visual action changed, the ambience line still described a brass bell clashing, and **the video performed the clash**. Their conclusion is a genuine insight: **the soundscape is also an action instruction**, not decoration. The model reads it as something that happens.

Edit to `video-prompt-director/references/seedance.md`, in the audio section around line 200: add the rule that when a shot's action changes, its SFX line must be re-read and changed with it, and that an SFX line describing an event the picture no longer contains will cause the model to generate that event. Your audio section is already strong on direction. It has nothing on audio-visual divergence.

### S16. Generation-difficulty warnings, scanned automatically
**Their source:** `novel-outline/scripts/novel-outline.mjs:294-302`, `RISK_PATTERNS`.
**Verdict: STEAL. → NEW SKILL.**

They keyword-scan every episode synopsis for known generation traps (rain, physical contact, crowds, hand close-ups) and fail the gate if the episode did not declare the matching warning. Their instruction is "over-report rather than under-report".

You already know your own trap list better than they know theirs. It is scattered across `commercial-pipeline/references/fix-playbook.md`, the Craft failure log, and the six card rules in `poker-fish-prompts`. This gate is the mechanism that stops that knowledge from depending on someone remembering it.

### S17. Prop discipline, with the collapse test
**Their source:** `novel-outline/references/outline-pass.md` step 5, and `novel-art/references/prop-pass.md`.
**Verdict: STEAL. → NEW SKILL, and one line into `production-bible-builder`.**

Three conditions, all required, for something to be a tracked prop: it gets a close-up, it appears across more than one episode, and it carries plot. Cap around 6 to 8, the same order of magnitude as the lead cast. Their one-line test: **if it broke, was lost, or was swapped, would the story collapse?** If yes it is a prop. If no it is set dressing and belongs in the environment anchors.

Their supporting rule: if you cannot write its dramatic function in a sentence, it is not a prop, it is background.

Edit to `production-bible-builder/SKILL.md` Stage 5, under "Recurring props": add the three conditions and the collapse test. Currently that bullet says "anything that needs to look identical across multiple shots/scenes", which is a maintenance criterion, not a selection criterion, and it will let the list grow without limit.

### S18. Scale phrase must appear in the prop prompt
**Their source:** `novel-art/references/prop-pass.md` rule 4; gate at `novel-art/scripts/novel-art.mjs:253`.
**Verdict: STEAL. Tiny, and it will save regenerations.**

Three scale bands (handheld, tabletop, furniture), and the matching English phrase must literally appear in the prop's image prompt. Their stated reason: models rendering a handheld object at furniture scale is a high-frequency accident.

Edit to `banana-pro-director-20/SKILL.md`, in the universal prompt rules section: require that any prompt for an object which will later be composited or referenced declares its scale band explicitly. Your Mode 3 scene plates and the commercial-pipeline product shots both benefit.

### S19. Anchors must be drawable, recognisable and checkable
**Their source:** `novel-art/references/scene-pass.md` rule 2; count gate at `novel-art/scripts/novel-art.mjs:240`.
**Verdict: STEAL. Direct edit to `production-bible-builder`.**

Three to five anchors per environment and per prop. A good anchor is findable in a generated frame at a glance, and its absence is noticeable: a patched boat awning, the broken seventh plank, a green-tarnished brass bell. A bad anchor is an adjective: "an aged atmosphere", "the marks of years". Their test is the useful bit: **if you cannot tick it off against a generated frame, it is not an anchor, it is a mood word.**

You have the equivalent for characters already, and better: `ai-director` §3.3's distinctive asymmetries (one earring, one tear, one scratch). You do not have it for environments. `production-bible-builder` Stage 4 asks for "set dressing that recurs across shots in this location", which is the right field with no quality bar on what goes in it.

Edit to `production-bible-builder/SKILL.md` Stage 4: require 3 to 5 named anchors per location, each one a physical object or mark rather than an atmosphere word, phrased short enough to sit in a checklist.

### S20. Prefer a variant of an existing environment over a new one
**Their source:** `novel-art/references/scene-pass.md` rule 6, the `variantOf` mechanism.
**Verdict: STEAL. Direct edit to `production-bible-builder`.**

Generating a new environment is cheap. **Maintaining consistency for one more environment is not.** Their mechanism: a variant points at a parent environment and lists only what changed (time of day, weather, foreground, one removed prop), and reuses the parent's generated plate as a reference image.

Edit to `production-bible-builder/SKILL.md` Stage 4: add a rule that a location appearing in only one scene should either be cut or declared a variant of an existing location, with the change listed. Add a soft cap on distinct locations scaled to the project length.

### S21. Resume-safe steps, and show the first batch before committing to the rest
**Their source:** `novel-characters/SKILL.md` Step 6 and Step 8; `novel-storyboard/references/frame.md` "generation scope".
**Verdict: mostly ALREADY HAVE, with one gap worth closing.**

Two halves. The **show-the-first-batch** half you already have, and arguably better: `banana-pro-director-20`'s pre-prompt confirmation rule and `commercial-pipeline`'s v1 baseline both do this. Nothing to take.

The **resume-safe** half you do not have. Theirs is mechanical: if `card-<slug>.json` exists, skip that character; if `images/<slug>-sheet.png` exists, skip that generation; a failed run only regenerates the gaps. Yours is conversational, which means a re-run after a partial failure depends on someone remembering what already succeeded.

Given `credit-watch` exists, this is more valuable to you than it is to them, because a duplicate generation is a real cost you track. Edit to the new skill: every generating step writes per-item output files and skips items whose output already exists, with a `--force` escape.

---

## 4. DOESN'T APPLY

Being explicit about what I looked at and rejected.

| Their pattern | Why it does not apply |
|---|---|
| **Interface language switching (`--lang zh/en/ja`), the `ui` field, non-built-in language translation tables** | They are Chinese-first and support arbitrary report languages. You are English out, English in. This is real engineering that solves a problem you do not have. |
| **The language-split rule (human fields follow `lang`, image and TTS prompts always English)** | Same reason. Everything you write is already English. The underlying principle, that engine-facing text is a different register from human-facing text, is worth knowing and is already implicit in your prompt skills. |
| **The ban on character names in image prompts** | They gate this hard, on the reasoning that image models draw what they recognise from a name. **Your `seedance.md` says the opposite and is explicit about it:** name each subject, use the name in every shot, "named subjects give Seedance a cleaner anchor than role labels", and do not label references `REFERENCE 1`. You have tested yours on your engine and they have tested theirs on theirs. Keep yours. The residual risk their rule protects against, a real person's name bleeding a real likeness into the frame, is worth a single note in `banana-pro-director-20` if you ever name a character after a public figure, and nothing more. |
| **Alias merge candidates from name containment** | Only useful when ingesting a novel where one person is called four things across 900 chapters. Genuinely useful for Path A of the new skill, useless everywhere else. Carried into the spec as Path-A-only, not a general pattern. |
| **The dynamic main-scene cap formula (4 + ⌈episodes/10⌉, clamped 5 to 15)** | The formula is tuned to 60-episode Chinese short drama. The principle behind it (cap distinct environments, scale the cap to length) is S20. The number is not transferable. |
| **The self-contained skill rule, no dependency on any other skill** | Directly contradicts your architecture, deliberately. Discussed in section 2. |
| **The MiniMax H3 prompt grammar** (`novel-storyboard/references/h3-prompt.md`, the alignment instruction, `[Shot k]` cut marks, `<d>[Chinese] …</d>` dialogue blocks, `integrated_multimodal_description`, `overall_soundscape`, `non_diegetic_music`) | Engine-specific to a model you do not use. **The structural idea underneath it does transfer and is stolen as S6 and S10:** derive the cut times from the shot data and check them character by character, so that changing a duration without changing the prompt is caught. Your Seedance equivalent is the binding map plus timestamps, and the equivalent check is "does the prompt's stated shot count and total duration match the shot list". |
| **`.gates.jsonl` failure logging and the `stats` command** | Not rejected, deferred. Their own `CLAUDE.md` says this ships on one skill only, on purpose, because "if nobody opens it for a long time, the feature should not exist, and rolling it out would just copy the mistake five times". That is the correct instinct and I am not going to talk you out of it on their behalf. Build the gates first. If you find yourself wondering which rule gets ignored most, add it then. |
| **Their single-page HTML review report** (KPI band, timeline, scheduling matrix, export button) | The capability you already have via `web-artifacts-builder` and `cinematic-shotlist-director`'s HTML shotlist. What is worth taking is narrower: the **quality-gate panel** baked into the page with a lesion banner at the top when gates fail. That is carried into the spec as a later phase, not a STEAL of their report. |

---

## 5. Licensing and attribution

Their repo is Apache 2.0, with a `NOTICE` file reading "shuohao-skills, Copyright 2026 烁皓".

The practical position, stated plainly and not as legal advice:

**Ideas, methods and rules are not what copyright covers.** Reading their repo, understanding that a beat-coverage check is a good idea, and writing your own implementation from scratch creates no obligation. Most of this report is in that category.

**Code is different.** If you copy a function, or write something that is recognisably a translation of one of their functions (same structure, same logic, same comments rendered into English), that is a derivative work and Apache 2.0 §4 applies: keep the license text, keep the `NOTICE`, mark the files you changed, and do not strip the copyright line.

**Where the line actually falls, concretely:**

| If you do this | Obligation |
|---|---|
| Write your own validator that checks every beat is claimed once | None. Credit them anyway; it costs nothing. |
| Port their cursor-walk coverage algorithm (`novel-storyboard.mjs:604-633`) into your file, structure intact | Attribute. Apache 2.0 notice on that file, note what changed. |
| Port their `gateReport` / `add(id, label, ok, detail)` scaffold | Attribute. It is small, but it is theirs. |
| Port their chunking or alias-merge logic for Path A | Attribute. |
| Reuse their timing constants (4.5, 2.5, 0.15) | Constants are facts and not protectable, and you should not use theirs anyway since they are for spoken Chinese. |
| Ship any of their sample material, including `渡口.txt` and the five example JSON files | **Do not.** The `NOTICE` covers it under the same license, so it is permitted with attribution, but it is their story and it has no place in your work. Write your own fixtures. |

**Recommendation:** the new skill gets a `references/SOURCES.md` with two lists, "ported from shuohao-skills (Apache 2.0)" naming each file and function, and "independently implemented after reading shuohao-skills" for the rest. If nothing lands in the first list, say so explicitly. It takes ten minutes now and answers the question permanently.

One more point. Their author's README opens with a note that he is between jobs and open to work or collaboration, with an email, a résumé link and a Ko-fi. Not a licence term, and you owe nothing. But you are about to take a substantial amount of thinking from a stranger's unpaid work, and a line of thanks or a coffee is a reasonable thing to consider.

---

## 6. What I am not sure about

Stated rather than guessed.

1. **I could not read `Claude-Architecture-Review-Creative-Hub.pdf`.** It is the only file in this repo and presumably contains prior architecture decisions about the Creative Hub. `pdftoppm` is not installed in this container, and the PDF's 18 streams do not decompress with standard Flate, which suggests it is image-only or uses an unusual filter. **If that document contains decisions that contradict anything in this report or the spec, it wins and I have not seen it.** Worth telling me what is in it.

2. **Your skills here are a synced snapshot and may be out of date.** I read what is in the container. I cannot tell whether it matches what is on your machine, whether the sync is current, or whether you have local-only skills that never synced. If you have a drama skill I did not name, I did not see it.

3. **2.5 words per second is inherited, not measured.** It comes from your own `screenwriter` skill. It has not been checked against a real Higgsfield or Runway TTS render of your actual dialogue. Until it has, the ±15% band is a band around a guess. One calibration pass fixes this and should happen before the duration gate is trusted.

4. **The biggest technical risk in the whole plan: I do not know whether Seedance 2.5 honours in-prompt cut timing the way MiniMax H3 does.** Their entire three-layer model (segment holds cuts, cuts have exact second marks, one keyframe pinned per cut) depends on the engine reading multi-image alignment instructions and cutting where it is told. H3 has an explicit mode for that. Your `seedance-25-reference.md` says timestamps are supported at one-second granularity and multi-shot is first-class, which is encouraging and is not the same claim. **If Seedance does not honour 2-second cut marks inside one generation, the segment-and-cut structure is still correct, but it becomes an editing plan (generate per cut, assemble in HyperFrames) rather than a single-generation plan.** That changes cost and workflow substantially. This needs one test before the shot-list stage is built, and the spec is written so that either answer works.

5. **"Otherworldly" and "common action" are in tension, and I am not sure which wins.** Their common-action rule says write only what the model has seen a million times. Your concept is deliberately not-quite-human. My instinct is that a non-human character performing an utterly common human action (boarding, sitting, handing something over, turning back) is the safe combination, and that a non-human character performing a non-human action is where it breaks. That is a hypothesis from reading, not from generating. Test it early, because if it is wrong the whole action vocabulary for the project changes.

6. **Whether 10 words is the right maximum line length** for a vertical micro-drama beat. It is derived arithmetic (4.0 second maximum cut × 2.5 words per second), not taste. It may read as clipped. It is a parameter, so it is cheap to change, but the first real script will tell you more than I can.

7. **Trigger collision.** The new skill sits close to `production-bible-builder`, `ai-director`, `cinematic-shotlist-director` and `storyboard-to-video-workflow`. The spec proposes boundaries. Boundaries between skills are notoriously hard to predict from the text and you will only find out by using it. Expect to tune the description in the first week.

---

*Companion document: `SPEC-vertical-drama-pipeline.md`*
