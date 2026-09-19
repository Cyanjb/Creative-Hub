#!/usr/bin/env node
// vertical-drama-pipeline - deterministic helpers for the vertical micro-drama pipeline.
//
// Zero dependencies on purpose: the skill has to work in any directory with no
// npm install. Node 18+, standard library only.
//
// Phase 1 + 2: the outline and script stages, their gates, the duration maths,
// the seed between them, checkup mode and Markdown rendering.
// The shots stage is deliberately absent until the Seedance cut-timing question
// is answered (see SPEC section 13, question 1).
//
// Independently implemented after reading eternityspring/shuohao-skills
// (Apache-2.0). See references/SOURCES.md.

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

/* ------------------------------------------------------------------ */
/* Format profiles                                                     */
/* ------------------------------------------------------------------ */
/*
 * Every threshold lives here. Nothing below this block is hardcoded.
 *
 * A second format later (a commercial series, a YouTube run) is a new entry
 * in this object, not a fork of the skill. If changing a number here breaks a
 * gate's own test, that gate was depending on a constant it should not have.
 */

export const PROFILES = {
  'vertical-microdrama': {
    label: 'Vertical micro-drama (9:16)',

    // --- frame ---
    aspect: '9:16',
    safeAreaPercent: 12,        // top and bottom belong to platform interface
    maxOnScreen: 2,             // a vertical frame holds two comfortably, not three

    // --- timing ---
    wordsPerSecond: 2.5,        // from screenwriter/timing-and-cutting.md (150 wpm).
                                // INHERITED, NOT MEASURED. Calibrate against a real
                                // TTS render before trusting the tolerance band.
    actionBeatSeconds: 2.0,     // shorter than a wide-frame beat
    tolerance: 0.15,            // +/- on an episode's target runtime
    maxLineWords: 10,           // must satisfy: <= maxCutSeconds * wordsPerSecond
    defaultSecondsPerEpisode: 75,

    // --- cutting (used by the shots stage, declared here so the profile is whole) ---
    minCutSeconds: 1.5,
    maxCutSeconds: 4.0,
    targetCutSeconds: 2.5,
    maxSegmentSeconds: 30,      // engine ceiling: 15 on Seedance 2.0, 30 on 2.5
    recommendedSegmentSeconds: 12,

    // --- structure ---
    hookWindow: 3,              // the hook must land within this many beats
    maxTurnGap: 2,              // episodes allowed between turns
    maxLeads: 4,
    maxSupport: 6,
    maxFunctional: 6,
    maxProps: 6,
    worldCapBase: 3,            // cap = base + ceil(episodes / perEpisodes), clamped
    worldCapPerEpisodes: 8,
    worldCapMin: 3,
    worldCapMax: 8,

    // --- the other-lock ---
    minOtherAnchors: 3,
    minAnchorChars: 8,
  },
};

export const DEFAULT_PROFILE = 'vertical-microdrama';

export function profileOf(doc, override = null) {
  const name = override ?? doc?.profile ?? DEFAULT_PROFILE;
  const base = PROFILES[name];
  if (!base) throw new Error(`unknown format profile "${name}". Known: ${Object.keys(PROFILES).join(', ')}`);
  return { ...base, ...(doc?.params?.overrides ?? {}), __name: name };
}

export function worldCap(p, episodes) {
  const raw = p.worldCapBase + Math.ceil((episodes || 0) / p.worldCapPerEpisodes);
  return Math.min(p.worldCapMax, Math.max(p.worldCapMin, raw));
}

/* ------------------------------------------------------------------ */
/* Shared helpers                                                      */
/* ------------------------------------------------------------------ */

const r1 = (n) => Math.round(n * 10) / 10;
const has = (s) => typeof s === 'string' && s.trim().length > 0;
const arr = (a) => (Array.isArray(a) ? a : []);

/** Double quotes only. Single quotes are apostrophes in English and must pass. */
const QUOTE_RE = /["“”«»]/;

export const wordCount = (s) => String(s ?? '').trim().split(/\s+/).filter(Boolean).length;

/** Vagueness ban list for other-lock anchors. These are conclusions, not descriptions. */
export const VAGUE_ANCHORS = [
  'ethereal', 'otherworldly', 'mysterious', 'haunting', 'unearthly', 'ancient',
  'timeless', 'uncanny', 'dreamlike', 'not-quite-human', 'not quite human',
  'inhuman', 'strange', 'eerie', 'alien', 'luminous', 'glowing', 'mystical',
];

/** Generation-difficulty keywords. Over-report rather than under-report. */
export const RISK_PATTERNS = {
  rain: /\b(rain|rains|raining|rainy|downpour|drizzle|storm)\b/i,
  water: /\b(water|river|sea|wave|waves|swim|swims|swimming|flood|tide)\b/i,
  crowd: /\b(crowd|crowds|mob|throng|a dozen people|many people|bystanders)\b/i,
  hands: /\b(hand|hands|finger|fingers|knuckle|knuckles|palm|palms)\b/i,
  contact: /\b(embrace|embraces|hug|hugs|kiss|kisses|grapple|shoves|wrestles)\b/i,
  fire: /\b(fire|flame|flames|burning|smoke|ember|embers)\b/i,
  reflection: /\b(mirror|mirrors|reflection|reflected|glass pane)\b/i,
  eating: /\b(eat|eats|eating|drink|drinks|drinking|chew|chews|swallow)\b/i,
  text: /\b(sign|signs|written|handwriting|letter|note|placard|label)\b/i,
};

/**
 * Precision traps: actions a video model reliably fails at. Narrow on purpose,
 * because a noisy gate gets switched off. A beat may carry allowPrecision with a
 * stated reason to pass anyway.
 */
export const PRECISION_PATTERNS = {
  'micro-expression': /\b(micro[- ]?expression|eyelash|eyelashes|eyelid|eyelids|nostrils? flare|pupils? dilat)/i,
  'sub-inch movement': /\b(an inch|half an inch|a few millimet|a fraction of an inch|by a hair|a hair'?s breadth)\b/i,
  'tool-mediated block': /\b(parries|parry|deflects (it|them|the)|blocks (it|them|the) with|knocks .{0,20} aside with)\b/i,
};

/* ------------------------------------------------------------------ */
/* Gate scaffold                                                       */
/* ------------------------------------------------------------------ */
/*
 * A gate is an id, a human label, a boolean and a DETAIL STRING.
 * The detail is the deliverable. "duration check failed" is a shrug;
 * "Episode 3 runs 14.2s over (est 89.2s / target 75s)" is a fix.
 */

function gateBag() {
  const gates = [];
  const add = (id, label, ok, detail = '') => gates.push({ id, label, ok, detail: String(detail ?? '') });
  return { gates, add };
}

const SKIP_OUTLINE = 'no outline.json supplied, gate skipped and treated as pass';
const SKIP_ARC = 'no ai-director arc in the outline, gate skipped and treated as pass';

/* ------------------------------------------------------------------ */
/* Stage 1 - outline gates (12)                                        */
/* ------------------------------------------------------------------ */

export function outlineGates(doc, opts = {}) {
  const p = profileOf(doc, opts.profile);
  const { gates, add } = gateBag();

  const chars = arr(doc?.characters);
  const envs = arr(doc?.environments);
  const props = arr(doc?.props);
  const turns = arr(doc?.turns);
  const eps = arr(doc?.episodes);
  const total = doc?.params?.episodes ?? eps.length;

  // 1. cast-cap -------------------------------------------------------
  const tiers = { lead: p.maxLeads, support: p.maxSupport, functional: p.maxFunctional };
  const counts = {};
  for (const t of Object.keys(tiers)) counts[t] = chars.filter((c) => c?.tier === t).length;
  const castBad = [];
  if (counts.lead < 1) castBad.push('no lead, a drama with no lead does not exist');
  for (const [t, cap] of Object.entries(tiers)) {
    if (counts[t] > cap) castBad.push(`${counts[t]} ${t}, cap is ${cap}`);
  }
  add('cast-cap', `leads 1-${p.maxLeads}, support <=${p.maxSupport}, functional <=${p.maxFunctional}`,
    chars.length > 0 && castBad.length === 0,
    castBad.length ? castBad.join('; ') : `${counts.lead} lead / ${counts.support} support / ${counts.functional} functional`);

  // 2. world-cap ------------------------------------------------------
  const cap = worldCap(p, total);
  const primary = envs.filter((e) => e?.primary);
  const worldBad = [];
  if (primary.length > cap) worldBad.push(`${primary.length} primary environments, cap is ${cap} for ${total} episodes`);
  add('world-cap', `primary environments <= ${cap}`, envs.length > 0 && worldBad.length === 0,
    worldBad.length ? worldBad.join('; ') : `${primary.length} primary of ${envs.length}`);

  // 3. prop-cap -------------------------------------------------------
  const propBad = [];
  if (props.length > p.maxProps) propBad.push(`${props.length} props, cap is ${p.maxProps}`);
  for (const pr of props) if (!has(pr?.function)) propBad.push(`${pr?.id ?? '?'} has no stated function, so it is set dressing not a prop`);
  add('prop-cap', `tracked props <= ${p.maxProps}, each with a dramatic function`, propBad.length === 0,
    propBad.length ? propBad.join('; ') : `${props.length} props`);

  // 4. turn-gap -------------------------------------------------------
  const turnEps = [...new Set(turns.map((t) => t?.episode).filter(Number.isInteger))].sort((a, b) => a - b);
  let gapOk = turnEps.length > 0 && total > 0;
  let gapDetail = turnEps.length ? `turns in episodes ${turnEps.join(', ')}` : 'no turns defined';
  if (gapOk) {
    if (turnEps[0] > p.maxTurnGap) {
      gapOk = false;
      gapDetail = `${turnEps[0] - 1} dead episodes before the first turn (episode ${turnEps[0]})`;
    }
    for (let i = 1; i < turnEps.length && gapOk; i++) {
      if (turnEps[i] - turnEps[i - 1] > p.maxTurnGap) {
        gapOk = false;
        gapDetail = `gap between episode ${turnEps[i - 1]} and episode ${turnEps[i]} exceeds ${p.maxTurnGap}`;
      }
    }
    if (gapOk && total - turnEps[turnEps.length - 1] >= p.maxTurnGap) {
      gapOk = false;
      gapDetail = `${total - turnEps[turnEps.length - 1]} dead episodes after the last turn (episode ${turnEps[turnEps.length - 1]})`;
    }
  }
  add('turn-gap', `gap between turns <= ${p.maxTurnGap} episodes, no dead head or tail`, gapOk, gapDetail);

  // 5. major-turn -----------------------------------------------------
  const majors = turns.filter((t) => (t?.weight ?? 'minor') === 'major').map((t) => t.episode).filter(Number.isInteger);
  add('major-turn', 'at least one major turn, and the earliest is not the final episode',
    majors.length > 0 && Math.min(...majors) < total,
    majors.length ? `earliest major turn in episode ${Math.min(...majors)} of ${total}` : 'no major turn defined');

  // 6. arc-coverage ---------------------------------------------------
  const arc = arr(doc?.arc);
  if (arc.length === 0) {
    add('arc-coverage', 'every ai-director peak and turn has a structural turn on or beside it', true, SKIP_ARC);
  } else {
    const arcBad = [];
    const turnSet = new Set(turnEps);
    for (const point of arc) {
      const pos = String(point?.position ?? '').toLowerCase();
      if (pos !== 'peak' && pos !== 'turn') continue;
      const e = point?.episode;
      if (!Number.isInteger(e)) { arcBad.push(`arc ${pos} has no episode number`); continue; }
      if (!turnSet.has(e) && !turnSet.has(e - 1) && !turnSet.has(e + 1)) {
        arcBad.push(`the arc puts a ${pos} on episode ${e} and no turn lands within one episode of it`);
      }
    }
    add('arc-coverage', 'every ai-director peak and turn has a structural turn on or beside it',
      arcBad.length === 0, arcBad.join('; '));
  }

  // 7. ep-fields ------------------------------------------------------
  const missing = eps.filter((e) => !(has(e?.synopsis) && has(e?.hook) && has(e?.cliff)));
  add('ep-fields', 'every episode has a synopsis, a hook and a cliff',
    eps.length > 0 && missing.length === 0,
    missing.length ? `incomplete: episode ${missing.map((e) => e.ep).join(', ')}` : `${eps.length} episodes`);

  // 8. narrative-register ---------------------------------------------
  const proseBad = [];
  for (const e of eps) {
    for (const f of ['synopsis', 'hook', 'cliff']) {
      if (QUOTE_RE.test(String(e?.[f] ?? ''))) proseBad.push(`episode ${e.ep} ${f} contains quoted dialogue`);
    }
  }
  add('narrative-register', 'synopses are narrative prose, not script with quoted dialogue',
    proseBad.length === 0, proseBad.join('; '));

  // 9. refs-complete --------------------------------------------------
  const envIds = new Set(envs.map((e) => e?.id));
  const charIds = new Set(chars.map((c) => c?.id));
  const propIds = new Set(props.map((x) => x?.id));
  const turnIds = new Set(turns.map((t) => t?.id));
  const useEnv = new Map([...envIds].map((i) => [i, 0]));
  const useChar = new Map([...charIds].map((i) => [i, 0]));
  const useProp = new Map([...propIds].map((i) => [i, 0]));
  const refBad = [];

  for (const e of eps) {
    for (const id of arr(e?.environmentIds)) {
      if (!envIds.has(id)) refBad.push(`episode ${e.ep} references environment ${id}, which does not exist`);
      else useEnv.set(id, useEnv.get(id) + 1);
    }
    for (const id of arr(e?.characterIds)) {
      if (!charIds.has(id)) refBad.push(`episode ${e.ep} references character ${id}, which does not exist`);
      else useChar.set(id, useChar.get(id) + 1);
    }
    for (const id of arr(e?.propIds)) {
      if (!propIds.has(id)) refBad.push(`episode ${e.ep} references prop ${id}, which does not exist`);
      else useProp.set(id, useProp.get(id) + 1);
    }
  }
  for (const t of turns) {
    if (Number.isInteger(t?.episode) && total > 0 && (t.episode < 1 || t.episode > total)) {
      refBad.push(`turn ${t.id} sits on episode ${t.episode}, outside 1-${total}`);
    }
  }
  for (const pr of props) {
    for (const tid of arr(pr?.turnIds)) if (!turnIds.has(tid)) refBad.push(`prop ${pr.id} carries turn ${tid}, which does not exist`);
  }
  for (const [id, n] of useChar) if (n === 0) refBad.push(`character ${id} never appears in any episode`);
  for (const [id, n] of useEnv) if (n === 0) refBad.push(`environment ${id} is never used`);
  for (const [id, n] of useProp) if (n === 0) refBad.push(`prop ${id} is never carried`);
  if (total > 0 && eps.length !== total) refBad.push(`params.episodes says ${total}, the file has ${eps.length}`);

  add('refs-complete', 'every id exists, nobody is unemployed, nothing is unused', refBad.length === 0, refBad.join('; '));

  // 10. blocking-plan --------------------------------------------------
  const crowdBad = eps.filter((e) => arr(e?.characterIds).length > p.maxOnScreen && !has(e?.blockingPlan));
  add('blocking-plan', `more than ${p.maxOnScreen} characters in an episode needs a written blocking plan`,
    crowdBad.length === 0,
    crowdBad.length ? `missing on episode ${crowdBad.map((e) => e.ep).join(', ')}` : '');

  // 11. risk-flags -----------------------------------------------------
  const riskBad = [];
  for (const e of eps) {
    const text = ['synopsis', 'hook', 'cliff'].map((f) => e?.[f] ?? '').join(' ');
    for (const [risk, re] of Object.entries(RISK_PATTERNS)) {
      if (re.test(text) && !arr(e?.warnings).includes(risk)) {
        riskBad.push(`episode ${e.ep} reads as "${risk}" and does not declare it in warnings`);
      }
    }
  }
  add('risk-flags', 'generation traps found in the synopsis are declared in warnings',
    eps.length > 0 && riskBad.length === 0, riskBad.join('; '));

  // 12. other-lock -----------------------------------------------------
  const otherBad = [];
  for (const c of chars) {
    const anchors = arr(c?.otherAnchors);
    if (anchors.length < p.minOtherAnchors) {
      otherBad.push(`${c?.id ?? '?'} has ${anchors.length} other-anchors, needs ${p.minOtherAnchors}`);
      continue;
    }
    for (const a of anchors) {
      const s = String(a ?? '');
      if (s.trim().length < p.minAnchorChars) { otherBad.push(`${c.id} anchor "${s}" is too thin to check against a frame`); continue; }
      const hit = VAGUE_ANCHORS.find((v) => s.toLowerCase().includes(v));
      if (hit) otherBad.push(`${c.id} anchor "${s}" leans on "${hit}", which is a conclusion not a description`);
    }
  }
  add('other-lock', `every character carries >= ${p.minOtherAnchors} specific non-human anchors`,
    chars.length > 0 && otherBad.length === 0, otherBad.join('; '));

  return gates;
}

/* ------------------------------------------------------------------ */
/* Stage 4 - duration maths                                            */
/* ------------------------------------------------------------------ */

export function sceneSeconds(scene, p) {
  let dialogue = 0;
  let action = 0;
  for (const b of arr(scene?.flow)) {
    if (typeof b?.line === 'string') dialogue += wordCount(b.line) / p.wordsPerSecond;
    else if (typeof b?.action === 'string') action += p.actionBeatSeconds;
  }
  return { dialogue: r1(dialogue), action: r1(action), total: r1(dialogue + action) };
}

export function scriptStats(doc, opts = {}) {
  const p = profileOf(doc, opts.profile);
  const episodes = [];
  for (const ep of arr(doc?.episodes)) {
    const scenes = arr(ep?.scenes).map((sc) => ({ ...sceneSeconds(sc, p), beats: arr(sc?.flow).length }));
    const est = r1(scenes.reduce((n, s) => n + s.total, 0));
    const beats = scenes.reduce((n, s) => n + s.beats, 0);
    const lines = arr(ep?.scenes).reduce((n, sc) => n + arr(sc?.flow).filter((b) => typeof b?.line === 'string').length, 0);
    episodes.push({ ep: ep?.ep, est, target: ep?.targetSeconds ?? 0, beats, lines, scenes });
  }
  return { profile: p.__name, episodes };
}

/* ------------------------------------------------------------------ */
/* Stage 4 - script gates (11)                                         */
/* ------------------------------------------------------------------ */

export function scriptGates(doc, ctx = {}) {
  const p = profileOf(doc, ctx.profile);
  const { gates, add } = gateBag();
  const eps = arr(doc?.episodes);
  const stats = scriptStats(doc, ctx);
  const outline = ctx.outline ?? null;

  const bad = {
    duration: [], lineLen: [], speaker: [], hookCliff: [], hookOpen: [],
    noAction: [], prose: [], precision: [], turns: [], refs: [],
  };

  for (const [i, ep] of eps.entries()) {
    const st = stats.episodes[i];
    const label = `episode ${ep?.ep}`;

    // duration
    if (ep?.targetSeconds > 0) {
      const lo = ep.targetSeconds * (1 - p.tolerance);
      const hi = ep.targetSeconds * (1 + p.tolerance);
      if (st.est < lo) bad.duration.push(`${label} is ${r1(lo - st.est)}s short (est ${st.est}s / target ${ep.targetSeconds}s)`);
      if (st.est > hi) bad.duration.push(`${label} runs ${r1(st.est - hi)}s over (est ${st.est}s / target ${ep.targetSeconds}s)`);
    }

    // hook and cliff on paper
    if (!has(ep?.hook) || !has(ep?.cliff)) bad.hookCliff.push(label);

    // hook located within the window
    const hb = ep?.hookBeat;
    if (!Array.isArray(hb) || hb.length !== 2 || !Number.isInteger(hb[0]) || !Number.isInteger(hb[1])) {
      bad.hookOpen.push(`${label} has no hookBeat [scene, beat] claiming where the hook physically lands`);
    } else {
      const scene = arr(ep?.scenes)[hb[0] - 1];
      const flowLen = arr(scene?.flow).length;
      if (!scene || hb[1] < 1 || hb[1] > flowLen) {
        bad.hookOpen.push(`${label} hookBeat [${hb[0]}, ${hb[1]}] points at a beat that does not exist`);
      } else {
        let pos = hb[1];
        for (let k = 0; k < hb[0] - 1; k++) pos += arr(arr(ep.scenes)[k]?.flow).length;
        if (pos > p.hookWindow) {
          bad.hookOpen.push(`${label} hook lands on beat ${pos}, outside the first ${p.hookWindow}`);
        }
      }
    }

    for (const [si, sc] of arr(ep?.scenes).entries()) {
      const tag = `${label} scene ${si + 1}`;
      const cast = new Set(arr(sc?.characterIds));
      let sawAction = false;

      for (const [bi, b] of arr(sc?.flow).entries()) {
        const beatTag = `${tag} beat ${bi + 1}`;

        if (typeof b?.action === 'string') {
          sawAction = true;
          if (QUOTE_RE.test(b.action)) bad.prose.push(`${beatTag} has quoted dialogue inside an action beat`);
          if (!has(b.allowPrecision)) {
            for (const [name, re] of Object.entries(PRECISION_PATTERNS)) {
              if (re.test(b.action)) bad.precision.push(`${beatTag} reads as "${name}", which the model will not render`);
            }
          }
        }

        if (typeof b?.line === 'string') {
          const w = wordCount(b.line);
          if (w > p.maxLineWords) bad.lineLen.push(`${beatTag} is ${w} words, cap is ${p.maxLineWords}`);
          if (b.speaker !== 'VO' && !cast.has(b.speaker)) {
            bad.speaker.push(`${beatTag} is spoken by ${b.speaker}, who is not in this scene`);
          }
        }

        const hasAction = typeof b?.action === 'string';
        const hasLine = typeof b?.line === 'string';
        if (hasAction === hasLine) {
          bad.prose.push(`${beatTag} must be exactly one of an action beat or a dialogue beat`);
        }
      }

      if (arr(sc?.flow).length > 0 && !sawAction) {
        bad.noAction.push(`${tag} is all dialogue, which is a radio play with nothing to generate`);
      }
    }
  }

  // reconciliation against the outline
  if (outline) {
    const charIds = new Set(arr(outline.characters).map((c) => c?.id));
    const envIds = new Set(arr(outline.environments).map((e) => e?.id));
    const propIds = new Set(arr(outline.props).map((x) => x?.id));

    for (const ep of eps) {
      for (const [si, sc] of arr(ep?.scenes).entries()) {
        const tag = `episode ${ep.ep} scene ${si + 1}`;
        if (has(sc?.environmentId) && !envIds.has(sc.environmentId)) bad.refs.push(`${tag} uses environment ${sc.environmentId}, not in the outline`);
        for (const c of arr(sc?.characterIds)) if (!charIds.has(c)) bad.refs.push(`${tag} uses character ${c}, not in the outline`);
        for (const pr of arr(sc?.propIds)) if (!propIds.has(pr)) bad.refs.push(`${tag} uses prop ${pr}, not in the outline`);
      }
      const due = arr(outline.turns).filter((t) => t?.episode === ep?.ep).map((t) => t.id);
      const claimed = new Set(arr(ep?.turnsClaimed));
      for (const t of due) if (!claimed.has(t)) bad.turns.push(`episode ${ep.ep} does not claim turn ${t}, which the outline puts there`);
    }
  }

  // --- the configuration gate: run first in the report, checked always ---
  const maxWordsThatFit = p.maxCutSeconds * p.wordsPerSecond;
  add('param-coherence',
    `maxLineWords (${p.maxLineWords}) fits inside maxCutSeconds x wordsPerSecond (${r1(maxWordsThatFit)})`,
    p.maxLineWords <= maxWordsThatFit,
    p.maxLineWords <= maxWordsThatFit ? '' :
      `profile "${p.__name}" permits a ${p.maxLineWords}-word line that cannot fit the longest cut, so no script can pass`);

  add('duration', `every episode within target +/-${Math.round(p.tolerance * 100)}%`,
    eps.length > 0 && bad.duration.length === 0, bad.duration.join('; '));
  add('line-length', `every line <= ${p.maxLineWords} words`, bad.lineLen.length === 0, bad.lineLen.join('; '));
  add('speaker-legal', 'every speaker is in the scene, or marked VO', bad.speaker.length === 0, bad.speaker.join('; '));
  add('hook-cliff', 'every episode states a hook and a cliff', eps.length > 0 && bad.hookCliff.length === 0, bad.hookCliff.join('; '));
  add('hook-located', `the hook lands within the first ${p.hookWindow} beats (hookBeat claims it)`,
    eps.length > 0 && bad.hookOpen.length === 0, bad.hookOpen.join('; '));
  add('has-action', 'every scene has at least one action beat', eps.length > 0 && bad.noAction.length === 0, bad.noAction.join('; '));
  add('action-register', 'action beats are narrative, dialogue lives in its own beat', bad.prose.length === 0, bad.prose.join('; '));
  add('common-action', 'no precision traps the model cannot render', bad.precision.length === 0, bad.precision.join('; '));
  add('turns-claimed', 'the outline turns for each episode are claimed by the script',
    bad.turns.length === 0, outline ? bad.turns.join('; ') : SKIP_OUTLINE);
  add('refs-script', 'characters, environments and props reconcile to the outline',
    bad.refs.length === 0, outline ? bad.refs.join('; ') : SKIP_OUTLINE);

  return gates;
}

/* ------------------------------------------------------------------ */
/* seed - outline to script                                            */
/* ------------------------------------------------------------------ */
/*
 * Settled facts move down mechanically. The model never re-derives them.
 * scenes stays empty, because that is the only genuinely new work.
 */

export function seedScript(outline, epRange = null) {
  const p = profileOf(outline);
  const want = parseRange(epRange);
  const eps = arr(outline?.episodes)
    .filter((e) => !want || want.includes(e?.ep))
    .map((e) => {
      const turns = arr(outline?.turns).filter((t) => t?.episode === e?.ep);
      return {
        ep: e?.ep,
        targetSeconds: outline?.params?.secondsPerEpisode ?? p.defaultSecondsPerEpisode,
        hook: e?.hook ?? '',
        cliff: e?.cliff ?? '',
        turnsClaimed: turns.map((t) => t.id),
        hookBeat: null,
        seedNote: {
          synopsis: e?.synopsis ?? '',
          candidateEnvironments: arr(e?.environmentIds),
          candidateCharacters: arr(e?.characterIds),
          candidateProps: arr(e?.propIds),
          turns: turns.map((t) => ({ id: t.id, type: t.type, weight: t.weight, setup: t.setup, payoff: t.payoff })),
          blockingPlan: e?.blockingPlan ?? '',
          warnings: arr(e?.warnings),
        },
        scenes: [],
      };
    });

  return { source: outline?.source ?? '', profile: outline?.profile ?? DEFAULT_PROFILE, episodes: eps };
}

export function parseRange(spec) {
  if (!spec) return null;
  const out = [];
  for (const part of String(spec).split(',')) {
    const m = part.trim().match(/^(\d+)(?:-(\d+))?$/);
    if (!m) throw new Error(`bad episode range "${part}"`);
    const a = Number(m[1]);
    const b = m[2] ? Number(m[2]) : a;
    for (let i = a; i <= b; i++) out.push(i);
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Rendering                                                           */
/* ------------------------------------------------------------------ */

export function renderGates(gates, { title = 'Quality gates' } = {}) {
  const passed = gates.filter((g) => g.ok).length;
  const lines = [`${title}: ${passed}/${gates.length}`, ''];
  for (const g of gates) {
    lines.push(`${g.ok ? 'PASS' : 'FAIL'}  ${g.id.padEnd(18)} ${g.label}`);
    if (g.detail) lines.push(`      ${g.detail}`);
  }
  return lines.join('\n');
}

export function renderOutlineMarkdown(doc) {
  const p = profileOf(doc);
  const out = [];
  out.push(`# ${doc?.source ?? 'Untitled'}`, '');
  out.push(`${doc?.params?.episodes ?? arr(doc?.episodes).length} episodes x ${doc?.params?.secondsPerEpisode ?? p.defaultSecondsPerEpisode}s, ${p.aspect}, register: ${doc?.params?.register ?? 'unstated'}`, '');

  out.push('## Cast', '');
  out.push('| id | name | tier | role | other-anchors |', '| --- | --- | --- | --- | --- |');
  for (const c of arr(doc?.characters)) {
    out.push(`| ${c.id} | ${c.name} | ${c.tier} | ${c.role ?? ''} | ${arr(c.otherAnchors).join('; ')} |`);
  }
  out.push('');

  out.push('## World', '');
  out.push('| id | name | primary | reuse plan |', '| --- | --- | --- | --- |');
  for (const e of arr(doc?.environments)) {
    out.push(`| ${e.id} | ${e.name} | ${e.primary ? 'yes' : 'variant'} | ${e.reusePlan ?? ''} |`);
  }
  out.push('');

  if (arr(doc?.props).length) {
    out.push('## Props', '');
    out.push('| id | name | function | carries |', '| --- | --- | --- | --- |');
    for (const pr of arr(doc.props)) out.push(`| ${pr.id} | ${pr.name} | ${pr.function} | ${arr(pr.turnIds).join(', ')} |`);
    out.push('');
  }

  out.push('## Turns', '');
  out.push('| id | ep | weight | type | setup | payoff |', '| --- | --- | --- | --- | --- | --- |');
  for (const t of arr(doc?.turns)) {
    out.push(`| ${t.id} | ${t.episode} | ${t.weight ?? 'minor'} | ${t.type ?? ''} | ${t.setup ?? ''} | ${t.payoff ?? ''} |`);
  }
  out.push('');

  out.push('## Episodes', '');
  for (const e of arr(doc?.episodes)) {
    out.push(`### Episode ${e.ep}`, '');
    out.push(e.synopsis ?? '', '');
    out.push(`**Hook.** ${e.hook ?? ''}`, '');
    out.push(`**Cliff.** ${e.cliff ?? ''}`, '');
    const bits = [];
    if (arr(e.environmentIds).length) bits.push(`where: ${arr(e.environmentIds).join(', ')}`);
    if (arr(e.characterIds).length) bits.push(`who: ${arr(e.characterIds).join(', ')}`);
    if (arr(e.propIds).length) bits.push(`props: ${arr(e.propIds).join(', ')}`);
    if (arr(e.warnings).length) bits.push(`warnings: ${arr(e.warnings).join(', ')}`);
    if (bits.length) out.push(bits.join(' | '), '');
    if (has(e.blockingPlan)) out.push(`Blocking: ${e.blockingPlan}`, '');
  }
  return out.join('\n');
}

export function renderScriptMarkdown(doc, ctx = {}) {
  const stats = scriptStats(doc, ctx);
  const name = (id) => {
    const c = arr(ctx.outline?.characters).find((x) => x.id === id);
    return c ? c.name : id;
  };
  const env = (id) => {
    const e = arr(ctx.outline?.environments).find((x) => x.id === id);
    return e ? e.name : id;
  };

  const out = [`# ${doc?.source ?? 'Untitled'} - script`, ''];
  for (const [i, ep] of arr(doc?.episodes).entries()) {
    const st = stats.episodes[i];
    out.push(`## Episode ${ep.ep}`, '');
    out.push(`Estimated ${st.est}s against a target of ${st.target}s. ${st.beats} beats, ${st.lines} lines.`, '');
    out.push(`**Hook.** ${ep.hook ?? ''}`, '');
    out.push(`**Cliff.** ${ep.cliff ?? ''}`, '');
    for (const [si, sc] of arr(ep.scenes).entries()) {
      const light = has(sc.lighting) ? `, ${sc.lighting}` : '';
      out.push(`### Scene ${si + 1} - ${env(sc.environmentId)}${light}`, '');
      for (const b of arr(sc.flow)) {
        if (typeof b.action === 'string') out.push(b.action, '');
        else out.push(`**${name(b.speaker)}**${has(b.delivery) ? ` *(${b.delivery})*` : ''}: ${b.line}`, '');
      }
    }
  }
  return out.join('\n');
}

/* ------------------------------------------------------------------ */
/* CLI                                                                 */
/* ------------------------------------------------------------------ */

const USAGE = `pipeline.mjs - vertical-drama-pipeline deterministic helpers

  profile [name]                              print a format profile
  validate <file> --stage outline|script      run the gates, exit 1 on failure
             [--outline <outline.json>] [--profile <name>]
  checkup  <file> --stage outline|script      run the gates, always exit 0
             [--outline <outline.json>] [--profile <name>]
  seed script <outline.json> [--eps 1-3]      write the script skeleton to stdout
  render   <file> --stage outline|script --md [--outline <outline.json>]
  stats    <script.json>                      per-episode duration table

Stages present: outline, script. The shots stage is not built yet.`;

function readJson(path) {
  return JSON.parse(readFileSync(resolve(path), 'utf8'));
}

function flag(rest, name, fallback = null) {
  const i = rest.indexOf(name);
  return i >= 0 && rest[i + 1] && !rest[i + 1].startsWith('--') ? rest[i + 1] : fallback;
}

function gatesFor(stage, doc, ctx) {
  if (stage === 'outline') return outlineGates(doc, ctx);
  if (stage === 'script') return scriptGates(doc, ctx);
  throw new Error(`unknown stage "${stage}". Use outline or script.`);
}

function main(argv) {
  const [cmd, ...rest] = argv;
  if (!cmd || cmd === '--help' || cmd === '-h') { console.log(USAGE); return 0; }

  if (cmd === 'profile') {
    const name = rest[0] ?? DEFAULT_PROFILE;
    if (!PROFILES[name]) { console.error(`unknown profile "${name}". Known: ${Object.keys(PROFILES).join(', ')}`); return 1; }
    console.log(JSON.stringify(PROFILES[name], null, 2));
    return 0;
  }

  if (cmd === 'seed') {
    if (rest[0] !== 'script') { console.error('only "seed script <outline.json>" exists so far'); return 1; }
    const outline = readJson(rest[1]);
    console.log(JSON.stringify(seedScript(outline, flag(rest, '--eps')), null, 2));
    return 0;
  }

  const file = rest[0];
  if (!file) { console.error(USAGE); return 1; }
  const doc = readJson(file);
  const stage = flag(rest, '--stage', 'outline');
  const ctx = { profile: flag(rest, '--profile') };
  const outlinePath = flag(rest, '--outline');
  if (outlinePath) ctx.outline = readJson(outlinePath);

  if (cmd === 'stats') {
    const st = scriptStats(doc, ctx);
    console.log(`profile: ${st.profile}`);
    for (const e of st.episodes) {
      const drift = e.target ? ` (${e.est >= e.target ? '+' : ''}${r1(e.est - e.target)}s)` : '';
      console.log(`  episode ${String(e.ep).padStart(2)}  ${String(e.est).padStart(6)}s / ${e.target}s${drift}  ${e.beats} beats, ${e.lines} lines`);
    }
    return 0;
  }

  if (cmd === 'render') {
    const md = stage === 'script' ? renderScriptMarkdown(doc, ctx) : renderOutlineMarkdown(doc);
    console.log(md);
    return 0;
  }

  if (cmd === 'validate' || cmd === 'checkup') {
    const gates = gatesFor(stage, doc, ctx);
    const failed = gates.filter((g) => !g.ok);
    console.log(renderGates(gates, { title: `${basename(file)} - ${stage} gates` }));
    if (cmd === 'checkup') {
      console.log('');
      console.log(failed.length
        ? `Diagnosis: ${failed.length} of ${gates.length} gates failing. Nothing was changed.`
        : `Diagnosis: all ${gates.length} gates pass.`);
      return 0;
    }
    return failed.length ? 1 : 0;
  }

  console.error(USAGE);
  return 1;
}

const isMain = process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));
if (isMain) process.exit(main(process.argv.slice(2)));
