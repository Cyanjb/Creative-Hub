#!/usr/bin/env node
// Self-test for vertical-drama-pipeline. Calls no model and costs no quota.
//
// The rule this file exists to enforce: EVERY GATE HAS A BREACH CASE.
// A gate with only a passing fixture is an assertion that a gate exists.
// A gate with a breach case is a promise that it blocks.

import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  PROFILES, DEFAULT_PROFILE, profileOf, worldCap,
  wordCount, sceneSeconds, scriptStats,
  outlineGates, scriptGates, seedScript, parseRange,
  renderOutlineMarkdown, renderScriptMarkdown, renderGates,
  VAGUE_ANCHORS, RISK_PATTERNS, PRECISION_PATTERNS,
} from './pipeline.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const ex = (n) => JSON.parse(readFileSync(resolve(join(here, '..', 'examples', n)), 'utf8'));

let count = 0;
const failures = [];

function ok(cond, what) {
  count += 1;
  if (!cond) failures.push(what);
}
function eq(actual, expected, what) {
  count += 1;
  if (actual !== expected) failures.push(`${what} (expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)})`);
}
const clone = (o) => JSON.parse(JSON.stringify(o));
const byId = (gates, id) => gates.find((g) => g.id === id);

/** Assert a gate fails on a mutated document, and that nothing else broke silently. */
function breaks(gates, id, what) {
  const g = byId(gates, id);
  count += 1;
  if (!g) { failures.push(`${what}: gate "${id}" does not exist`); return; }
  if (g.ok) { failures.push(`${what}: gate "${id}" passed when it should have blocked`); return; }
  count += 1;
  if (!g.detail) failures.push(`${what}: gate "${id}" failed with an empty detail string, which is a shrug not a fix`);
}

const OUTLINE = ex('tidewrack-outline.json');
const SCRIPT = ex('tidewrack-script.json');

/* ================================================================== */
/* Profiles                                                            */
/* ================================================================== */

ok(PROFILES[DEFAULT_PROFILE], 'the default profile exists');
eq(profileOf({}).__name, DEFAULT_PROFILE, 'an empty doc falls back to the default profile');
eq(profileOf({ profile: 'vertical-microdrama' }).maxOnScreen, 2, 'vertical caps on-screen characters at two');
ok((() => { try { profileOf({ profile: 'nope' }); return false; } catch { return true; } })(),
  'an unknown profile is an error, not a silent default');
eq(profileOf({ params: { overrides: { maxLineWords: 14 } } }).maxLineWords, 14, 'params.overrides beats the profile');

// every profile must be internally satisfiable, or no script written against it can pass
for (const [name, p] of Object.entries(PROFILES)) {
  ok(p.maxLineWords <= p.maxCutSeconds * p.wordsPerSecond, `profile "${name}" is internally satisfiable`);
  ok(p.minCutSeconds < p.maxCutSeconds, `profile "${name}" has a cut band that is a band`);
  ok(p.targetCutSeconds >= p.minCutSeconds && p.targetCutSeconds <= p.maxCutSeconds, `profile "${name}" targets inside its own band`);
  ok(p.recommendedSegmentSeconds <= p.maxSegmentSeconds, `profile "${name}" recommends at or below its ceiling`);
  ok(p.tolerance > 0 && p.tolerance < 1, `profile "${name}" has a sane tolerance`);
}

// the world cap formula, at its clamps
const vp = PROFILES['vertical-microdrama'];
eq(worldCap(vp, 1), 4, 'world cap for a 1-episode run');
eq(worldCap(vp, 6), 4, 'world cap for a 6-episode run');
eq(worldCap(vp, 40), 8, 'world cap clamps at the ceiling for a long run');
ok(worldCap(vp, 1000) === vp.worldCapMax, 'world cap never exceeds its maximum');

/* ================================================================== */
/* Duration maths                                                      */
/* ================================================================== */

eq(wordCount('one two three'), 3, 'word count on a plain line');
eq(wordCount('  spaced   out  '), 2, 'word count ignores padding');
eq(wordCount(''), 0, 'word count of nothing is zero');
eq(wordCount(null), 0, 'word count of null is zero, not a crash');

const p = profileOf(SCRIPT);
eq(sceneSeconds({ flow: [{ action: 'a' }, { action: 'b' }] }, p).total, 4, 'two action beats are two times the beat constant');
eq(sceneSeconds({ flow: [{ speaker: 'C01', line: 'one two three four five' }] }, p).total, 2,
  'five words at 2.5 words per second is two seconds');
eq(sceneSeconds({ flow: [] }, p).total, 0, 'an empty scene is zero seconds');
eq(sceneSeconds({}, p).total, 0, 'a missing flow is zero seconds, not a crash');

{
  const st = scriptStats(SCRIPT);
  eq(st.episodes.length, 2, 'stats cover every episode');
  ok(st.episodes.every((e) => e.est > 0), 'every episode has a computed runtime');
  ok(st.episodes.every((e) => Math.abs(e.est - e.target) <= e.target * p.tolerance),
    'the shipped fixture sits inside its own tolerance band');
  // the maths must be the sum of its parts, not an independent guess
  const ep1 = SCRIPT.episodes[0];
  const bySum = ep1.scenes.reduce((n, sc) => n + sceneSeconds(sc, p).total, 0);
  ok(Math.abs(st.episodes[0].est - bySum) < 0.11, 'the episode estimate is the sum of its scenes');
}

/* ================================================================== */
/* The shipped fixtures pass everything                                */
/* ================================================================== */

{
  const g = outlineGates(OUTLINE);
  eq(g.length, 12, 'the outline stage has twelve gates');
  const bad = g.filter((x) => !x.ok);
  ok(bad.length === 0, `the outline fixture passes every gate (failing: ${bad.map((x) => x.id).join(', ')})`);
  ok(new Set(g.map((x) => x.id)).size === g.length, 'outline gate ids are unique');
  ok(g.every((x) => x.label && x.label.length > 8), 'every outline gate has a readable label');
}
{
  const g = scriptGates(SCRIPT, { outline: OUTLINE });
  eq(g.length, 11, 'the script stage has eleven gates');
  const bad = g.filter((x) => !x.ok);
  ok(bad.length === 0, `the script fixture passes every gate (failing: ${bad.map((x) => x.id).join(', ')})`);
  ok(new Set(g.map((x) => x.id)).size === g.length, 'script gate ids are unique');
  ok(g.every((x) => x.label && x.label.length > 8), 'every script gate has a readable label');
}

/* ================================================================== */
/* Breach cases - outline (12)                                         */
/* ================================================================== */

{ // 1 cast-cap, over
  const d = clone(OUTLINE);
  for (let i = 0; i < 5; i++) d.characters.push({ id: `CX${i}`, name: `x${i}`, tier: 'lead', role: 'x', arc: 'x', from: ['original'], otherAnchors: d.characters[0].otherAnchors });
  breaks(outlineGates(d), 'cast-cap', 'too many leads');
}
{ // 1b cast-cap, no lead at all
  const d = clone(OUTLINE);
  for (const c of d.characters) c.tier = 'support';
  breaks(outlineGates(d), 'cast-cap', 'a cast with no lead');
}
{ // 2 world-cap
  const d = clone(OUTLINE);
  for (let i = 0; i < 6; i++) {
    d.environments.push({ id: `EX${i}`, name: `x${i}`, primary: true, variantOf: null, reusePlan: null });
    d.episodes[0].environmentIds.push(`EX${i}`);
  }
  breaks(outlineGates(d), 'world-cap', 'more primary environments than the cap');
}
{ // 3 prop-cap, no stated function
  const d = clone(OUTLINE);
  d.props[0].function = '';
  breaks(outlineGates(d), 'prop-cap', 'a prop with no dramatic function is set dressing');
}
{ // 3b prop-cap, over the count
  const d = clone(OUTLINE);
  for (let i = 0; i < 6; i++) {
    d.props.push({ id: `PX${i}`, name: `x${i}`, function: 'x', turnIds: [] });
    d.episodes[0].propIds.push(`PX${i}`);
  }
  breaks(outlineGates(d), 'prop-cap', 'more tracked props than the cap');
}
{ // 4 turn-gap, a hole in the middle
  const d = clone(OUTLINE);
  d.turns[1].episode = 5;
  breaks(outlineGates(d), 'turn-gap', 'a gap wider than the cap between turns');
}
{ // 4b turn-gap, a dead opening
  const d = clone(OUTLINE);
  d.turns[0].episode = 4;
  breaks(outlineGates(d), 'turn-gap', 'dead episodes before the first turn');
}
{ // 4c turn-gap, a dead tail
  const d = clone(OUTLINE);
  d.turns[2].episode = 4;
  breaks(outlineGates(d), 'turn-gap', 'dead episodes after the last turn');
}
{ // 5 major-turn
  const d = clone(OUTLINE);
  for (const t of d.turns) t.weight = 'minor';
  breaks(outlineGates(d), 'major-turn', 'a series with no major turn');
}
{ // 5b major-turn, everything saved for the finale
  const d = clone(OUTLINE);
  d.turns[1].weight = 'minor';
  d.turns[2].episode = 6;
  breaks(outlineGates(d), 'major-turn', 'the first major turn arriving only in the final episode');
}
{ // 6 arc-coverage
  const d = clone(OUTLINE);
  d.turns = d.turns.filter((t) => t.episode !== 4);
  d.props[0].turnIds = ['T03'];
  d.props[1].turnIds = ['T03'];
  breaks(outlineGates(d), 'arc-coverage', 'an ai-director peak with no turn beside it');
}
{ // 6b arc-coverage skips cleanly when there is no arc
  const d = clone(OUTLINE);
  delete d.arc;
  const g = byId(outlineGates(d), 'arc-coverage');
  ok(g.ok, 'arc-coverage passes when no arc was supplied');
  ok(/skipped/.test(g.detail), 'a skipped gate says out loud that it was skipped');
}
{ // 7 ep-fields
  const d = clone(OUTLINE);
  d.episodes[2].cliff = '   ';
  breaks(outlineGates(d), 'ep-fields', 'an episode missing its cliff');
}
{ // 8 narrative-register
  const d = clone(OUTLINE);
  d.episodes[0].synopsis += ' She says "mark it" and he does not.';
  breaks(outlineGates(d), 'narrative-register', 'quoted dialogue in a synopsis');
}
{ // 8b an apostrophe must NOT trip the quote check
  const d = clone(OUTLINE);
  d.episodes[0].synopsis += " It is the harbour's own ledger and it isn't balanced.";
  ok(byId(outlineGates(d), 'narrative-register').ok, 'apostrophes and contractions pass the register gate');
}
{ // 9 refs-complete, dangling id
  const d = clone(OUTLINE);
  d.episodes[0].characterIds.push('C99');
  breaks(outlineGates(d), 'refs-complete', 'an episode referencing a character that does not exist');
}
{ // 9b refs-complete, an unemployed character
  const d = clone(OUTLINE);
  d.characters.push({ id: 'C90', name: 'nobody', tier: 'functional', role: 'x', from: ['original'], otherAnchors: d.characters[0].otherAnchors });
  breaks(outlineGates(d), 'refs-complete', 'a character who never appears in any episode');
}
{ // 9c refs-complete, an unused environment
  const d = clone(OUTLINE);
  d.environments.push({ id: 'E90', name: 'unused', primary: false, variantOf: 'E01', reusePlan: 'x' });
  breaks(outlineGates(d), 'refs-complete', 'an environment nothing is ever shot in');
}
{ // 9d refs-complete, episode count disagreement
  const d = clone(OUTLINE);
  d.params.episodes = 8;
  breaks(outlineGates(d), 'refs-complete', 'params.episodes disagreeing with the episode list');
}
{ // 10 blocking-plan
  const d = clone(OUTLINE);
  delete d.episodes[4].blockingPlan;
  breaks(outlineGates(d), 'blocking-plan', 'three characters in one episode with no blocking plan');
}
{ // 11 risk-flags
  const d = clone(OUTLINE);
  d.episodes[1].synopsis += ' Rain comes through the roof all night.';
  breaks(outlineGates(d), 'risk-flags', 'an undeclared generation trap in the synopsis');
}
{ // 11b every named risk pattern actually matches something
  for (const [name, re] of Object.entries(RISK_PATTERNS)) {
    ok(re instanceof RegExp, `risk pattern "${name}" is a regular expression`);
  }
  ok(RISK_PATTERNS.hands.test('her fingers close on the rope'), 'the hands pattern catches fingers');
  ok(!RISK_PATTERNS.hands.test('he handed it over and walked away'), 'the hands pattern does not trip on "handed"');
  ok(RISK_PATTERNS.crowd.test('a crowd on the quay'), 'the crowd pattern catches a crowd');
}
{ // 12 other-lock, too few anchors
  const d = clone(OUTLINE);
  d.characters[0].otherAnchors = ['four knuckles on every finger instead of three'];
  breaks(outlineGates(d), 'other-lock', 'a character with fewer than three other-anchors');
}
{ // 12b other-lock, an adjective pretending to be an anchor
  const d = clone(OUTLINE);
  d.characters[1].otherAnchors = ['an ethereal presence about the shoulders', 'a haunting stillness', 'something ancient in the face'];
  breaks(outlineGates(d), 'other-lock', 'vague adjectives standing in for physical anchors');
}
{ // 12c other-lock, an anchor too thin to check
  const d = clone(OUTLINE);
  d.characters[2].otherAnchors = ['tall', 'wet hair', 'blue nails'];
  breaks(outlineGates(d), 'other-lock', 'anchors too thin to tick off against a frame');
}
{ // 12d every banned word is actually caught
  for (const v of VAGUE_ANCHORS) {
    const d = clone(OUTLINE);
    d.characters[0].otherAnchors = [`a bearing that is plainly ${v} at the shoulder`, ...d.characters[0].otherAnchors.slice(1)];
    const g = byId(outlineGates(d), 'other-lock');
    count += 1;
    if (g.ok) failures.push(`the vagueness ban list does not actually catch "${v}"`);
  }
}

/* ================================================================== */
/* Breach cases - script (11)                                          */
/* ================================================================== */

{ // 1 param-coherence
  const d = clone(SCRIPT);
  d.params = { overrides: { maxLineWords: 40 } };
  breaks(scriptGates(d, { outline: OUTLINE }), 'param-coherence', 'a profile that permits a line no cut can hold');
}
{ // 2 duration, over
  const d = clone(SCRIPT);
  for (let i = 0; i < 30; i++) d.episodes[0].scenes[0].flow.push({ action: 'She hauls another crate up onto the sill.' });
  breaks(scriptGates(d, { outline: OUTLINE }), 'duration', 'an episode written well over its target');
}
{ // 2b duration, under
  const d = clone(SCRIPT);
  d.episodes[1].scenes[1].flow = d.episodes[1].scenes[1].flow.slice(0, 2);
  breaks(scriptGates(d, { outline: OUTLINE }), 'duration', 'an episode written well under its target');
}
{ // 3 line-length
  const d = clone(SCRIPT);
  d.episodes[0].scenes[0].flow[6].line = 'That one clears the week and the week before it and probably the one before that as well';
  breaks(scriptGates(d, { outline: OUTLINE }), 'line-length', 'a line longer than a single cut can hold');
}
{ // 4 speaker-legal
  const d = clone(SCRIPT);
  d.episodes[0].scenes[0].flow[6].speaker = 'C03';
  breaks(scriptGates(d, { outline: OUTLINE }), 'speaker-legal', 'a line spoken by someone not in the scene');
}
{ // 4b VO is always legal
  const d = clone(SCRIPT);
  d.episodes[0].scenes[0].flow[6].speaker = 'VO';
  ok(byId(scriptGates(d, { outline: OUTLINE }), 'speaker-legal').ok, 'a VO line needs no on-screen speaker');
}
{ // 5 hook-cliff
  const d = clone(SCRIPT);
  d.episodes[0].cliff = '';
  breaks(scriptGates(d, { outline: OUTLINE }), 'hook-cliff', 'an episode with no cliff on paper');
}
{ // 6 hook-located, missing claim
  const d = clone(SCRIPT);
  d.episodes[0].hookBeat = null;
  breaks(scriptGates(d, { outline: OUTLINE }), 'hook-located', 'a hook described but never located in a beat');
}
{ // 6b hook-located, claimed too late
  const d = clone(SCRIPT);
  d.episodes[0].hookBeat = [1, 9];
  breaks(scriptGates(d, { outline: OUTLINE }), 'hook-located', 'a hook landing outside the opening window');
}
{ // 6c hook-located, pointing at nothing
  const d = clone(SCRIPT);
  d.episodes[0].hookBeat = [1, 999];
  breaks(scriptGates(d, { outline: OUTLINE }), 'hook-located', 'a hookBeat pointing at a beat that does not exist');
}
{ // 6d the window counts across scenes, not per scene
  const d = clone(SCRIPT);
  d.episodes[0].hookBeat = [2, 1];
  breaks(scriptGates(d, { outline: OUTLINE }), 'hook-located', 'a hook in scene two counted from the top of the episode');
}
{ // 7 has-action
  const d = clone(SCRIPT);
  d.episodes[0].scenes[0].flow = d.episodes[0].scenes[0].flow.filter((b) => typeof b.line === 'string');
  d.episodes[0].hookBeat = [1, 1];
  breaks(scriptGates(d, { outline: OUTLINE }), 'has-action', 'a scene of pure dialogue with nothing to generate');
}
{ // 8 action-register, quoted dialogue inside an action
  const d = clone(SCRIPT);
  d.episodes[0].scenes[0].flow[0].action = 'She hauls the crate up and says "that clears it".';
  breaks(scriptGates(d, { outline: OUTLINE }), 'action-register', 'dialogue smuggled into an action beat');
}
{ // 8b action-register, a beat that is both
  const d = clone(SCRIPT);
  d.episodes[0].scenes[0].flow[0] = { action: 'She hauls the crate up.', speaker: 'C01', line: 'Done.' };
  breaks(scriptGates(d, { outline: OUTLINE }), 'action-register', 'a beat that is an action and a line at once');
}
{ // 8c action-register, a beat that is neither
  const d = clone(SCRIPT);
  d.episodes[0].scenes[0].flow[0] = { delivery: 'nothing here' };
  breaks(scriptGates(d, { outline: OUTLINE }), 'action-register', 'a beat that is neither an action nor a line');
}
{ // 9 common-action
  const d = clone(SCRIPT);
  d.episodes[0].scenes[0].flow[0].action = 'The hook moves half an inch and she catches the micro-expression behind it.';
  breaks(scriptGates(d, { outline: OUTLINE }), 'common-action', 'a precision trap the model cannot render');
}
{ // 9b common-action, the override works and needs a reason
  const d = clone(SCRIPT);
  d.episodes[0].scenes[0].flow[0] = { action: 'The hook moves half an inch.', allowPrecision: 'tested on this character, renders' };
  ok(byId(scriptGates(d, { outline: OUTLINE }), 'common-action').ok, 'allowPrecision lets a tested beat through');
  const d2 = clone(SCRIPT);
  d2.episodes[0].scenes[0].flow[0] = { action: 'The hook moves half an inch.', allowPrecision: '  ' };
  breaks(scriptGates(d2, { outline: OUTLINE }), 'common-action', 'an empty allowPrecision is not a reason');
}
{ // 9c every precision pattern is live
  ok(PRECISION_PATTERNS['sub-inch movement'].test('it shifts by a hair'), 'the sub-inch pattern catches "by a hair"');
  ok(PRECISION_PATTERNS['micro-expression'].test('his nostrils flare'), 'the micro-expression pattern catches a nostril flare');
  ok(!PRECISION_PATTERNS['sub-inch movement'].test('she hauls the crate up onto the sill'),
    'a common action does not trip the precision gate');
}
{ // 10 turns-claimed
  const d = clone(SCRIPT);
  d.episodes[1].turnsClaimed = [];
  breaks(scriptGates(d, { outline: OUTLINE }), 'turns-claimed', 'an episode not claiming the turn the outline put there');
}
{ // 10b turns-claimed skips cleanly with no outline
  const g = byId(scriptGates(clone(SCRIPT)), 'turns-claimed');
  ok(g.ok, 'turns-claimed passes when no outline was supplied');
  ok(/skipped/.test(g.detail), 'the skip is stated, not silent');
}
{ // 11 refs-script
  const d = clone(SCRIPT);
  d.episodes[0].scenes[0].environmentId = 'E99';
  breaks(scriptGates(d, { outline: OUTLINE }), 'refs-script', 'a scene set somewhere the outline does not have');
}
{ // 11b refs-script, an unknown prop
  const d = clone(SCRIPT);
  d.episodes[0].scenes[0].propIds = ['P99'];
  breaks(scriptGates(d, { outline: OUTLINE }), 'refs-script', 'a scene using a prop the outline does not have');
}
{ // 11c refs-script skips cleanly with no outline
  const g = byId(scriptGates(clone(SCRIPT)), 'refs-script');
  ok(g.ok, 'refs-script passes when no outline was supplied');
  ok(/skipped/.test(g.detail), 'the skip is stated, not silent');
}

/* ================================================================== */
/* Seed - settled facts move down, design work stays blank             */
/* ================================================================== */

{
  const seeded = seedScript(OUTLINE);
  eq(seeded.episodes.length, 6, 'seeding with no range takes every episode');
  eq(seeded.source, OUTLINE.source, 'the seed carries the title down');
  eq(seeded.profile, OUTLINE.profile, 'the seed carries the format profile down');
  ok(seeded.episodes.every((e) => e.scenes.length === 0), 'the seed leaves the writing blank');
  ok(seeded.episodes.every((e) => e.targetSeconds === OUTLINE.params.secondsPerEpisode),
    'the target runtime is carried down, never re-derived');
  eq(seeded.episodes[1].turnsClaimed.join(','), 'T01', 'the turns for an episode are carried down');
  eq(seeded.episodes[0].turnsClaimed.length, 0, 'an episode with no turn claims nothing');
  eq(seeded.episodes[0].hook, OUTLINE.episodes[0].hook, 'the hook is carried down verbatim');
  ok(seeded.episodes[4].seedNote.blockingPlan.length > 0, 'the blocking plan reaches the writing pass');
  eq(seeded.episodes[0].seedNote.warnings.join(','), 'water', 'the warnings reach the writing pass');
  ok(seeded.episodes.every((e) => e.hookBeat === null), 'the seed does not guess where the hook lands');

  const ranged = seedScript(OUTLINE, '1-2');
  eq(ranged.episodes.length, 2, 'a range limits the seed');
  eq(ranged.episodes.map((e) => e.ep).join(','), '1,2', 'the range takes the right episodes');
  eq(seedScript(OUTLINE, '2,5').episodes.map((e) => e.ep).join(','), '2,5', 'a discontinuous range works');
}

eq(parseRange(null), null, 'no range means everything');
eq(parseRange('3').join(','), '3', 'a single episode range');
eq(parseRange('1-3').join(','), '1,2,3', 'an inclusive range');
eq(parseRange('1-2,5').join(','), '1,2,5', 'a mixed range');
ok((() => { try { parseRange('banana'); return false; } catch { return true; } })(), 'a bad range is an error, not a guess');

/* ================================================================== */
/* Rendering                                                           */
/* ================================================================== */

{
  const md = renderOutlineMarkdown(OUTLINE);
  ok(md.includes('# Tidewrack'), 'the outline renders its title');
  ok(md.includes('Vessa'), 'the outline renders the cast');
  ok(md.includes('The tally-cord'), 'the outline renders the props');
  ok(md.includes('Episode 6'), 'the outline renders every episode');
  ok(md.includes('9:16'), 'the outline states the aspect ratio it was written for');
}
{
  const md = renderScriptMarkdown(SCRIPT, { outline: OUTLINE });
  ok(md.includes('**Vessa**'), 'the script shows names, not ids, in the reading view');
  ok(!md.includes('**C01**'), 'raw character ids never reach the reading view');
  ok(md.includes('The Wrackline'), 'the script resolves environment ids to names');
  ok(/Estimated \d/.test(md), 'the script states its computed runtime');
}
{
  const txt = renderGates(outlineGates(OUTLINE));
  ok(txt.includes('12/12'), 'the gate report counts what passed');
  const broken = clone(OUTLINE);
  broken.episodes[0].hook = '';
  ok(renderGates(outlineGates(broken)).includes('FAIL'), 'the gate report marks failures plainly');
}

/* ================================================================== */

if (failures.length) {
  console.error(`\n${failures.length} of ${count} assertions FAILED:\n`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log(`${count} assertions passed. No model called, no quota spent.`);
