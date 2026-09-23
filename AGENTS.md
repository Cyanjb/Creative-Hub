# Agent brief

For Codex and any coding agent that is not Claude Code.

**Read [`CLAUDE.md`](CLAUDE.md) in this directory. It applies to you too.** It is short and it
carries the full brief: what this repo is, what is deliberately not in it, where the live status
lives, and the question that blocks two projects.

The four things worth repeating here, because missing one of them causes real damage:

1. **`.env` never enters git.** The app keeps API keys there and the Express proxy reads them.
   One committed `.env` publishes working keys for Higgsfield, Runway and OpenArt, and deleting
   the file afterwards does not undo it. `.gitignore` blocks it. `PUSHING-THE-APP.md` step 5 is
   the check. Run it before any commit that adds files under `app/`. Never `git add -A` on a
   fresh import without reading `git status` first.

2. **This repo is the app and nothing else.** The skills library moved to
   [`Cyanjb/cy-skills`](https://github.com/Cyanjb/cy-skills) on 21 September 2026. If you find
   yourself about to merge a branch that brings back `skills/` or files named
   `GAP-REPORT-*`, `SPEC-vertical-*`, `EDITS-to-*` or `V2-RECONNAISSANCE-*`, stop. Those were
   removed on purpose. A merge that resurrects them has undone a decision, not preserved work.

3. **The app exists.** It is under `app/` on `main`, 69 files, with tests in `app/tests/`. A
   session that could see only `main` once concluded the project had never been built, because
   at that time the code really was absent. It is not absent now. Look before you conclude.

4. **There are two copies of this app.** `app/` on `main`, and a live one at
   `C:\Users\cyanj\Creative Hub` on a Windows machine. `app/` has moved past the live folder.
   Do not edit both. Which one is authoritative is a decision recorded in Craft, not here.

## Where the rest of it is

| What | Where |
|---|---|
| Live status, decisions, open questions | Craft: Coding Projects → Creative Hub → "5. V2 Status & Cross-Chat Log" |
| The app | `app/` on `main` |
| Skills, the vertical-drama pipeline, the planning specs | [`Cyanjb/cy-skills`](https://github.com/Cyanjb/cy-skills) |
| How the app was imported safely | `PUSHING-THE-APP.md` |

Craft is the source of truth for **what was decided and why**. This repo is the source of truth
for **what the code is**. When they disagree about code, the repo wins. When they disagree about
intent, Craft wins.

## The user

Cyan is an AI creative director and educator, not a programmer. Explain in plain English, say
what a command will do before running it, and do not assume code literacy. She prefers
directness over hedging, and no em dashes.
