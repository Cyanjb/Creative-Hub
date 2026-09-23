# Creative Hub

A canvas and storyboard app for AI video pre-production. V1 was built on 3 August 2026 and runs.
V2 adds durable state: canonical Shots, SQLite persistence, Takes, receipts, cost tracking.

**This repository is the app and nothing else.** The skills library moved to
[`Cyanjb/cy-skills`](https://github.com/Cyanjb/cy-skills) on 21 September 2026. Neither repo
governs the other.

## Before you conclude anything

- **The app is here, under `app/`.** It was not, until 23 September 2026, and a session that
  could see only `main` once concluded the project had never been built. That was wrong. Check
  `app/` before saying anything does not exist.
- **The live V1 also runs from `C:\Users\cyanj\Creative Hub`** on a Windows machine, with its
  own docs in `docs/` there. `app/` on `main` has moved past it. **They are not the same thing
  and must not both be edited.** Which is authoritative is recorded in Craft, not here.
- **Craft holds live status**, at Coding Projects → Creative Hub → "5. V2 Status & Cross-Chat
  Log". It is the source of truth for decisions, open questions and what changed when. This repo
  holds artifacts. If the Craft connector is attached, read that document before starting work.

## Stack

Vite, React 18, TypeScript, Zustand. Express credential proxy on port 8787. Local-first: no
deployment, data in the browser, keys never reach the browser.

## The one rule that matters

**`.env` never enters git.** The app keeps API keys there and the Express proxy reads them. A
single committed `.env` publishes working keys for Higgsfield, Runway and OpenArt, and deleting
the file afterwards does not undo it.

`.gitignore` blocks it. `PUSHING-THE-APP.md` step 5 is the check. **Run that check before any
commit that adds files under `app/`**, and never use `git add -A` on a fresh app import without
reading `git status` first. As of 23 September 2026, `.env` has never been committed on any
branch. Keep it that way.

## Working here

- `main` is the trunk and carries the app. Topic branches merge into it.
- Before merging a branch created before 21 September 2026, check whether it would resurrect
  `skills/` or the planning documents, which were deliberately removed. A merge that brings them
  back has undone a decision rather than preserved work.
- App tests live in `app/tests/`. Run them before pushing changes to `app/`.

## The open question that blocks two projects

**Does Seedance 2.5 honour in-prompt cut timing inside one generation?**

The app's Shot model assumes it does. So does the shots stage of the vertical-drama pipeline in
`cy-skills`. One three-cut segment settles it for both. It has not been run. Do not design
around an assumed answer, and if you do run it, record the result in Craft where both projects
can see it.

## Tone

Cyan is an AI creative director and educator, not a programmer. Explain in plain English, do not
assume code literacy, and say what a command will do before running it. She prefers directness
over hedging and no em dashes. Free and open-source tools over new paid subscriptions.
