# Creative Hub

> **Read this before concluding anything about what exists.**
>
> **The Creative Hub app is not in this repository.** It was built on 3 August 2026, it runs,
> and it lives only on a Windows machine at `C:\Users\cyanj\Creative Hub`. It has never been
> pushed.
>
> An AI that can see only this repo has already once concluded the project was never built.
> That conclusion was wrong. Do not repeat it.
>
> The live status of everything is in Craft: **Coding Projects → Creative Hub → "5. V2 Status &
> Cross-Chat Log"**. That document is the single source of truth. This repo holds artifacts.

---

## Two workstreams share this repository

They are separate projects. Neither depends on the other. They share a repo only because that is
where documents were being kept.

| | **Creative Hub app** | **Skills library** |
|---|---|---|
| What it is | A canvas and storyboard app, V1 built, moving to V2 | Claude skills, 44 synced plus 1 built here |
| What it produces | A tool you open | Instructions and validators Claude loads |
| Where its code lives | `C:\Users\cyanj\Creative Hub`, **not in this repo** | `skills/vertical-drama-pipeline/`, **in this repo** |
| Its documents here | `V2-RECONNAISSANCE-AUDIT.md`, `Claude-Architecture-Review-Creative-Hub.pdf` | `GAP-REPORT-…`, `SPEC-…`, `EDITS-…` |
| Its blocker | Pushing V1 to GitHub | The Seedance cut-timing test |

They genuinely overlap in two places, and both are worth exploiting rather than untangling:

1. **Does Seedance 2.5 honour in-prompt cut timing?** The app's Shot model and the pipeline's
   phase 3 both depend on the answer. One test settles both. Do not run it twice.
2. **Cost tracking.** The `credit-watch` skill already quotes before and reconciles after. V2
   plans the same thing inside the app. Whichever is built second should read the first one's
   ledger rather than starting a new one.

---

## What is in here

### The skills workstream

| File | What it is |
|---|---|
| [`GAP-REPORT-shuohao-vs-creative-hub.md`](GAP-REPORT-shuohao-vs-creative-hub.md) | Teardown of `eternityspring/shuohao-skills` (Apache 2.0) against the existing 44-skill library. 21 steals, each naming the skill, the file and the edit. Verdicts on four suspected gaps, with file-and-line evidence |
| [`SPEC-vertical-drama-pipeline.md`](SPEC-vertical-drama-pipeline.md) | Design for a vertical micro-drama pipeline. Three-way intake, a JSON spine, roughly 55 gates, five build phases, eight open questions |
| [`EDITS-to-existing-skills.md`](EDITS-to-existing-skills.md) | Five exact find-and-replace blocks for skills that are not micro-drama-specific. Every anchor verified, all five dry-run applied. **Not yet applied to the real files** |
| [`skills/vertical-drama-pipeline/`](skills/vertical-drama-pipeline/) | The built skill. Phases 1 and 2 |

### The app workstream

| File | What it is |
|---|---|
| [`V2-RECONNAISSANCE-AUDIT.md`](V2-RECONNAISSANCE-AUDIT.md) | The V2 audit, 19 September 2026. Contained one major error about the app not existing; corrected the same day. Do not trust a copy dated before that correction |
| [`Claude-Architecture-Review-Creative-Hub.pdf`](Claude-Architecture-Review-Creative-Hub.pdf) | Prior architecture review. **No AI has successfully read this file.** Claude Code could not open it, no poppler and the streams would not decompress. If it contradicts either plan, it wins, and nobody has checked |

---

## The skill

`skills/vertical-drama-pipeline/` runs a vertical micro-drama series from intake to a locked
script. Zero dependencies, Node 18 or later, standard library only.

```bash
cd skills/vertical-drama-pipeline

node scripts/selftest.mjs                                    # 188 assertions, no model called
node scripts/pipeline.mjs checkup examples/tidewrack-outline.json --stage outline
node scripts/pipeline.mjs stats  examples/tidewrack-script.json
```

**Built:** the outline and script stages, 23 gates, the runtime maths, health-check mode, and a
seed that carries settled facts downstream so no stage re-derives an upstream decision.

**Not built:** the shots stage, deliberately. Its model assumes the engine honours in-prompt cut
timing, which is unverified. The cast and world stages are also unbuilt; their cross-stage gates
skip cleanly and say so.

Every gate has a breach case in the self-test proving it blocks, because a gate with only a
passing fixture is an assertion that a gate exists rather than a promise that it works.

---

## Conventions

- **Branches.** `main` is the trunk. Working branches are named `claude/<topic>-<id>` and are
  merged here when their work lands.
- **Skills are a synced snapshot.** The library lives at `~/.claude/skills/synced/<bucket-id>/`
  with a manifest, which means it is pushed down from a Claude account rather than authored in
  place. **Editing files there risks being overwritten on the next sync.** Author them wherever
  they actually come from.
- **Status belongs in Craft, artifacts belong here.** Structure that a validator can check lives
  in JSON in this repo. Concept, emotional reasoning and the readable bible live in Craft. If a
  fact is only in a chat transcript, it is lost.

## Attribution

`skills/vertical-drama-pipeline/references/SOURCES.md` records what was learned from
[shuohao-skills](https://github.com/eternityspring/shuohao-skills) (Apache 2.0, Copyright 2026
烁皓) and states that no code was ported from it.
