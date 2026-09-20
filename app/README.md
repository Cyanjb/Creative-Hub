# Creative Hub

An AI workflow and storyboard app. Infinite whiteboard, colour-coded pipeline wiring, a
structured storyboard grid, and a character bible / world builder / script room whose
contents follow through into every prompt on every board.

Local-first: all data lives in your browser, all API keys live in a `.env` on your machine.

```bash
npm run dev
```

Web app on http://localhost:5273, API on http://localhost:8787.

## What's here

**Whiteboard** — infinite canvas with pan, zoom, toggleable grid and snap. Three node types:

- **Frames** — the structured shot unit. Scene, shot number, title, subtitle, exactly one
  primary image slot, and collapsible Prompts / Notes / Shot detail sections. Icon-only mode
  for pipeline boards.
- **Image cards** — free floating, draggable, resizable, rotatable, captioned.
- **Text blocks** — draggable, resizable, editable.

**Wires** — drag from a frame's right port to another's left port. White = image, purple =
video, yellow = text. Click a wire to select it, click the ✕ to delete. This is pipeline
documentation, not executable node logic.

**Storyboard view** — the same frames as a 4-across grid grouped by scene, with
Image / Description / Audio / Video / Prompt summary per cell. Edits flow both ways.

**The ecosystem** — character bible, world builder, script room. Write `@Nova` in any prompt
and her canonical description resolves and travels with it. That's what stops a model
inventing a new version of the character on every generation.

**Support** — 7 prompt enhancers, a 90-term searchable cinematography glossary, a character
sheet builder with a photoreal/animated fork, asset carousel, tagging, `Ctrl-K` global
search, autosave, PDF export, saved workflow templates.

## Setup

```bash
cp .env.example .env   # then fill in whatever keys you have
```

Every key is optional. Everything except the AI features works without any of them. Check
the Integrations panel (plug icon) for connection status.

| Key | Powers |
|---|---|
| `ANTHROPIC_API_KEY` | Prompt enhancement, character/world generation, scene breakdown |
| `OPENAI_API_KEY` | Alternative text engine |
| `GEMINI_API_KEY` | Nano Banana image generation |
| `RUNWAY_API_KEY` | Image → video |
| `HIGGSFIELD_API_KEY` | Character plates, Soul Cinema, motion |
| `OPENART_API_KEY` | Image generation, style models |

Keys are read by `server/index.js` and never reach the browser. That's also why the server
exists at all — Anthropic, OpenAI and Runway all block direct browser calls.

## Controls

| | |
|---|---|
| Pan | Space-drag, middle-drag, alt-drag, or two-finger trackpad scroll |
| Zoom | Ctrl + wheel, or plain mouse wheel |
| Select | Click, shift-click to add, drag on empty canvas to marquee |
| Delete | `Delete` / `Backspace` |
| Duplicate | `Ctrl-D` |
| Select all | `Ctrl-A` |
| Search | `Ctrl-K` |
| Fit to content | `1` |
| Reset zoom | `0` |

## Editing how it writes

Everything the app knows about prompting, cinematography and story lives in
**`src/lib/promptTemplates.ts`**. Nothing else contains prompt text. Change a string there
and the enhancers, sheet builder, generators and AI calls all change with it.

The cinematography glossary is `src/lib/keywordLibrary.ts`.

See `docs/SKILLS-AUDIT.md` for where this material came from and which sources conflict.

## Data

- Structure → `localStorage` (`creative-hub:v1`), autosaved on a 5s debounce
- Image blobs → IndexedDB (`creative-hub-assets`)

Board JSON only ever stores asset ids, never bytes — image data would blow localStorage's
~5MB quota after a couple of drops.

**Your data lives in one browser profile.** Use the project **Backup** button for a real
JSON export before clearing browser data.

## Scripts

| | |
|---|---|
| `npm run dev` | Web app + API together |
| `npm run dev:web` | Vite only |
| `npm run dev:api` | Proxy server only |
| `npm run build` | Typecheck and production build |
| `npm run typecheck` | Types only |
