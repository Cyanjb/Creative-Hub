# Skills Audit — source materials for Creative Hub's prompt layer

Audit of the 13 files supplied on 2 Aug 2026. Verdict per file, then the
duplicates/contradictions worth acting on.

## Verdict table

| File | Size | Verdict | Reason |
|---|---|---|---|
| `video-prompt-director` | 10KB + 5 refs (127KB) | **KEEP — primary video authority** | Newest. Router over 3 engines (Seedance/Kling/Veo) × 2 rigor tiers. Absorbs the others. |
| `banana-pro-director-3.0` | 128KB | **KEEP — primary photoreal image authority** | v3.0, largest, most current. 6 modes. Supersedes character-builder for photoreal. |
| `character-builder` | 51KB | **KEEP — but only for Path B (anime/cel)** | Superseded for photoreal, but it is the **only** source of cel-shaded grammar (15 refs vs 1). |
| `story-bible-builder` | 15KB + 3 refs | **KEEP — unique** | Canon-doc interview. No overlap with anything else. |
| `screenwriter` | 8.6KB + 8 files | **KEEP — unique** | McKee/Campbell/Aristotle, Hollywood .docx. ⚠️ Written in Russian. |
| `storyboard-to-video-workflow` | 20KB + 2 refs | **KEEP — unique** | Nano Banana 2 sheet → Seedance animation. The only end-to-end workflow. |
| `ai-director-emotioanl.md` | 300 lines | **KEEP — unique** | Emotion→technique decision tables. Nothing else maps feeling to lens/light/cut. |
| `cinema-director` | 44KB | **MERGE then retire** | Seedance/Higgsfield block grammar. ~80% inside seedance-locked. Unique bits below. |
| `cinema-worldbuilder-pro-2.0` | 60KB | **RETIRE — fully absorbed** | 100% of its H2 headings appear in `video-prompt-director/references/seedance-locked.md`, near-identical byte size. Same document. |
| `seedance-prompt-writer` | 47KB + ref | **RETIRE — superseded** | Seedance-only ancestor of video-prompt-director. Its `cinematography.md` (14KB) is a strict subset of the newer one (25KB). |
| `seedance2-prompt-director (1).md` | 324 lines | **RETIRE — superseded** | Loose early draft. Omni Reference + Hook Rule both survive in `references/seedance.md`. |
| **`Joey's Cinema Skill Files.zip`** | 89KB | **DELETE — pure duplicate** | Contains nested zips of banana-pro-director-30, character-builder, cinema-director, story-bible-builder. **All four verified byte-identical (md5) to your standalone copies.** Zero unique content. |
| `Best Character Sheet Prompt.pdf` | 29KB | **KEEP — but revise** | See contradiction #1. |

**Net: 13 files → 7 live sources.** Delete 1, retire 4, merge 1.

## Duplicates

1. **Joey's Cinema Skill Files** is a wrapper around four zips you already have standalone. MD5-identical, all four. Safe to delete outright.
2. **cinema-worldbuilder-pro-2.0 ≡ seedance-locked.md.** Not "similar" — the same doc under two names. Keeping both means two copies of the M1–M5 grammar drifting apart.
3. **Two `cinematography.md` files.** seedance-prompt-writer's 14KB version vs video-prompt-director's 25KB version. The larger is a superset (adds 16 named movements, transitions, effects, narrative patterns).

## Contradictions worth resolving

### 1. Your character-sheet PDF vs banana-pro-director-3.0 — panel count

Your PDF specifies **7 panels** (4 full-body + 3 close-up portraits) in one image.
banana-pro-director-3.0 argues directly against this:

> "the sheet is one image with a fixed pixel budget. Six cells splits that budget six ways, and the face — the one thing the sheet exists to lock — lands in cells too small to hold real identity detail."

It makes 3-panel the locked default and 6-panel legacy-on-request-only. **Your 7-panel
layout is one panel worse than the layout that skill explicitly deprecates.**

This is a real trade-off, not a bug: your sheet optimises for *human-eye reference*
(a person flipping through angles), the skill optimises for *machine identity anchoring*
(a downstream model reading the face). Both are valid for different jobs.

**Resolution shipped in the app:** both exist as separate presets. Your 7-panel is
`character-sheet-contact` (labelled "human reference"), the 3-panel is
`character-sheet-3panel` (labelled "identity anchor — feeds video"). The picker says
which is which so the choice is deliberate.

### 2. Backdrop value

- Your PDF: *"simple, neutral background, similar to a studio or indoor wall"* — unlocked.
- banana-pro / character-builder: **even neutral 18% gray, one uniform value corner to corner**, no gradient, no hotspot, no vignette, no cast shadow.

The skills give a reason your PDF doesn't have: high subject/background contrast bakes
halo and edge-breathing into downstream video. Gray is the low-contrast fix.
**Resolved:** the app's presets take the locked 18% gray language, and keep your
"documentary, not stylized" intent — those don't conflict.

### 3. Headless front panel

banana-pro's 3-panel puts a **headless** figure in the left cell to isolate garment and
silhouette. Your PDF has the head on every panel. Genuine philosophical split
(garment-isolation vs identity-consistency). Kept as an explicit toggle rather than
silently picking one.

### 4. Photoreal vs animation — the gap you flagged

You were right that the PDF is photoreal-only. Its constraint list actively fights
animation: *"Not a 3D render / Not CGI / Not a game character / Not stylized."*
Dropped into an anime job those lines force the model back to photoreal.

`character-builder` Path B has the missing half — a 5-register sub-style fork
(modern TV anime / 90s cel / manhwa / shonen / shojo) and, critically, an **inverted
negation battery** (`no photographic texture, no photorealistic skin, no film grain,
no depth-of-field falloff…`). Without it, cel prompts drift into smooth semi-realistic
digital painting.

`ai-director-emotioanl.md` adds the third piece: *"Forbidden vocabulary — 'realistic',
'photographic', 'normal proportions'. Never use them in stylized prompts."*

**Resolved:** the character-sheet preset now has a **style fork** — Photoreal or
Animated — that swaps the whole render stack *and the negation battery*, rather than
just appending "anime style" to a photoreal prompt.

## Unique content rescued from retired files

Before retiring, these were pulled into the app's prompt layer:

- **cinema-director** — lipsync bilabial closure protocol, strobe grammar, FOV degree table, diegetic-only audio rule.
- **seedance2-prompt-director** — the Hook Rule (open mid-action, never at the start of an action).
- **seedance-prompt-writer** — keyword degradation list (words that measurably hurt output).
- **ai-director-emotioanl** — the Turn (one hard cut from peak energy to stillness per film), the 6-beat intensity curve, emotion→shot/lens/light tables.

## Craft Prompt Library (reviewed 3 Aug 2026)

Folders reviewed: **Prompt Library** (15 docs), **Keyword Library** (4 docs),
**Prompt Library/Skills** (1), **Prompt Library/LLM** (1).

### Pulled into the app

| Craft doc | Where it landed |
|---|---|
| `Cinematography Keyword Library` | **`src/lib/keywordLibrary.ts`** — all ~90 terms across 10 categories, searchable, one-click insert into any prompt block. The single most directly reusable thing in the library. |
| `Nike-Style Product Ad Workflow` | Built-in workflow template — 15-shot grid, CAMERA/SOUND/MOTION per frame, sound-and-motion arc. |
| `Fluffy Character Dance Video Workflow` | Built-in workflow template — 16-panel beat map with loopable bookend. |
| `100 Cinematic Camera Prompts` | Feeds the camera-move vocabulary in the enhancers. |

### Duplicate found

`Prompt Library/Character sheet` is an **earlier, thinner draft** of your
`Best Character Sheet Prompt.pdf`:

> "show me this same exact woman on a white background including full body (front, sides and back), half body, head shot…"

Same intent, but it specifies a **white** background — which the later PDF and both
Higgsfield skills replaced with neutral gray for the edge-contrast reason in
contradiction #2. The PDF supersedes it. Safe to archive the Craft version.

### The shape all your workflows share

Nike ad, fluffy dance, storyboard-to-video and consistent-character all run the same
spine, at different panel counts:

> **lock character → first frame → N-panel storyboard sheet → motion prompt → animate → loop**

That is now what the **Pipeline Recorder** template builds, rather than a generic
six-box chain. The panel count is the only real variable (15 for the ad grid, 16 for
the beat-locked dance loop, 3–8 for narrative).

### Not yet pulled in

`Swapping characters`, `Kling 3.0 Multi Shot Prompt`, `Product Photos`,
`Nano Banana Pro or 2 Prompts`, `Seedance Prompts`, `GPT Image 2`, `Image + Seedance`,
`Style Index Storyboard Template`, `Red-Line Drone Path Technique`,
`AI Architectural Visualisation Workflow`, `Midjourney bot prompt`,
`Prompt for article writing`. These are individual prompts rather than systems — they
belong in the app as **saved workflow templates you create from a board**, which is a
feature rather than something to hard-code. Say the word if you want any promoted to
built-ins.

## Note on `screenwriter`

Fully in Russian, including all 8 support files. It is methodologically the strongest
story-structure asset in the set. The app's Script Writer uses its *method* (causality
auditing, value-charge movement per scene, one-version-at-a-time revision) with
English labels. The original skill is untouched — flagging it because a Russian-only
skill may surprise you later.
