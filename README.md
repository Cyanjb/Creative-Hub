# Creative Hub

The Creative Hub app: a canvas and storyboard tool, V1 built on 3 August 2026 and running,
moving to V2. **This repository is about the app and nothing else.**

> **Read this before concluding anything about what exists.**
>
> - **The live V1 app runs from `C:\Users\cyanj\Creative Hub`** on a Windows machine. That
>   folder is the original. Its documents are in `C:\Users\cyanj\Creative Hub\docs\`
>   (`V2-RECONNAISSANCE-AUDIT.md`, `Claude-Architecture-Review-Creative-Hub.pdf`, and others).
> - **In this repo the app lives under `app/`**, on the branches listed below. On `main`, at the
>   time of writing, there is no `app/` yet: the V1 import and the V2 work are on branches that
>   have not been merged. An AI that can see only `main` has already once concluded the project
>   was never built. That conclusion was wrong. Do not repeat it.
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
| `main` | The trunk. `.gitignore`, this README, `PUSHING-THE-APP.md`. |
| `add-v1-app` | The V1 app imported into `app/`, unchanged. |
| `v2-foundation` | V1 plus the V2 foundation: shared validated domain, revisioned SQLite persistence, durable canonical Shots, browser acceptance. Developed further than the live folder. |

Working branches are named `claude/<topic>-<id>` and are merged into `main` when their work
lands.

## Files on `main`

| File | What it is |
|---|---|
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
