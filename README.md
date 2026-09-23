# Creative Hub

The Creative Hub app: a canvas and storyboard tool, V1 built on 3 August 2026 and running,
moving to V2. **This repository is about the app and nothing else.**

> **Read this before concluding anything about what exists.**
>
> - **The live V1 app runs from `C:\Users\cyanj\Creative Hub`** on a Windows machine. That
>   folder is the original. Its documents are in `C:\Users\cyanj\Creative Hub\docs\`
>   (`V2-RECONNAISSANCE-AUDIT.md`, `Claude-Architecture-Review-Creative-Hub.pdf`, and others).
> - **In this repo the app lives under `app/` on `main`.** The V1 import and the V2 foundation
>   were merged there on 23 September 2026. An AI that could see only `main` has already once
>   concluded the project was never built. That conclusion was wrong then and there is no excuse
>   for it now: look in `app/`.
> - **The skills library is not here any more.** Cyan's Claude skills, the vertical-drama
>   pipeline, the shuohao gap report and the planning specs moved to their own repository,
>   [`Cyanjb/cy-skills`](https://github.com/Cyanjb/cy-skills), on 21 September 2026. Nothing in
>   that repo governs this one and nothing here governs it.
> - The live status of everything is in Craft: **Coding Projects → Creative Hub → "5. V2 Status &
>   Cross-Chat Log"**. That document is the single source of truth. This repo holds artifacts.

---

## Branches

| Branch | What it holds |
|---|---|
| `main` | **The trunk, and everything.** The app under `app/`, plus the V2 foundation. Start here. |
| `add-v1-app` | Merged into `main`. Fully contained in `v2-foundation`. Safe to delete. |
| `v2-foundation` | Merged into `main`. Safe to delete. |

Working branches are named `claude/<topic>-<id>` and are merged into `main` when their work
lands.

**Before merging any branch created before 21 September 2026**, check whether it would bring back
`skills/` or the planning documents. Those were deliberately removed when the skills moved to
`cy-skills`. A merge that resurrects them has undone a decision, not preserved work.

## Files on `main`

| File | What it is |
|---|---|
| `CLAUDE.md` | Loaded automatically by every Claude Code session. The short brief: what this repo is, the one rule about `.env`, and the open question that blocks two projects. |
| `app/` | The application. V1 as built, plus the V2 foundation and its tests under `app/tests/`. |
| `PUSHING-THE-APP.md` | How the V1 app was copied into `app/` without its secrets, and the checks to run before any commit that touches `app/`. **Step 5 is the one that matters.** |
| `.gitignore` | Blocks `.env`, `node_modules`, `dist`, `.vite` and local runtime data. `app/` carries its own copy. |

## The two things that must stay true

1. **`.env` never enters git.** The app keeps API keys in `.env` and the Express proxy reads
   them from there. If that file is ever committed and pushed, the keys are published and must
   be revoked. `.gitignore` blocks it; `PUSHING-THE-APP.md` step 5 checks it. Do not skip the check.
2. **The live folder and `app/` are not the same thing.** `v2-foundation` has moved past the
   live V1. Which one is the truth going forward is a decision recorded in Craft, not here. Do
   not edit both.

## The shared blocker

**Does Seedance 2.5 honour in-prompt cut timing?** The app's Shot model depends on the answer,
and so does the shots stage of the vertical-drama pipeline in `cy-skills`. One three-cut segment
settles it. Run it once, tell both projects.
