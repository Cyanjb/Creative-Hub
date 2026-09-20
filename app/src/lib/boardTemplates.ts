/**
 * Board templates. Each returns the nodes + wires to drop into a fresh board,
 * plus any ecosystem seeds (characters / world entries) the template implies.
 */

import { uid } from './id';
import { FRAME_W, FRAME_H, makeFrame, makePrompt, makeTextNode } from './factories';
import type { BoardNode, Character, WireType, WorldEntry, Wire } from '../store/types';
import { makeCharacter, makeWorld } from './factories';

export type TemplateId = 'blank' | 'storyboard' | 'pipeline';

export interface TemplateResult {
  nodes: BoardNode[];
  wires: Wire[];
  characters: Character[];
  worlds: WorldEntry[];
}

export interface TemplateMeta {
  id: TemplateId;
  name: string;
  blurb: string;
  icon: string;
  accent: string;
}

export const TEMPLATES: TemplateMeta[] = [
  {
    id: 'blank',
    name: 'Blank Whiteboard',
    blurb: 'Empty infinite canvas. Drop images, add text, build it however you like.',
    icon: '◻',
    accent: 'var(--cyan)',
  },
  {
    id: 'storyboard',
    name: 'Storyboard Template',
    blurb: '8 structured shot frames with scene titles and a pre-filled character bible.',
    icon: '▦',
    accent: 'var(--magenta)',
  },
  {
    id: 'pipeline',
    name: 'Pipeline Recorder',
    blurb: 'Sequential connected frames with colour-coded example wires for documenting a workflow.',
    icon: '⇉',
    accent: 'var(--violet)',
  },
];

const COL_GAP = FRAME_W + 70;
const ROW_GAP = FRAME_H + 90;

/** The 8 beats of a standard short-form sequence — a sane storyboard skeleton. */
const STORYBOARD_BEATS: Array<{
  scene: string;
  title: string;
  subtitle: string;
  description: string;
  prompt: string;
}> = [
  {
    scene: 'Scene 1 — Cold Open',
    title: 'Establishing Wide',
    subtitle: 'Extreme wide · locked off',
    description: 'Open on the world before the story disturbs it. Let the location do the talking.',
    prompt: 'Extreme wide establishing shot, [LOCATION], golden hour, anamorphic 2.39:1, deep focus, atmospheric haze, cinematic colour grade',
  },
  {
    scene: 'Scene 1 — Cold Open',
    title: 'Hero Introduction',
    subtitle: 'Medium · slow push in',
    description: 'First look at the protagonist. Frame them in their element, unaware.',
    prompt: 'Medium shot of [HERO], 50mm, shallow depth of field, natural window light, quiet expression, cinematic',
  },
  {
    scene: 'Scene 2 — Inciting Incident',
    title: 'The Disruption',
    subtitle: 'Close · handheld',
    description: 'Something breaks the pattern. Push in tight — the audience should feel the tilt.',
    prompt: 'Tight close-up, [HERO] reacting, handheld micro-shake, hard key light from one side, high contrast, tension',
  },
  {
    scene: 'Scene 2 — Inciting Incident',
    title: 'Reveal',
    subtitle: 'Wide · whip pan',
    description: 'Show what caused it. Withhold just enough.',
    prompt: 'Wide reveal shot, [ANTAGONIST FORCE] entering frame, motion blur, backlit silhouette, volumetric light',
  },
  {
    scene: 'Scene 3 — Rising Action',
    title: 'Pursuit',
    subtitle: 'Tracking · steadicam',
    description: 'Sustained movement. Keep the camera with the hero, never ahead of them.',
    prompt: 'Tracking shot following [HERO] from behind, steadicam, 35mm, practical light sources streaking past, kinetic',
  },
  {
    scene: 'Scene 3 — Rising Action',
    title: 'Turn',
    subtitle: 'Two-shot · static',
    description: 'The moment the goal changes. Play it in one unbroken frame.',
    prompt: 'Two-shot, [HERO] and [ALLY] facing each other, 85mm, soft bounce fill, muted palette, held stillness',
  },
  {
    scene: 'Scene 4 — Climax',
    title: 'Confrontation',
    subtitle: 'Low angle · wide',
    description: 'Peak of the sequence. Give it the biggest frame in the board.',
    prompt: 'Low-angle hero wide, [HERO] centre frame, dramatic rim light, rain and particulate, epic scale, cinematic',
  },
  {
    scene: 'Scene 4 — Climax',
    title: 'Resolution',
    subtitle: 'Wide · slow pull out',
    description: 'Release. Return to the geography of the opening, changed.',
    prompt: 'Wide pull-back shot, [LOCATION] after the event, dusk, still air, muted desaturated grade, quiet resolution',
  },
];

function storyboardTemplate(projectId: string): TemplateResult {
  const nodes: BoardNode[] = STORYBOARD_BEATS.map((beat, i) =>
    makeFrame((i % 4) * COL_GAP, Math.floor(i / 4) * ROW_GAP, {
      title: beat.title,
      subtitle: beat.subtitle,
      scene: beat.scene,
      shot: `${i + 1}`,
      description: beat.description,
      prompts: [
        makePrompt({ label: 'Image prompt', target: 'image', text: beat.prompt }),
        makePrompt({ label: 'Motion prompt', target: 'video', text: '' }),
      ],
      z: i,
    }),
  );

  const characters = [
    // Fields are left empty on purpose. The editor's own hint text guides what
    // to write; seeding instructions as *data* would bake "Describe height,
    // build…" into every generated prompt.
    makeCharacter(projectId, {
      name: 'Hero',
      role: 'Protagonist',
      logline: 'The one the camera follows and the story costs something.',
      tags: ['lead'],
    }),
    makeCharacter(projectId, {
      name: 'Ally',
      role: 'Supporting',
      logline: 'Tells the hero the truth nobody else will.',
      tags: ['support'],
    }),
    makeCharacter(projectId, {
      name: 'Antagonist Force',
      role: 'Opposition',
      logline: 'Not necessarily a person — the pressure the hero moves against.',
      tags: ['opposition'],
    }),
  ];

  const worlds = [
    makeWorld(projectId, {
      name: 'Primary Location',
      category: 'location',
      summary: 'The place the sequence opens and closes in.',
      tags: ['hero-location'],
    }),
  ];

  const title = makeTextNode(0, -110, {
    text: 'SEQUENCE — working title',
    fontSize: 34,
    bold: true,
    color: '#22d3ee',
    w: 620,
    h: 56,
  });

  return { nodes: [title, ...nodes], wires: [], characters, worlds };
}

/**
 * The spine every one of Cyan's Craft workflows shares — the Nike 15-shot ad,
 * the 16-panel dance loop, storyboard-to-video, consistent-character:
 *
 *   lock character → first frame → N-panel storyboard sheet → motion → finish
 *
 * Only the panel count varies between them, so the template encodes the spine
 * and leaves the count to the user. The `out` types are chosen so all three
 * wire colours appear as worked examples.
 */
const PIPELINE_STAGES: Array<{ title: string; subtitle: string; icon: string; out: WireType }> = [
  { title: 'Script & Beats', subtitle: 'Brief, logline, beat map', icon: '✎', out: 'text' },
  { title: 'Reference Gather', subtitle: 'Source plates & look refs', icon: '🗂', out: 'image' },
  { title: 'Character Lock', subtitle: 'Face lock → identity sheet', icon: '🧍', out: 'image' },
  { title: 'First Frame', subtitle: 'Hero still, in the environment', icon: '🖼', out: 'image' },
  { title: 'Storyboard Sheet', subtitle: 'N-panel beat map, loopable bookend', icon: '▦', out: 'image' },
  { title: 'Motion Pass', subtitle: 'Sheet as multi-reference → video', icon: '🎞', out: 'video' },
  { title: 'Upscale & Grade', subtitle: 'Finish the plate', icon: '✨', out: 'video' },
  { title: 'Sound & Delivery', subtitle: 'Diegetic bed, captions, export', icon: '🔊', out: 'text' },
];

function pipelineTemplate(): TemplateResult {
  const nodes: BoardNode[] = PIPELINE_STAGES.map((stage, i) =>
    makeFrame(i * COL_GAP, 0, {
      title: stage.title,
      subtitle: stage.subtitle,
      scene: 'Pipeline',
      shot: `${i + 1}`,
      iconOnly: true,
      icon: stage.icon,
      h: 330,
      z: i,
      prompts: [makePrompt({ label: 'Tool / settings', target: 'text', text: '' })],
      notes: '',
      collapsed: { prompts: false, notes: true, meta: true },
    }),
  );

  const wires: Wire[] = [];
  for (let i = 0; i < nodes.length - 1; i++) {
    wires.push({
      id: uid('wr'),
      fromId: nodes[i].id,
      toId: nodes[i + 1].id,
      type: PIPELINE_STAGES[i].out,
      label: '',
    });
  }

  const title = makeTextNode(0, -110, {
    text: 'PIPELINE — how this shot gets made',
    fontSize: 30,
    bold: true,
    color: '#a855f7',
    w: 720,
    h: 50,
  });

  const legend = makeTextNode(0, 380, {
    text: 'Wire colours →  white = image handoff   ·   purple = video handoff   ·   yellow = text / data handoff',
    fontSize: 14,
    color: '#8b93a7',
    w: 780,
    h: 32,
  });

  return { nodes: [title, legend, ...nodes], wires, characters: [], worlds: [] };
}

export function buildTemplate(id: TemplateId, projectId: string): TemplateResult {
  if (id === 'storyboard') return storyboardTemplate(projectId);
  if (id === 'pipeline') return pipelineTemplate();
  return { nodes: [], wires: [], characters: [], worlds: [] };
}
