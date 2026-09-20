/**
 * ════════════════════════════════════════════════════════════════════════
 *  THE PROMPT LAYER — edit this file to change how Creative Hub writes.
 * ════════════════════════════════════════════════════════════════════════
 *
 * Everything the app knows about prompting, cinematography and story lives
 * here. Nothing else imports prompt text. Rewrite a string in this file and
 * the enhancers, templates and AI calls all change with it.
 *
 * Sources (see docs/SKILLS-AUDIT.md for the full audit):
 *   · "Best Character Sheet Prompt" (Cyan)      → CHARACTER_SHEET presets
 *   · banana-pro-director-3.0                   → photoreal render stack, gray plate
 *   · character-builder Path B                  → cel-shaded render stack
 *   · video-prompt-director + refs              → engine rules, shot grammar
 *   · ai-director-emotioanl                     → emotion→technique tables
 *   · cinema-director                           → audio + capture realism
 *   · story-bible-builder / screenwriter        → structure method
 */

// ─────────────────────────────────────────────────────────────────────────
// RENDER STACKS — the closing paragraph that fixes the medium.
// The negation battery INVERTS between the two. That inversion is the whole
// reason a photoreal prompt with "anime" bolted on returns mush.
// ─────────────────────────────────────────────────────────────────────────

export const RENDER_STACK = {
  photoreal: {
    label: 'Photoreal',
    positive:
      'Real photography of a real human. Visible skin pores and fine surface texture, ' +
      'subsurface scattering in the skin, individual hair strands catching light, readable ' +
      'fabric weave, natural asymmetry, realistic lens behaviour and perspective, gentle ' +
      'shadow falloff, fine theatrical film grain.',
    negative:
      'No 3D render, no CGI, no game character, no stylisation, no illustration, no digital ' +
      'painting, no plastic skin, no waxy smoothing, no beauty-filter retouching, no commercial ' +
      'gloss, no Instagram sharpness, no model turnaround.',
  },
  animated: {
    label: 'Animated / Cel',
    positive:
      'Hand-drawn animation production art. Clean deliberate line work, hard-edged tonal ' +
      'separation, flat uniform colour fills inside every shape, hair rendered in clumped ' +
      'wedges and locks rather than strands, cel shadows drawn as deliberate shapes with a ' +
      'stated light direction.',
    // Inverted battery — from character-builder Path B. Without this the model
    // drifts to a smooth semi-realistic digital painting that reads as neither.
    negative:
      'No 3D render, no CGI, no photographic texture, no photorealistic skin, no airbrush ' +
      'gradient shading, no soft blurred rendering, no digital painting blend, no lens blur, ' +
      'no depth-of-field falloff, no film grain, no photographic noise, no bloom, no chromatic ' +
      'aberration, no realistic subsurface scattering, no rendered specular highlights on skin.',
  },
} as const;

export type RenderStyle = keyof typeof RENDER_STACK;

/** Cel sub-registers. Cel work needs the register named or it averages them. */
export const CEL_REGISTERS = [
  {
    id: 'modern-tv',
    name: 'Modern TV anime',
    spec: 'clean thin uniform line in dark brown-black, two-tone cel shading with soft-edged shadow, large multi-layer iris with one to two highlights, bright moderately saturated palette',
  },
  {
    id: 'retro-90s',
    name: '90s cel / retro',
    spec: 'thicker line with slight variation in hard black, two-tone cel shading with hard-edged shadow, rounder simpler iris with a single highlight, muted palette with film-print warmth',
  },
  {
    id: 'manhwa',
    name: 'Manhwa / webtoon',
    spec: 'very fine tapering line often coloured rather than black, three-tone shading with a soft gradient in the hair only, detailed glossy eyes with heavy lower lash, high-key pastel airy palette',
  },
  {
    id: 'shonen',
    name: 'Shonen action',
    spec: 'bold varying line weight with heavy black, two-tone cel shading with hard shadow and strong rim, sharp angular eyes with a small highlight, saturated high-contrast palette',
  },
  {
    id: 'shojo',
    name: 'Shojo',
    spec: 'delicate tapering brown-toned line, soft two-tone shading, blush-heavy, very large deep multi-layer iris with many highlights, soft warm pale palette',
  },
] as const;

/**
 * The locked backdrop. Reason it is gray and not white: high subject-to-background
 * contrast bakes halo and edge-breathing into any video generated from the plate.
 */
export const GRAY_PLATE =
  'Background is an even neutral 18% mid-gray seamless field — one uniform value corner ' +
  'to corner, no seam, no gradient, no hotspot, no vignette, no falloff. Zero shadow outside ' +
  'the figure: no cast shadow, no contact shadow, no drop shadow, no ambient occlusion, no halo, ' +
  'no edge darkening, and no light bleed onto the field. The background stays neutral but the ' +
  'subject does not — skin renders at its true natural tone and wardrobe at its true colour ' +
  'values, as under neutral daylight, never cooled, washed-out or colour-shifted by the backdrop.';

// ─────────────────────────────────────────────────────────────────────────
// CHARACTER SHEETS
// Two layouts, because they serve different jobs and the sources disagree.
// ─────────────────────────────────────────────────────────────────────────

export interface SheetPreset {
  id: string;
  name: string;
  /** Plain-language note on what this layout is actually good at. */
  bestFor: string;
  panels: string;
  build: (o: SheetOptions) => string;
}

export interface SheetOptions {
  subject: string;
  style: RenderStyle;
  celRegister?: string;
  /** True when working from an uploaded reference image. */
  fromReference: boolean;
  wardrobe?: string;
}

function styleBlock(o: SheetOptions): string {
  const stack = RENDER_STACK[o.style];
  if (o.style === 'animated') {
    const reg = CEL_REGISTERS.find((r) => r.id === o.celRegister) ?? CEL_REGISTERS[0];
    return `Style register: ${reg.name} — ${reg.spec}.\n\n${stack.positive}\n\n${stack.negative}`;
  }
  return `${stack.positive}\n\n${stack.negative}`;
}

function referenceClause(o: SheetOptions): string {
  return o.fromReference
    ? o.style === 'photoreal'
      ? 'Based strictly on the uploaded reference image. Match the exact real-world appearance of the person: facial structure, proportions, skin texture, age, asymmetry and natural imperfections. Maintain strong identity consistency across every panel — the subject must read as the same person photographed several times, not a replicated model. Preserve natural human asymmetry; proportions stay realistic and consistent without looking mechanically aligned.'
      : 'Based strictly on the uploaded reference image. Carry the character\'s identity markers across every panel exactly — the same face shape, eye design, hair structure and markings in each. Consistency of the drawn design matters more than anatomical realism.'
    : '';
}

/**
 * Cyan's original 7-panel contact sheet, with the style fork added.
 * Optimised for a human flipping through angles.
 */
const contactSheet: SheetPreset = {
  id: 'character-sheet-contact',
  name: '7-panel contact sheet',
  bestFor: 'Human reference — you flipping through angles. Richest coverage, lowest per-face resolution.',
  panels: '4 full-body (front, left profile, right profile, rear) + 3 close-up (front, left, right)',
  build: (o) => {
    const photo = o.style === 'photoreal';
    return [
      photo
        ? `Create a photorealistic multi-angle photographic identity sheet of ${o.subject}.`
        : `Create a multi-angle character model sheet of ${o.subject} as clean animation production art.`,
      referenceClause(o),
      photo
        ? 'The result must look like real photography of a real human, not a digital character or 3D asset. The overall feeling is documentary and natural, not stylised or cinematic.'
        : 'The result must read as a professional animation model sheet — the drawing a studio would hand an animator to keep the character on-model.',
      '',
      'LAYOUT',
      'Two horizontal rows, presented as a clean contact sheet.',
      'Top row — four full-body views of the same subject: (1) facing the camera, (2) left-facing profile, (3) right-facing profile, (4) facing away from the camera.',
      `Bottom row — three close-up ${photo ? 'photographic portraits' : 'head studies'}: (1) facing the camera, (2) left-facing profile, (3) right-facing profile.`,
      '',
      'POSE & BODY LANGUAGE',
      photo
        ? 'The subject stands naturally and casually, as a real person would when asked to stand still. No exaggerated stance, no rigid pose, no symmetry. Subtle natural weight distribution, relaxed posture, shoulders relaxed, arms resting naturally at the sides.'
        : 'Neutral on-model standing pose — weight even, arms relaxed at the sides, shoulders level. Clear readable silhouette in every view. No dynamic action posing.',
      o.wardrobe ? `\nWARDROBE\n${o.wardrobe}` : '',
      '',
      'LIGHTING & CAMERA',
      photo
        ? 'Soft, neutral, real-world lighting similar to window light or soft studio light. No dramatic, cinematic or stylised lighting. Natural shadows with gentle falloff. Realistic camera perspective and lens behaviour.'
        : 'Flat even lighting across all panels so the design reads clearly. Cel shadows minimal and consistent in direction across every panel.',
      '',
      GRAY_PLATE,
      '',
      styleBlock(o),
    ]
      .filter(Boolean)
      .join('\n');
  },
};

/**
 * banana-pro-director-3.0's 3-panel. Fewer cells = ~2x resolution on the face
 * panel, which is what makes it usable as a downstream identity anchor.
 */
const threePanelSheet: SheetPreset = {
  id: 'character-sheet-3panel',
  name: '3-panel identity anchor',
  bestFor: 'Feeding video models. Face panel gets ~2x the pixels, so identity actually holds downstream.',
  panels: 'Headless full-body front · full-body rear · tight chest-up face lock',
  build: (o) => {
    const photo = o.style === 'photoreal';
    return [
      photo
        ? `Create a photorealistic 3-panel character reference sheet of ${o.subject} — one horizontal frame, three equal vertical panels with thin clean separation between them.`
        : `Create a 3-panel character model sheet of ${o.subject} as clean animation production art — one horizontal frame, three equal vertical panels with thin clean separation.`,
      referenceClause(o),
      '',
      'LEFT PANEL — full body front view, headless. The figure stands squared to camera from the shoulders down, arms relaxed at the sides, hands open and loose, weight even across both feet. There is no head, no neck and no hair — nothing rises above the shoulder line and no hair falls across the chest or shoulders. The neck terminates in a clean, flat, sharply defined horizontal edge at the base of the throat, exactly like a headless dress-form mannequin: a crisp sculptural cut with a clean visible edge — not blurred, not faded, not dissolving, no wisps, no smoke, no ghosting, no transparency, no stump, no anatomy detail at the cut, no blood. Above that edge there is only empty backdrop. The panel keeps full headroom — generous empty space above the shoulders where the head would be — so the figure sits at the same scale and position as a normal full-body portrait. This panel exists to isolate the garment, silhouette and body proportions with zero facial data competing for attention.',
      '',
      'CENTER PANEL — full body rear view, head attached. Photographed from directly behind, standing straight, arms relaxed, weight even. Hair fall, garment back construction, hem and footwear all readable from behind.',
      '',
      'RIGHT PANEL — tight chest-up face lock. Framed from just above the top of the head down to the collarbones and the very top of the garment only. The face fills most of the panel — a true close-up. Body squared to camera, head level, eyes to camera, lips closed and relaxed, neutral controlled expression. Brows, lashes, lip texture and skin detail readable at close range. This panel is the identity anchor: it must stay tight — chest-up, not waist-up.',
      o.wardrobe ? `\nWARDROBE\n${o.wardrobe}` : '',
      '',
      photo
        ? 'Soft neutral lighting from camera-left, gentle shadow falloff, realistic lens behaviour, consistent across all three panels.'
        : 'Flat even lighting across all three panels, cel shadow direction consistent between them.',
      '',
      GRAY_PLATE,
      '',
      styleBlock(o),
    ]
      .filter(Boolean)
      .join('\n');
  },
};

const expressionSheet: SheetPreset = {
  id: 'character-sheet-expressions',
  name: 'Expression set',
  bestFor: 'Locking how the face behaves across emotional beats. Run after identity is locked.',
  panels: '6 chest-up panels — neutral, warm, guarded, angry, grief, laughing',
  build: (o) => {
    const photo = o.style === 'photoreal';
    return [
      `Create a 6-panel expression sheet of ${o.subject} — two rows of three, each panel a chest-up framing of the same subject.`,
      referenceClause(o),
      '',
      'PANELS, in order: (1) neutral at rest, lips closed; (2) warm — a genuine small smile reaching the eyes; (3) guarded — reading someone, withholding; (4) anger held in, jaw set, not shouting; (5) grief just before it breaks; (6) open laughter, eyes creased.',
      '',
      'The bone structure, hairline, identity markers and wardrobe stay identical in all six. Only the musculature of the expression changes. Framing, distance and head size stay constant panel to panel so the sheet reads as a set.',
      o.wardrobe ? `\nWARDROBE\n${o.wardrobe}` : '',
      '',
      photo
        ? 'Soft neutral lighting, identical setup in every panel, gentle shadow falloff.'
        : 'Flat even lighting, identical in every panel.',
      '',
      GRAY_PLATE,
      '',
      styleBlock(o),
    ]
      .filter(Boolean)
      .join('\n');
  },
};

export const SHEET_PRESETS: SheetPreset[] = [contactSheet, threePanelSheet, expressionSheet];

// ─────────────────────────────────────────────────────────────────────────
// CINEMATOGRAPHY — emotion drives technique, never the other way round.
// ─────────────────────────────────────────────────────────────────────────

export const SHOT_SIZES = [
  { id: 'ews', name: 'Extreme wide', use: 'Isolation, overwhelm, the scale of the world. Character small in frame = feeling small inside.' },
  { id: 'ws', name: 'Wide', use: 'Geography and context. Where we are, who is where.' },
  { id: 'full', name: 'Full shot', use: 'Loneliness with context — body language and environment both readable.' },
  { id: 'mw', name: 'Medium wide', use: 'Two-handers, blocking, physical relationship between people.' },
  { id: 'med', name: 'Medium', use: 'Thought, decision, guarded emotion. Enough face to read, enough distance to wonder.' },
  { id: 'mcu', name: 'Medium close-up', use: 'The workhorse of dialogue. Performance without pressure.' },
  { id: 'cu', name: 'Close-up', use: 'Vulnerability, confession, breaking point. Skin and eyes; the viewer cannot look away.' },
  { id: 'ecu', name: 'Extreme close-up', use: 'A single feeling or irreversible instant. Eyes, hands, one object carrying the beat.' },
] as const;

export const CAMERA_ANGLES = [
  { id: 'low', name: 'Low angle', use: 'Character is powerful, determined, or a threat.' },
  { id: 'eye', name: 'Eye level', use: 'Neutral judgement. The honest default.' },
  { id: 'high', name: 'High angle', use: 'Character is powerless, trapped, diminished.' },
  { id: 'dutch', name: 'Dutch tilt', use: 'Unease, the world gone wrong. 5–15°; more only at chaos peaks.' },
  { id: 'top', name: 'Top-down', use: 'Fate, pattern, seen-from-above inevitability.' },
  { id: 'ots', name: 'Over-the-shoulder', use: 'Intimacy, eavesdropping, shallow foreground blur.' },
  { id: 'pov', name: 'POV', use: 'Chase, urgency, subjective panic.' },
] as const;

export const CAMERA_MOVES = [
  { id: 'static', name: 'Locked static', use: 'Suppressed tension, dread, held breath.' },
  { id: 'push', name: 'Slow push in', use: 'Search, yearning, dawning realisation.' },
  { id: 'pull', name: 'Pull back', use: 'Release, relief, revealing the space around them.' },
  { id: 'track', name: 'Lateral track', use: 'Joy, momentum, pursuit. Parallax builds depth.' },
  { id: 'steadicam', name: 'Following steadicam', use: 'Sustained movement with the character, never ahead of them.' },
  { id: 'handheld', name: 'Handheld', use: 'Chaos, panic, documentary immediacy.' },
  { id: 'whip', name: 'Whip pan', use: 'Violent attention shift. Doubles as a transition.' },
  { id: 'crane', name: 'Crane / drift', use: 'Dream, memory, wonder. Floating detachment.' },
] as const;

export const LENSES = [
  { id: '14-24', name: '14–24mm', use: 'Space stretches, edges distort, world feels big and hostile. Isolation, chaos, chase.' },
  { id: '28-35', name: '28–35mm', use: 'Natural but present. Documentary intimacy. The default narrative lens.' },
  { id: '50', name: '50mm', use: 'The honest eye. Neutral beats, dialogue.' },
  { id: '85-105', name: '85–105mm', use: 'Compression, creamy background, flattery. Vulnerability, beauty, tenderness.' },
  { id: '135+', name: '135mm+', use: 'World compressed flat, subject trapped against background. Pressure, inevitability.' },
] as const;

export const LIGHTING = [
  { id: 'safe', name: 'Safety / warmth', use: 'Soft frontal key, low contrast 2:1, warm practicals visible in frame.' },
  { id: 'conflict', name: 'Conflict / doubt', use: 'Hard side key, split lighting, 4:1–8:1 ratio.' },
  { id: 'fear', name: 'Fear / secrecy', use: 'Underlighting or a single source, deep shadow falloff.' },
  { id: 'crowd', name: 'Lonely in a crowd', use: 'Character lit, background falling away to darkness.' },
  { id: 'epiphany', name: 'Epiphany', use: 'Light changes IN the shot — a door opens, a sign flickers on, sun breaks.' },
  { id: 'night-city', name: 'Grounded night city', use: 'Sodium amber streetlight, red brake-light bounce, real storefront glow. No cyberpunk wash.' },
] as const;

/** The short-film intensity curve. The Turn is the load-bearing beat. */
export const STORY_BEATS = [
  { beat: 'Hook', pct: '0–10%', intensity: '4→6', direction: 'Start mid-motion or mid-emotion. No cold opens.' },
  { beat: 'Setup', pct: '10–30%', intensity: '3→5', direction: 'Wide, stable, observational coverage.' },
  { beat: 'Build', pct: '30–60%', intensity: '5→8', direction: 'Shrinking shot sizes, rising movement, tightening edit.' },
  { beat: 'Peak', pct: '60–85%', intensity: '8→10', direction: 'Boldest choices — extreme angle, longest take or fastest cuts.' },
  { beat: 'Turn', pct: '85–95%', intensity: '10→4', direction: 'Sudden stillness. The cut from chaos to a locked static frame. Once per film.' },
  { beat: 'Button', pct: '95–100%', intensity: '2→3', direction: 'One image that holds the theme. End on it. No epilogue.' },
] as const;

/** Three layers minimum, or AI frames read flat. */
export const DEPTH_DEVICES = [
  'Blurred foreground element near the lens — a shoulder, a sign, glass, rain, a crowd silhouette',
  'Atmosphere between planes — haze, dust, steam, rain, fog catching the light',
  'Leading lines — roads, rails, corridors, shadows pointing at the subject',
  'Frame-in-frame — doors, windows, mirrors, gates',
  'Scale contrast — small subject against a large structure',
  'Colour separation — warm subject against a cool background, or the reverse',
  'Light falloff — background 1–2 stops darker than the subject',
  'Parallax — lateral camera move so layers slide at different speeds',
] as const;

/**
 * Words that measurably degrade output. Vague quality-adjectives spend tokens
 * without producing a pixel; the stylised set actively overrides art direction.
 */
export const DEGRADING_WORDS = [
  'beautiful', 'stunning', 'amazing', 'masterpiece', 'best quality', 'highly detailed',
  '8k', '4k', 'ultra HD', 'award-winning', 'trending on artstation', 'perfect',
  'breathtaking', 'epic', 'hyperrealistic', 'photorealistic rendering', 'very',
] as const;

/** In a stylised or animated prompt these three force the model back to photoreal. */
export const STYLE_BREAKING_WORDS = ['realistic', 'photographic', 'normal proportions'] as const;

// ─────────────────────────────────────────────────────────────────────────
// HOUSE RULES — injected as the system prompt for every AI call.
// ─────────────────────────────────────────────────────────────────────────

export const HOUSE_RULES = `You are the prompt director inside Creative Hub, a storyboard and pipeline tool.

CORE PHILOSOPHY
A great prompt is a production document, not a beautiful sentence. If a word does not
produce a visible pixel or an audible sound, cut it.

HARD RULES
1. Emotion first. Every technical choice traces to an emotional reason. A choice with no
   emotional reason is wrong.
2. Write the visible. Describe what the camera sees, not what the scene means.
3. One camera move and one emotional action per clip. Compound moves break generation.
4. Full description every time. Character identity and style get restated in full in every
   prompt — including footwear. Reference images alone do not lock style.
5. Open mid-action. The first frame already contains a physical event. If the first second
   could be cut without losing information, start later.
6. Three depth layers minimum: foreground element, sharp midground subject, living background.
7. Never use these degrading words: ${DEGRADING_WORDS.join(', ')}.
8. In stylised or animated work never use: ${STYLE_BREAKING_WORDS.join(', ')} — they override
   the art direction and drag the render back to photoreal.
9. Diegetic audio only — sound that exists in the world of the shot. Never describe music
   or lyrics unless the user explicitly asks for a score.
10. Positive phrasing by default. Use a negation battery only as a closing block.

OUTPUT
Return only the prompt itself. No preamble, no commentary, no explanation, no markdown
headings unless the format requires them. Never leave a placeholder unfilled.`;

// ─────────────────────────────────────────────────────────────────────────
// ENHANCERS — the instruction sent alongside a user's rough prompt.
// ─────────────────────────────────────────────────────────────────────────

export interface Enhancer {
  id: string;
  name: string;
  blurb: string;
  target: 'image' | 'video' | 'text' | 'audio';
  instruction: string;
}

export const ENHANCERS: Enhancer[] = [
  {
    id: 'image-cinematic',
    name: 'Cinematic still',
    blurb: 'Rough idea → production-grade image prompt with lens, light and depth.',
    target: 'image',
    instruction: `Rewrite the draft as a single production-ready image prompt.

Structure it as flowing prose in this order — no headings, no bullet points:
subject and action · shot size and camera angle · lens in mm and depth of field ·
lighting direction, quality and ratio · the three depth layers (foreground element,
midground subject, background life) · atmosphere and palette · closing render stack.

Name a specific lens and a specific light direction. Include at least one depth device.
End with the render stack for the requested medium.`,
  },
  {
    id: 'image-character',
    name: 'Character-locked still',
    blurb: 'Injects the full locked description of every linked character.',
    target: 'image',
    instruction: `Rewrite the draft as an image prompt with the linked characters rendered
in full. Restate each character's complete physical description inline — face, hair, every
garment with fabric detail, footwear, accessories and identity markers. Do not abbreviate to
a name and do not assume a reference image carries the description. Distinctive asymmetries
are identity anchors: keep every one.`,
  },
  {
    id: 'video-shot',
    name: 'Single video shot',
    blurb: 'One clip: one move, one action, mid-action open.',
    target: 'video',
    instruction: `Rewrite the draft as a single video clip prompt.

Exactly one camera move and one emotional action. Open mid-action — the first frame already
contains a physical event. Specify: subject and wardrobe in full · the one camera move with
its speed · the one action · lens and frame rate · lighting · atmosphere · a diegetic sound
line · what the last frame looks like.

Never describe music or lyrics. Sound is only what exists in the world of the shot.`,
  },
  {
    id: 'video-sequence',
    name: 'Multishot sequence',
    blurb: 'Breaks a scene into timecoded shots on the intensity curve.',
    target: 'video',
    instruction: `Break the draft into a timecoded multishot sequence.

Open with a master block: subject locks with wardrobe restated per character, world plate,
atmosphere, and the capture format. Then numbered SHOT blocks, each with its duration, shot
size, angle, one camera move, one action, and its emotional reason in a trailing parenthesis.
Close with cross-frame continuity rules and the last frame.

Map the shots onto the intensity curve — hook, setup, build, peak, turn, button. Include
exactly one Turn: a hard cut from peak energy to a held static frame. Keep directional
continuity: if a character exits frame right they enter the next shot from frame left.`,
  },
  {
    id: 'text-scene',
    name: 'Scene description',
    blurb: 'Storyboard-panel prose — what the audience sees and feels.',
    target: 'text',
    instruction: `Rewrite the draft as a storyboard panel description of 2–3 sentences.
Present tense, active verbs, only what is visible or audible. No adjectives that cannot be
photographed. State what changes over the course of the shot — a panel that describes a
frozen image is not describing a shot.`,
  },
  {
    id: 'text-expand',
    name: 'Expand the beat',
    blurb: 'Thin note → full beat with emotional reasoning.',
    target: 'text',
    instruction: `Expand the draft into a full story beat. Give it: the surface emotion the
character shows, the true emotion underneath, its position on the arc, and what the audience
should feel — which is not necessarily what the character feels. Then one line on how the
camera expresses that gap. Keep it under 120 words.`,
  },
  {
    id: 'audio-design',
    name: 'Sound bed',
    blurb: 'Diegetic sound design for the shot.',
    target: 'audio',
    instruction: `Write a diegetic sound bed for this shot. Only sound that exists in the
world of the frame: room tone, footsteps on the specific surface, cloth movement, breath,
mechanical sound, weather. Name two or three signature effects that recur. If there is a
moment of total silence, say where. Never describe music, score or lyrics.`,
  },
];

// ─────────────────────────────────────────────────────────────────────────
// STRUCTURED GENERATORS — used by the bible / world / script panels.
// ─────────────────────────────────────────────────────────────────────────

export const GENERATORS = {
  characterFromBrief: `From the brief, write a character bible entry. Return strict JSON with
these keys and no others: name, role, logline, age, appearance, wardrobe, personality,
backstory, voice, arc, signature, tags.

- logline: one line — who they are and what it costs them.
- appearance: the physical description that will be pasted into image prompts. Face shape,
  hair, build, skin, and at least two distinctive asymmetries (one earring, a scar, a
  crooked tooth) that act as identity anchors.
- wardrobe: the silhouette an audience learns to recognise. Name fabrics and footwear.
- voice: how they actually talk — rhythm, vocabulary, what they never say.
- arc: the value that changes in them, stated as "from X to Y".
- signature: a single dense paragraph combining appearance and wardrobe, written to be
  pasted verbatim into any image or video prompt. This is the canonical lock.
- tags: 3–6 lowercase single words.`,

  worldFromBrief: `From the brief, write a world bible entry. Return strict JSON with these
keys and no others: name, category, summary, description, visualKeys, rules, tags.

- category: one of location, faction, technology, culture, era, rule, prop.
- summary: one line.
- description: what it is, who controls it, what happened here.
- visualKeys: the prompt-ready visual shorthand — palette, weather, time of day, texture,
  scale, and one signature architectural or material detail. Written to be pasted into an
  image prompt verbatim.
- rules: what is true here that is not true elsewhere, and what NEVER appears on screen.
- tags: 3–6 lowercase single words.`,

  scriptFromBrief: `From the brief, write a short-film treatment. Return strict JSON with
these keys and no others: title, logline, genre, tone, treatment, scenes.

- logline: one sentence containing protagonist, want and obstacle.
- treatment: 150–250 words covering the emotional argument of the film, not just the plot.
- scenes: an array of 6 objects, one per beat of the intensity curve (hook, setup, build,
  peak, turn, button). Each has: heading (slugline in INT./EXT. LOCATION — TIME form),
  action (what is visible, present tense, active verbs), dialogue (may be empty), and
  notes (the beat name and the value charge, e.g. "Turn — hope + to hope −").

Every scene must be caused by the one before it. If a scene could be reordered without
breaking causality, it is not doing structural work — rewrite it so it is.`,

  shotsFromScene: `Break this scene into storyboard shots. Return strict JSON: an array of
objects with keys title, subtitle, description, imagePrompt, audio.

- title: 2–4 words naming the shot.
- subtitle: "shot size · camera move" — e.g. "Medium · slow push in".
- description: 1–2 sentences, present tense, only what is visible.
- imagePrompt: a complete production-ready still prompt for this frame.
- audio: the diegetic sound line.

No two consecutive shots share the same size and angle — respect the 30-degree rule.
Map the shots across the intensity curve and include exactly one moment of stillness.`,
} as const;

// ─────────────────────────────────────────────────────────────────────────
// CONTEXT ASSEMBLY — how the ecosystem follows through into every prompt.
// ─────────────────────────────────────────────────────────────────────────

export const CONTEXT_HEADER = `The following is locked project canon. Treat it as
authoritative. When any of these characters or locations appear in the output, use their
canonical descriptions verbatim rather than inventing new ones.`;
