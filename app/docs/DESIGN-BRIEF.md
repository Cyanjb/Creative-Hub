# Creative Hub — design brief

Paste everything below the line into Claude Design.

**Attach these images** — they matter more than the prose:
1. The reference whiteboard (the story-bible canvas with named sections).
2. Screenshots of the current app: `npm run dev` → localhost:5273. Grab the
   storyboard grid, the whiteboard with pipeline wires, and one frame card close up.

---

I have a working app that does what I want functionally, but the interface feels
complicated and I want it redesigned. I need layout and information-architecture
help, not a colour change. Be opinionated — if the honest answer is that two
features should be one, or that something should be cut, say so. I'd rather have a
simpler tool than a complete one.

## What the app is

**Creative Hub** — a solo tool for planning AI-generated films. One person uses it
to work out what they're going to make before they burn credits generating it.

It merges four things that normally live in separate tools:

- an infinite whiteboard for dumping images and thinking spatially (like Figma)
- colour-coded connectors that document a production pipeline (like flora.ai) —
  these are *documentation*, not executable logic
- a structured storyboard grid (like professional film software)
- a character bible, world builder and script room whose contents get injected
  into AI prompts automatically

I'm one person, not a team. No permissions, no collaboration, no notifications.
Everything is local and offline — no accounts, no sharing UI.

## The core object

Everything revolves around a **Frame** — one shot. The same Frame renders two ways:

- On the **whiteboard**, as a draggable card wired to other frames
- In the **storyboard**, as a cell in a 4-across grid grouped by scene

A Frame holds: scene name, shot number, title, subtitle, exactly one image, any
number of prompt blocks (each tagged image/video/text/audio), notes, description,
audio note, video note, and links to characters and locations.

## Everything currently on screen

**Top bar:** back to hub, editable board name, save status, wire-colour picker
(3 options), whiteboard/storyboard toggle, search, export menu, sidebar toggle.

**Left toolbar (12 icons):** add frame, add image, add text, templates, character
bible, world builder, script room, asset carousel, grid toggle, snap toggle, fit
to view, integrations.

**Right sidebar (5 tabs):** resources, links, notes, assets, cinematography
keyword glossary.

**Bottom:** an asset carousel strip you drag images out of.

**Five full-screen overlays:** character bible, world builder, script room,
templates, integrations.

**Inside every frame card:** four editable header fields, an image slot, and three
collapsible sections — Prompts (each prompt block has a type dropdown, a label
field, an enhance button and a delete button), Notes, and Shot detail.

## What's wrong with it

I built it feature-first and it shows.

1. **Nothing is progressively disclosed.** The interface is exactly as dense when
   I'm sketching as when I'm writing final prompts. It should get out of the way
   when I'm thinking and get precise when I'm specifying.

2. **The frame card is five tools in one object.** It's simultaneously a title
   card, an image holder, a prompt editor, a notes field and a metadata form. At
   30% zoom it's unreadable; at 100% it's overwhelming.

3. **Too many places for things to live.** Five overlays plus a five-tab sidebar
   plus a carousel is at least three too many surfaces. I shouldn't have to
   remember which of eight places my reference image is in.

4. **Two mental models fight each other.** The freeform canvas and the rigid
   4-across grid are the same data, but switching between them feels like
   switching apps rather than changing lens.

5. **Chrome outweighs content.** Twelve toolbar icons and eight top-bar controls
   frame a canvas that is the actual point of the app.

## What I want it to feel like

A sketchbook that happens to be rigorous. Calm by default, precise on demand.
Closer to Linear or Things than to Premiere or a CMS admin panel. The creative
work should be the loudest thing on screen; everything else should recede until
asked for.

**The attached reference whiteboard is the feeling I'm after.** It's a story bible
laid out on an infinite canvas. What it gets right:

- **Named sections are first-class objects on the canvas.** Two large tinted,
  bordered, titled regions — `# story` and `# assets` — group everything inside
  them. Structure without a rigid grid. My canvas has no grouping concept at all,
  just loose cards floating in space.
- **Grouping nests inside those sections** — within `assets`, subheadings for
  Characters / Environments / Props, each with its own row of cards.
- **Every card is an image plus exactly one caption line.** "royal gown and
  armor". "Lumin Palace·day·exterior". "intact overall view". The caption is a
  short state descriptor, not a form. All the depth lives elsewhere.
- **The written bible is one long reading column**, using typographic hierarchy —
  italic serif headings, bold run-in labels — rather than a stack of labelled
  input fields. It reads like a document, not a CMS.
- **Chrome is almost entirely absent.** A zoom control and undo/redo in the
  bottom-left corner is the whole interface. The canvas is the UI.
- **One image can carry a lot.** A character card holds a single multi-view
  turnaround image, so one small card shows front/side/back at a glance.
- Generous whitespace, hairline borders, calm and editorial.

**The caveat, so we don't fool ourselves:** that reference is a whiteboard you
*read*. It has no wires, no editable prompt fields, no input affordances at all.
So it solves problems 2 and 3 above beautifully, and says nothing about 1 or 4. I
still need an answer for how wiring and prompt-writing work without dragging all
the density back in — that's probably the hardest part of this brief.

I want the *organising principles* of that reference — sections, nested groups,
minimal cards, document-as-document — applied to a canvas that also has to
support interaction.

## Constraints

- **Colour:** the app is currently dark with neon cyan and magenta accents. I'm
  attached to that, but the reference I love is light and airy, and I suspect some
  of its calm depends on the pale ground and hairline borders. **Show me both** —
  a dark version and a light version — and tell me which you think serves
  image-heavy creative work better. Either way the neon is currently overused; I'd
  rather it *meant* something (active, selected, live) than be decoration.
- **Desktop web**, often used in a narrow window. Can't assume 1600px.
- **Must keep:** the infinite canvas; one Frame rendering in two views;
  colour-coded wires (white = image, purple = video, yellow = text); and the
  ability to see a character's saved description while writing a prompt.

## What I'm asking for

1. **A whiteboard layout built on named sections**, in the spirit of the
   reference — how sections and nested groups should look, how a card reduces to
   an image plus one caption, and how I create and name a section.

2. **A redesigned frame card with real zoom tiers.** At 30% it should read as an
   image plus a title. At 100% it should be editable. Show me the tiers.

3. **An answer for wires and prompt-writing** that doesn't undo the calm. Options
   worth considering: prompts move out of the card into a side panel for the
   selected frame; wires get a dedicated mode rather than always-visible ports.
   Tell me which you'd pick and why.

4. **A better home for "saved stuff"** — characters, locations, images, references,
   notes — than five overlays plus a five-tab sidebar. The reference suggests
   these might belong *on the canvas as sections* rather than in panels. Is that
   right? This is the question I most want answered: if it's yes, three of my five
   overlays disappear and the whole app gets simpler.

5. **Layouts for both screens** — whiteboard and storyboard grid — and a view
   transition that feels like changing lens, not changing app.

If you can only do one thing well, do number 4.
