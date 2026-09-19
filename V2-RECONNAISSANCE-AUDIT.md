# Creative Hub V2: Reconnaissance Audit

> # ⚠️ RETRACTED IN PART, 19 September 2026
>
> **This audit's central finding was wrong. The Creative Hub V1 application exists.**
>
> It was built on **3 August 2026** and lives at `C:\Users\cyanj\Creative Hub`. It runs with
> `npm run dev`. It was verified in a browser with zero console errors. It was never pushed to
> GitHub, which is why this audit could not see it.
>
> **What it actually implements** (Vite + React 18 + TypeScript strict, Zustand, Express proxy
> on `localhost:8787`): infinite canvas with pan/zoom/marquee/rotate, Frames as the structured
> shot unit, image cards, text blocks, colour-coded wires, a 4-across scene-grouped storyboard
> view with two-way edit sync, a Character Bible with a `signature` canonical prompt lock,
> a World Builder with visual keys, a Script Room on the intensity curve, `@Character` context
> resolution, 7 prompt enhancers, a 90+ term cinematography keyword library, a character-sheet
> builder with a photoreal/animated fork, asset carousel, Ctrl-K search, PDF export, saved
> workflow templates, localStorage for structure and IndexedDB for image blobs, and Higgsfield
> /Runway/OpenArt routes as deliberate thin passthroughs.
>
> That is essentially the whole of spec Section 4. **Every "does not exist" in this document is
> false.**
>
> **How the error happened, because it will happen again otherwise:** the GitHub repo genuinely
> contains no code, the filesystem sweep genuinely found none, and when asked directly whether
> the app existed, the answer given was that it had not been made. Three independent signals all
> pointed the same way and all three were artefacts of the code living only on a Windows machine
> that no tool in this session could reach. The prior architecture-review PDF made the same error
> for the same reason.
>
> **The fix is not better auditing. It is pushing the code.** Until `C:\Users\cyanj\Creative Hub`
> is in this repository, any AI working from GitHub will reach this same wrong conclusion, and
> there is no backup of the only copy.
>
> **What in this document still stands:**
>
> - §2, the inventory of the 44-skill library, and how those skills map onto V2 objects. Unaffected.
> - §5, Correction 1: Higgsfield **does** expose a preflight quote via `get_cost`. Verified from the
>   live tool schema. Still true and still important.
> - §6, the conflicts between the spec and reality regarding cost estimation and provider abstraction.
> - §7, the risks about the skills library being a synced snapshot, Craft holding production truth,
>   and Higgsfield transaction history ageing out. All still live.
> - §8, the nine-item milestone scope.
> - §10, the stack recommendation, now reframed: V1 already chose Vite + React + TypeScript +
>   Zustand + Express. That is the stack. The open question is no longer what to build on, it is
>   whether V2's SQLite layer extends V1 in place or runs alongside it.
>
> **What is void:** §0, §1, §3 (answers 1 through 10), §4's premise that there is no code to
> migrate, §7's claim of no migration or data-loss risk, §9 Phase 0 item 1, and §10's
> "confirmed greenfield" framing.
>
> The live status record is Craft → Coding Projects → Creative Hub → **"5. V2 Status &
> Cross-Chat Log"**, which supersedes this document.

---

**Date:** 19 September 2026
**Scope:** Inspection and planning only. No code was modified.
**Status:** Partially retracted. See the notice above before reading any section.
**Against:** `CREATIVE-HUB-V2-SPEC.md` (30 sections, architecture baseline)
**Branch:** `claude/creative-hub-v2-audit-ao95je`

---

## 0. Headline finding, read this before anything else

> **VOID.** This section is wrong. The V1 app exists. See the retraction notice at the top. Retained as a record of the error.

**There is no Creative Hub application. Not in this repository, not in this container, not anywhere I was able to reach. Confirmed by Cy on 19 September 2026: the app has not been built yet.**

The V2 spec's Section 4 lists sixteen "existing capabilities to preserve where practical": infinite visual canvas, pan/zoom cards, Frames, image cards, text blocks, storyboard grid, scene grouping, Character Bible, World Builder, Script Room, `@Character` resolution, character signature lock, visual keys, character-sheet builder, asset carousel, prompt tools, cinematography keyword library, saved workflow templates, PDF export, local proxy/API infrastructure.

Of those, **three exist in some form, and none of them exist as software.** The rest have no implementation anywhere I can see.

This means sections 1 through 10 of the audit you asked for cannot be answered, because the things they ask about have not been built. I am not going to invent an architecture review of a codebase that does not exist. What follows is the real inventory, the real migration map, and the real conflicts.

**This also means the good news:** there is no legacy to preserve, no migration risk, no data-loss risk from schema change, and no technical debt to carry. V2 is a greenfield build. That is a materially better position than the spec assumes, and it should change the plan.

---

## 1. Evidence

### The repository

`Cyanjb/Creative-Hub` has three branches. Every one of them contains documents only.

| Branch | Contents |
|---|---|
| `claude/creative-hub-architecture-2u5fdi` | `Claude-Architecture-Review-Creative-Hub.pdf` |
| `claude/creative-hub-v2-audit-ao95je` (this one) | same PDF |
| `claude/shuohao-gap-analysis-spec-wlf015` | same PDF, `GAP-REPORT-shuohao-vs-creative-hub.md`, `SPEC-vertical-drama-pipeline.md` |

Total repository history: **one commit**, `033001b`, adding a PDF. No `package.json`, no source tree, no build config, no server, no `.env`, nothing.

### Corroboration from the prior review

`Claude-Architecture-Review-Creative-Hub.pdf`, dated 19 September 2026, Section 1 "Material reviewed", states plainly:

> The `Cyanjb/Creative-Hub` GitHub repository, which is **completely empty**: no commits, no branches, no files

That review reached the same conclusion I did, on the same day, independently. The repo has gained a PDF since then and nothing else.

### The filesystem

A filesystem sweep for `package.json`, `*.tsx` and `vite.config*` outside `node_modules` and system paths returned exactly one hit, inside a Python type-checker's own bundled dependencies. There is no application checkout in this container.

### Named-feature sweep

I grepped the entire 572-file skills library for the spec's named features:

| Feature named in spec §4 | Files containing it | Verdict |
|---|---|---|
| "infinite canvas" | 0 | Does not exist |
| "World Builder" | 0 | Does not exist |
| "Script Room" | 0 | Does not exist |
| "IndexedDB" | 0 | Does not exist |
| "localStorage" | 0 | Does not exist |
| "keyword library" | 0 | Does not exist |
| "@Character" | 0 | Does not exist |
| "visual key" | 0 | Does not exist |
| "Character Bible" | 1 | A passing phrase in `video-prompter/SKILL.md` line 263, describing how Kling treats a reference image. Not an implementation. |
| "character sheet" | 13 | **Real.** See §2. |
| canonical / signature lock | 25 | **Real.** See §2. |
| Express / proxy / env vars | 0 relevant | Does not exist. The `proxy` hits are unrelated (an XSD schema, a Netlify note). |

### Other repositories

The account holds six repositories: `Creative-Hub`, `dramaeverafter`, `Cyanjb`, `aiswlibrary`, `Prompt-Builder-East-Asia`, `MidJourney-`. None is plausibly the Creative Hub application by name or by recency. This session is scoped to `Creative-Hub` only, so I did not read inside the others.

> **VOID.** The app was found later the same day, in Craft, documented at `C:\Users\cyanj\Creative Hub`. It exists, it runs, and it was never pushed to GitHub. This section's evidence about the *repository* remains accurate; the conclusion drawn from it does not.

---

## 2. What actually exists: the real Creative Hub

The Creative Hub is real. It is just not an application. It is a **library of 44 Claude Skills**, 572 files, 15 MB, synced to this machine from your Claude account, snapshot timestamp `2026-09-19T13:39:56Z`.

This is the thing the V2 spec is actually describing when it talks about Character Bible, World Builder and Script Room. Those are not React components. They are **Craft documents, created and driven by skills.**

### The production stack as it stands today

```
     PLANNING                    KNOWLEDGE                  EXECUTION
  production-bible-builder  →  ai-director            →  banana-pro-director-20/30
  (owns stage sequencing)      (emotion → technique)     (image prompts, face lock)
         │                            │
         │                     video-prompt-director   →  storyboard-to-video-workflow
         │                     (owns ALL engine facts)    (reference binding map)
         │                            │
         ▼                            ▼
     CRAFT DOCS                 credit-watch           →  ai-footage-recut
  Story Bible                   (quote → reconcile →      (qc.py, cutsheet.py)
  Characters                     Craft ledger)
  Settings & Locations
  Consistent Elements
  Shot List
  Production Notes
  Whiteboard (Excalidraw)
```

### The pieces that map onto V2 objects

| V2 spec object | Where it lives today | Fidelity |
|---|---|---|
| **Production** | A Craft folder duplicated from "Production Bible Template" | Real, but a folder is not an object with an ID |
| **Story Bible / treatment / script** | Craft docs; `screenwriter/` has templates plus three Node build scripts | Strong. Already document-shaped, exactly as spec §7 wants |
| **Character** | Craft "Characters" doc + `production-bible-builder` Stage 3 | Real, prose only |
| **Canonical signature / prompt lock** | `banana-pro-director-20` Mode 0 face lock: "produces the canonical character reference image used as the identity anchor for every future outfit/scene/sheet prompt" | **Strong. This is exactly spec §8's "canonical signature / prompt lock" and it already exists.** |
| **Character Variant** | `banana-pro-director-20` Mode 1, repeated per outfit, logged in the Characters doc | Partial. Variants exist as repeated work, not as objects that inherit from a base |
| **Character sheet presets** | Mode 2 six-panel default, three-panel lean variant on request | Partial match to spec §8's two presets. The spec wants human-facing vs machine-facing; the skill's split is six-panel vs three-panel on a resolution argument, not on audience |
| **Location / World** | Craft "Settings & Locations" doc, Stage 4: name, time of day, era, lighting logic, recurring set dressing, what never appears | Real. Genuinely close to spec §9 |
| **Reference with intent** | `storyboard-to-video-workflow` Part 3 binding map. Every reference gets an **inclusion and an exclusion** line: "`@image1` for face, hair and wardrobe. Do not adopt its background or its lighting." | **Strong. This is spec §10's intent field, already invented, already in daily use, and arguably better than the spec because it carries a negative as well as a positive.** |
| **Shot** | `cinematic-shotlist-director` shot record: SHOT ID, editorial duration, purpose, start frame, end frame, characters and continuity, scene geography, camera, action, transition mechanism, lighting and sound, video prompt, failure risks | **Strong. A complete Shot schema already exists in prose, including a SHOT ID field.** |
| **Cost / preflight / receipt** | `credit-watch` Modes 1-4: quote before, reconcile after, per-platform rate table, opt-in per project, Craft ledger with an eight-column spend collection | **Strong. Preflight and reconciliation already work. See §5 for one important correction.** |
| **Higgsfield operations** | `higgsfield-content-factory`: `media_upload` → curl PUT → `media_confirm` → product UUID, reused as reference in all generations; `generate_video` with mode/preset routing; `job_display`; a documented slug-mismatch workaround; spend filtered from `transactions` by job window | **Strong operational knowledge. This is the closest thing to an integration layer that exists.** |
| **Take / selection state** | Nothing | Missing |
| **Generation receipt** | Nothing | Missing |
| **Job state machine** | Nothing | Missing |
| **Output download and hashing** | Nothing | Missing |
| **Board / canvas** | Craft whiteboard, Excalidraw-compatible, created fresh per project, no fixed layout | Not a canvas application. A notes-app whiteboard. |

### Real code that exists

Four scripts, and they are the only executable production code in the library:

- `ai-footage-recut/scripts/qc.py` (6.1 KB), post-render technical QC on actual pixels
- `ai-footage-recut/scripts/cutsheet.py` (3.5 KB), frame-quantised cut sheets
- `screenwriter/tools/build_screenplay.js`, `build_treatment.js`, `build_bilingual.js`

Everything else is Markdown instruction.

---

## 3. Answers to your eleven questions

> **VOID for questions 1 to 10.** Every "does not exist" below is false; those things are built. Question 11's answer happens to survive: the overlap at the knowledge layer is real, and the software-layer figure should read roughly 60 per cent done rather than zero. Re-run this section against the real code.

Given the above, here they are straight.

1. **Current application architecture and directory structure.** There is no application. The structure is a flat skills directory of 44 folders, each with a `SKILL.md` and optional `references/`, `scripts/`, `templates/`.
2. **Current data/state model.** There is no data model. State lives in Craft documents as prose and tables, keyed by human-readable project names. There are no IDs. There are no foreign keys. There is no schema.
3. **Infinite canvas and storyboard views, and how they share data.** Neither exists. The storyboard is a generated image sheet from Nano Banana 2, not a view. The nearest thing to a canvas is a per-project Craft whiteboard with no defined layout.
4. **Character Bible, canonical/signature/context-resolution behaviour.** No Character Bible module. The canonical lock is real and lives in `banana-pro-director-20` Mode 0. Context resolution is done by a language model reading Craft documents, not by code. There is no `@Character` syntax anywhere. The `@image1` syntax in the binding map is Seedance reference numbering, not character resolution.
5. **World Builder.** No World Builder. `production-bible-builder` Stage 4 produces a Settings and Locations Craft document with lighting logic and a never-appears list.
6. **Script Room.** No Script Room. `screenwriter/` holds methodology, style rules, four templates and three Node build scripts producing Hollywood-format `.docx`.
7. **Asset/media storage, IndexedDB, localStorage.** None. No browser storage of any kind. Media lives wherever Higgsfield put it, plus whatever is pasted into Craft. **Nothing is downloaded and stored locally today.**
8. **Existing prompt enhancement and context assembly.** This is the strongest existing area by a distance. `ai-director` (28 KB) holds emotion-to-technique decision tables. `video-prompt-director` (plus ten reference files, including FACS action units and three Seedance-specific references) owns all engine facts, with an explicit precedence rule: "If anything in this skill disagrees with that one on an engine fact, that one wins." `banana-pro-director-20/30` are 110 KB and 128 KB of image prompt grammar. Assembly is done by a model at conversation time, not by a compiler.
9. **Integrations, Express proxy, API routes, env vars, Higgsfield code.** No proxy, no routes, no env vars, no code. Integration is via MCP servers at conversation time: Higgsfield, Runway, Craft, Canva, Vidiq, Metricool, Netlify, HyperFrames and others. The Higgsfield MCP surface is large and already exposes everything V2 needs.
10. **Project/board/frame/shot concepts and relationships.** Project is a Craft folder. Board is an optional whiteboard. Frame is a panel in a generated storyboard sheet. Shot is a row in a Shot List document and a shot record in `cinematic-shotlist-director`. The relationships exist only as prose and as the order of stages in `production-bible-builder`. Nothing is enforced.
11. **Overlap with the proposed V2 architecture.** Substantial at the knowledge layer, near-zero at the software layer. The domain thinking for V2 is roughly 70 percent done and written down. The software is 0 percent done.

---

## 4. Migration map

Since there is no code, KEEP/MODIFY/REPLACE/ADD applies to the **knowledge assets**, which is where the actual value sits. This is the useful version of the exercise: what gets absorbed into V2, what gets rewritten, what stays outside the app, and what has to be built.

### KEEP: works as required, do not touch, do not absorb into the app

| Asset | Why |
|---|---|
| `ai-director` emotion decision tables | The V2 spec explicitly says (§24) not to recreate specialist reasoning that already lives in skills. This is that. V2 calls it via handoff, never reimplements it. |
| `video-prompt-director` and its ten reference files | Same. It is also the declared single source of engine truth, and three other skills defer to it in writing. Preserve that precedence rule; it is the only thing preventing engine-fact drift across the library. |
| `banana-pro-director-20/30` prompt grammar | 238 KB of tested image-prompt knowledge. Nothing in V2 improves it. |
| `screenwriter` templates and build scripts | Document-shaped, already produces `.docx`. Spec §7 wants creative documents to stay flexible. They already are. |
| `ai-footage-recut/scripts/qc.py` and `cutsheet.py` | The only working production code in the library. V2 can shell out to them. Do not rewrite. |
| The Forbidden List concept, and the rule that a negation must name its replacement | Genuinely good. It survives into V2 as a Production-level field. |

### MODIFY: valuable, needs to become an object with an ID

| Asset | What changes |
|---|---|
| **`cinematic-shotlist-director` shot record** | Already has SHOT ID, purpose, start/end frame, continuity, camera, transition, duration, failure risks. Turn this prose schema into the SQLite `shot` table more or less verbatim. This is the single highest-leverage lift in the whole plan: the Shot model is already designed, it just needs a primary key. |
| **`storyboard-to-video-workflow` binding map** | The inclusion/exclusion pair becomes `reference.intent_include` and `reference.intent_exclude`. Keep both. The spec only asked for intent; you already have intent plus anti-intent, which is better. Add `scope`, `lifecycle` and `higgsfield_media_id` around it. |
| **`banana-pro-director-20` Mode 0 canonical** | Already produces the identity anchor. Give it a row: `character.canonical_asset_id`, plus a hash, plus a cached Higgsfield `media_id` so it uploads once and never again. |
| **`banana-pro-director-20` Mode 1 repeated per outfit** | This is Character Variant done by hand. Make it an object that inherits from the base character and overrides only wardrobe, hair, makeup, props and physical condition, per spec §8. The skill keeps writing the prompts; the app remembers the variant. |
| **`production-bible-builder` Craft document set** | Keep the six documents as documents (spec §7 is right about this). Change where they live: Production-scoped Markdown files on disk, not a Craft folder, so the app can read them and so they survive Craft. Keep Craft as an optional mirror if you want mobile reading. |
| **`credit-watch` Modes 1 and 2** | Preflight and reconcile are correct in principle and should become app functions rather than conversational habits, because the app can do it on every job without being asked. See the correction in §5. |
| **`credit-watch` Mode 4 Craft ledger** | Craft is the wrong home for the canonical cost record once receipts exist. Cost becomes a column on the receipt. Keep a Craft export if you like reading it there. |
| **`production-bible-builder` strict stage order** | The spec says twice (§5, §28) that no universal linear workflow should be imposed. "THE BUILD ORDER (strict, non-negotiable)" directly contradicts that. The stages become a checklist of artifacts that should eventually exist, not a wizard. The prior architecture review made this same point about Shuohao and it applies here too. |

### REPLACE: fundamentally conflicts with V2

| Asset | Conflict |
|---|---|
| **Craft as the system of record** | Craft has no IDs, no referential integrity, no queryability, and it is a third-party notes app. Spec §25 wants SQLite canonical. Every Craft document that holds *facts* (shot list, character roster, credit ledger, tracked-projects register) moves to SQLite. Every Craft document that holds *prose* (story bible, treatment, director notes) moves to Markdown on disk. **Nothing is deleted from Craft during this. See §7 on data loss.** |
| **Human-readable project names as the join key** | "Project: free text, autocomplete from prior rows" in the credit ledger is how spend silently detaches from productions. Replaced by `production_id`. |
| **Per-generation state living only in a chat transcript** | Today, if you close the conversation, the job is gone. There is no record that a generation happened unless someone wrote a Craft row. This is the core thing V2 exists to fix. |

### ADD: genuinely missing, must be built

Everything in the first milestone, essentially. In dependency order:

1. **SQLite schema and a Production object with a stable ID.** Nothing else can be built first.
2. **Shot objects with stable IDs** (`S03-SH04` format, per spec §11). Schema ports from `cinematic-shotlist-director`.
3. **Character and Character Variant with inheritance plus overrides.**
4. **Reference as a first-class object:** path, SHA-256, media type, dimensions, source, rights, intent include, intent exclude, scope, lifecycle, `higgsfield_media_id`.
5. **Higgsfield client:** `media_upload` → `media_confirm` → cache the returned UUID on the reference row forever.
6. **Generation preflight** using `get_cost: true`, plus live `balance`, plus a per-session cumulative ceiling.
7. **Job state machine:** planned, submitted, complete, failed. Kept separate from selection state.
8. **Async job poller** respecting the concurrency cap.
9. **Output fetcher:** download the original the moment the job completes, hash it, store it, record technical metadata. **This is the highest-consequence and least glamorous requirement in the build.** Provider URLs expire.
10. **Take object:** mutable creative judgement, selection state unreviewed/selected/rejected/maybe, QC notes, rejection reason, link to receipt.
11. **Immutable generation receipt:** written once, never edited, per spec §19. Retry creates a new receipt.
12. **Cost record** attached to the receipt: estimated, balance before, balance after, actual, pricing source and date.
13. **Board view:** shot cards with thumbnails, take count, status, spend per shot.
14. **Compare and select/reject.**
15. **Handoff exporters:** "Copy Full Shot Context", "Copy for AI Director", and so on, per spec §23. These are what connect the app back to the skills library, and they are cheap.

Missing and worth naming even though it is not in the first milestone:

- **Audio as a first-class object.** Spec §12 asks for it. Nothing in the library handles it. The prior review flagged the same gap. For music-video work the track is the spine.
- **Feedback rounds and delivery versions.** Spec §27. `poker-fish-prompts/client-feedback-log.md` is the only trace of this thinking and it is one file scoped to one series.

---

## 5. Corrections to the prior architecture review

The PDF in this repo is the current architecture baseline alongside the spec. Two of its claims are wrong and one is unverifiable, and they matter because they shape the build.

### Correction 1: Higgsfield does have a preflight quote

The PDF's Section 2, presented as "the one finding that survives every correction", states:

> Neither reference system can tell you what a generation will cost before you run it, and **neither can the Higgsfield API**. There is no quote endpoint.

This is **false for the Higgsfield MCP surface.** The `generate_video` tool schema carries:

```
get_cost: "If true, return the cost in credits for this generation without
           submitting any job. Use to preflight cost before generating."
```

Your own `credit-watch` skill already documents and uses this: "Higgsfield: call the generation tool with the intended params plus `get_cost: true`. This submits nothing. Use the returned number." `credit-watch` also marks Higgsfield as the one platform with both a real preflight quote and itemised history.

The PDF acknowledges in its own open question 6 that it reviewed the MCP surface and that the REST API may differ. That caveat should have applied to this finding and did not.

**What this changes:** the PDF argues the platform's strongest justification is measuring cost empirically by balance deltas, because nothing else can. That is now a fallback, not the primary mechanism. V2 should **quote with `get_cost`, then reconcile against `transactions`, and record both.** Balance before and after still goes in the receipt, because it catches the cases a quote misses (failed jobs that charge, retries, resolution bumps), but it is verification rather than the only source.

The justification for building V2 does not weaken. It moves. The value is not "we can learn a price nobody knows". It is "every generation is attached to a shot, a receipt and a take, and nothing is ever lost in a chat transcript."

### Correction 2: the repository was empty, and this changes the ordering argument

The PDF was written against an empty repo and still framed the work as evolution. The V2 spec goes further and lists sixteen capabilities to preserve. Both should be read knowing that **no preservation is required**. Design rule 12, "preserve working existing Hub code wherever practical", has nothing to bite on. That frees the build order entirely.

### Unverified: the unlimited tier

The PDF reports `supports_unlim: true` on `seedance_2_0` and `seedance_2_0_mini`, with the account showing `"unlim": {"available": false}`. The live `generate_video` schema confirms `use_unlim` is a real runtime parameter with a documented consent flow (`unlim_choice`, returned before spending anything). Whether the tier is purchasable on your plan remains unanswered and is still worth one call to resolve, because it changes the cost model for all 2.0 work.

---

## 6. Assumptions in the V2 spec that conflict with reality

| Spec | Reality |
|---|---|
| §4: sixteen existing capabilities to preserve | Three exist, none as software. The rest have never been built. |
| §4: "local proxy/API infrastructure" | Does not exist. Integration is MCP at conversation time. |
| §4: "existing implementation must be audited before modification" | Correct instinct, nothing to audit. |
| §5: Board is "the default creative surface" and should "remain visually oriented" | "Remain" implies something exists. A Craft whiteboard is not a canvas with object-backed cards. This is a build, and it is the largest UI item in the plan. |
| §8: "the existing character-sheet work supports at least two deliberate presets: comprehensive human-facing multi-angle sheet; compact machine-facing identity anchor" | Close but not exact. `banana-pro-director-20` has a six-panel default and a three-panel variant, split on a resolution argument (six-way splits starve the face panels), not on human vs machine audience. The *canonical face lock* is the machine-facing anchor, and it is Mode 0, a separate thing. Worth reconciling deliberately rather than assuming the presets already match the spec. |
| §9: "preserve and evolve the existing World Builder" | There is no World Builder. There is a Craft document template. |
| §14: "Higgsfield is the generation engine beneath the Studio" and a warning against premature provider abstraction | Agreed, and the prior review's argument is stronger: Higgsfield already *is* the multi-model abstraction (Seedance, Kling, Nano Banana, GPT Image, Seedream, Flux). An adapter over an aggregator is abstraction twice. Keep receipts provider-neutral, build the client directly. |
| §16: "do not invent cost estimates when reliable pricing information is unavailable" | Reliable pricing **is** available via `get_cost`. Use it. |
| §25: "do not commit to migration until the existing code and persistence model have been inspected" | Inspected. There is no persistence model. Commit to SQLite. |
| §28: V1 includes "storyboard view where existing implementation supports it" | No existing implementation supports it. This is a build or a cut. **Recommend cutting it from V1**, per §9 below. |
| §30: the first pass must make no code changes | Honoured. Nothing was modified. |
| Design rule 12: preserve working existing Hub code | No code to preserve. Rule is inert. |

One conflict inside the spec itself, worth resolving before building: §5 and §28 both reject a single imposed linear workflow, while the existing `production-bible-builder` is an explicitly "strict, non-negotiable" eight-stage wizard. When that skill is wired into V2, the stages must become a checklist, not a sequence, or the app will import the exact rigidity the spec rejects.

---

## 7. Risks

### Data-loss risk: low but real, and it is not where you would expect

There is no database to migrate, so there is no migration data-loss risk. The real exposures are:

1. **The skills library is a synced snapshot, not a source of truth.** It lives at `~/.claude/skills/synced/<bucket-id>/` with a `manifest.json` and a `.bucket-*` marker, meaning it is pushed down from your Claude account. **Editing these files directly risks being overwritten by the next sync.** The gap report flagged this too. Before V2 touches anything in the library, establish where these skills are actually authored. 238 KB of banana-pro prompt grammar is not something to lose to a sync.
2. **Craft is a third-party dependency holding production truth.** Every story bible, character roster, shot list and credit ledger currently lives in someone else's product, joined by free-text project names. Export everything to disk before V2 starts reading from SQLite, not after.
3. **Generation history that was never recorded is already lost.** Every generation made before V2 exists has no receipt, no take and no shot binding, and cannot be reconstructed beyond what `transactions` still returns. Pull the full Higgsfield transaction history to a local file now, before it ages out. That is the only recoverable part of the past.
4. **Higgsfield output URLs expire.** Any media still living only as a provider URL is on a clock. This is a today problem, not a V2 problem.

### Technical debt in the existing library

- **Engine facts are duplicated across at least four skills.** The Seedance 2.0 vs 2.5 spec table appears verbatim in `production-bible-builder`, `storyboard-to-video-workflow` and `cinematic-shotlist-director`, each with a header saying `video-prompt-director` owns it and wins on disagreement. The precedence rule is good discipline; the duplication is still four places to update when Higgsfield ships a change. V2 should read these facts from one place, ideally from `models_explore` at runtime rather than from a Markdown table at all.
- **`higgsfield-content-factory` documents a slug-mismatch workaround** between `show_marketing_studio.mode` and `generate_video.mode`. That is a provider bug being carried in skill text. V2 should encode it once in the client with a comment naming the date it was observed, and test whether it still applies.
- **No skill has any test.** The shuohao gap report's whole thesis was that their quality is enforced by code (1,170 passing assertions) and yours is enforced by prose. That remains true.
- **`credit-watch` depends on a hardcoded Craft folder ID.** Fine for a skill, not fine for an app.

### Build risks

- **The output fetcher is the thing that will quietly not get built.** It is unglamorous, it has no UI, and everything works fine in testing without it right up until a URL expires and a selected take is gone. Build it in the same commit as job completion, not later.
- **Concurrency limits are a hard constraint.** The prior review notes ULTRA allows 8 concurrent videos. A poller that ignores this will fail in ways that look like provider flakiness.
- **Whether failed jobs consume credits is still unknown.** It changes retry economics and it is one cheap test.
- **Seedance 2.5 in-prompt cut timing is unverified.** The `SPEC-vertical-drama-pipeline.md` risk register calls this "the biggest technical risk in the whole plan": if Seedance does not honour cut marks inside one generation, the segment-and-cut structure becomes an editing plan rather than a single-generation plan, which changes cost and workflow substantially. This affects how the Shot-to-generation relationship is modelled, so resolve it before the Shot schema is fixed. One test.
- **Scope risk.** Spec §28's V1 list is roughly twenty items. The milestone is nine. See below.

---

## 8. What the milestone actually requires

Target: **Production → visual Shot → Character/Variant + References → Higgsfield Generate → async job → downloaded output → Take → cost/receipt → compare → select/reject.**

Stripped to what must exist for that one sentence to be true end to end:

Production, Shot, Character, Character Variant, Reference (with cached `media_id`), a Higgsfield client, preflight via `get_cost`, a job state machine, a poller, an output fetcher with hashing, Take, receipt, cost record, a board that shows shot cards, and a compare view with select and reject.

**Not required for that sentence:** Story DNA, Techniques, Model Knowledge, Assets as a global area, Home dashboard, Episodes, Beats, Scenes, Props, Audio, Feedback Rounds, Deliveries, storyboard grid, PDF export, keyword library, workflow templates, infinite canvas with pan and zoom.

That is the difference between a nine-item build and a thirty-item build, and the spec's own §28 "Defer" list supports the cut.

---

## 9. Recommended implementation sequence

Do not implement any of this yet. This is the proposed order for review.

**Phase 0: resolve the unknowns.** Half a day, and it changes the design.

1. ~~Confirm where the app is, if it exists.~~ **Done. Greenfield confirmed, 19 September 2026.**
2. Confirm where the skills are authored, so edits are not lost to sync.
3. Export all Craft production documents and the credit ledger to disk.
4. Pull full Higgsfield transaction history to a local file.
5. Decide the stack. The spec never names one. Recommendation in §10: local-first SQLite, small Node or Python server, browser UI, media and Markdown on disk. **This is the one item blocking Phase 1.**
6. Read the Higgsfield **REST** API docs, not just the MCP surface, and confirm: `get_cost` availability, job polling shape, concurrency cap, whether failed jobs charge.
7. One cheap test: does Seedance 2.5 honour in-prompt cut timing?

**Phase 1: the spine.** Nothing visual. SQLite schema for Production, Shot, Character, Character Variant, Reference. Shot schema ported from `cinematic-shotlist-director`'s existing shot record. Stable IDs throughout. A seed script that creates one real Production from an existing Craft export, so the schema is tested against real data rather than a fixture.

**Phase 2: the reference library.** Upload, `media_confirm`, cache `higgsfield_media_id` on the row, SHA-256, intent include and exclude carried over from the binding map, scope, lifecycle. This pays for itself immediately: a character sheet uploads once and is reused forever.

**Phase 3: generate, and this is where it becomes real.** Preflight panel with `get_cost` plus live balance plus a session cumulative ceiling. Submit. Job state machine. Poller respecting concurrency. **Output fetcher in the same commit as completion.** Hash, store, record metadata. Take created. Receipt written immutably. Cost recorded with balance before and after.

At the end of Phase 3 you can generate a Seedance clip from a Shot and never lose it. That is the point at which the app is worth using daily, and everything after is improvement rather than foundation.

**Phase 4: review.** Board view with shot cards, thumbnails, take count, status, spend per shot. Playback. Side-by-side compare. Select, reject, maybe. Rejection reasons from spec §18.

**Phase 5: handoffs.** "Copy Full Shot Context", "Copy for AI Director", "Copy for Video Prompting". Cheap, and this is what keeps the 44-skill library useful instead of stranded. Do this before adding any creative intelligence into the app itself.

**Phase 6 and beyond, in rough value order:** documents on disk with locked/working/back-burner states, Scenes and Beats, cost analytics, Audio, feedback rounds and delivery versions, storyboard view, the richer canvas.

The prior review's ordering argument holds and is worth restating: the first version does not need a storyboard. It needs to make a Seedance clip cheaper and more traceable than doing it in the browser. If it does that, it gets used daily and the rest gets built around real usage.

---

## 10. Confirmed greenfield, and what that changes

The open question in the first draft of this audit was whether the application existed somewhere I had not looked. **Cy confirmed on 19 September 2026 that it has not been built.** The audit stands as written.

Three consequences follow, and they should be applied to the spec before anyone builds from it.

**1. Spec Section 4 must be amended.** It currently instructs an implementer to preserve sixteen capabilities that do not exist, and design rule 12 tells them not to rewrite working code that is not there. Together those are how a greenfield build acquires imaginary constraints. Replace Section 4 with what this audit's §2 records: the assets to preserve are the 44-skill knowledge library and the Craft production documents, and they are preserved by being *read from and handed off to*, not by being ported into the app.

**2. The sequencing argument gets stronger, not weaker.** With nothing to migrate, there is no reason to build breadth before depth. The nine-item milestone in §8 is now the whole of V1, and every deferred item in §9 Phase 6 is genuinely deferrable rather than politically deferred.

**3. The stack is now the only blocking decision.** The spec never names one. Nothing in §9 Phase 1 can start until it is chosen. The recommendation, stated plainly so it can be argued with:

> **Local-first: SQLite via a small Node or Python server, plus a browser UI. Media on disk beside the database. Prose as Markdown files on disk.**

The reasoning, in the order it matters:

- **Local-first is a cost decision, not a taste one.** The entire motivation for V2 is controlling Higgsfield spend. A hosted app adds a bill before it saves a credit.
- **SQLite satisfies spec §25 directly** and is one portable file, readable with standard tools, no server process to run, no migration story for a single user.
- **The browser is required by spec §5 and §21.** The Board and the compare-takes view need thumbnails, playback and side-by-side video. That is a browser, not a terminal.
- **Node has the smaller gap to close** if the Higgsfield REST API is the target, because the MCP surface is already JSON over HTTP and the existing `screenwriter` build scripts are already Node. Python is defensible if you prefer it; `qc.py` and `cutsheet.py` are Python and V2 shells out to them either way.
- **Do not reach for a framework yet.** One server file, one schema file, one page. The thing that makes V1 valuable is the receipt and the output fetcher, not the component library.

This is a recommendation, not a decision. Say the word if you would rather it were Python, or hosted, or built on something you already know.

---

*Prepared by Claude (Opus 5) in a Claude Code session, 19 September 2026. No code was modified. Findings on the skills library come from reading the synced snapshot at `2026-09-19T13:39:56Z`. The `get_cost` correction comes from the live Higgsfield MCP tool schema. Uncertainties are flagged rather than smoothed over.*
