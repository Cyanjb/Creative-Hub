# Writing the outline

Produces `outline.json`. Two rounds with an approval gate between them.

## The order is the method

1. **Cut.** A vertical micro-drama run holds one main line and at most one secondary. Everything
   else goes. Write what went and why.

2. **Merge, then tier.** Characters with the same function become one face. Then sort into
   `lead` (1 to 4), `support` (up to 6), `functional` (up to 6). Functional characters occupy a
   face, not a name: label them by what they do, and skip the arc. A tallykeeper is there to
   tally.

3. **Collect the world.** The environment cap scales with episode count and the validator prints
   the number. An environment appearing once is either cut or made a variant of a parent, with
   what changed written into `reusePlan`. Every extra environment is a consistency liability for
   the whole run, not just for its own episode.

4. **Place the turns.** Majors first, then minors filling the gaps. Hard rules the gate enforces:
   no more than `maxTurnGap` episodes between turns, no dead run at the head or the tail, at
   least one major, and the first major not saved for the finale.

   **With an `ai-director` arc, this step is mostly determined.** Every arc point marked `peak` or
   `turn` needs a turn on it or within one episode. Place those first, then fill.

   What counts as a turn is set by `params.register`. A debt series turns on obligation shifting.
   A revenge series turns on exposure. Same machinery, different currency.

5. **Collect the props, last.** This ordering is not arbitrary. A prop is identified by which
   turn it carries, so until the turns exist there is no way to tell a prop from a piece of set
   dressing.

   Three conditions, all required: **close-up, more than one episode, carries plot.** The test:
   if it broke, was lost, or was swapped, would the story collapse? Yes means prop. No means it
   belongs in the environment anchors.

   **If the dramatic function cannot be written in a sentence, it is not a prop.** The gate checks
   the field is non-empty. Only you can check it says something.

6. **Write the episodes.** Synopsis, hook, cliff, every time. In batches of no more than six.
   Sixty episodes written in one pass collapses in the back half: the rhythm flattens, the hooks
   repeat, the characters drift. Batches align against the skeleton, never against the previous
   batch's prose.

## Two rounds ⛔

**Round one, fast.** Roster, world, props, turns. Pass the gates. Stop. Put exactly three
decisions to the user:

- what got cut
- who got merged
- which episode carries the major turn

**Do not proceed without an answer.** Getting this wrong costs one skeleton. Getting it wrong
after the synopses are written costs everything.

**Round two, detailed.** Absorb the notes, write the synopses, pass the gates again.

## Register discipline

The synopsis is **narrative prose**. Quoted dialogue in a synopsis means the script is being
written two stages early, and the gate catches it.

Write what happens, not what is said. "He marks the crate into the ledger as nothing and walks
away" is a synopsis. A line of dialogue in quotation marks is a script.

Apostrophes are fine. The gate checks double quotes only.

## Hooks and cliffs

- The **hook** is what holds someone through the first seconds. In the script stage it will have
  to be located in a specific beat inside the opening window, and it will have to be **in
  motion**. Write it now as something that moves, not as a still detail. "A salvager running the
  drained channel ahead of the tide" works. "A hook resting on a crate lid" does not; save the
  still for its second appearance.
- The **cliff** is what makes someone tap the next episode. A question left open, an action not
  explained, a number that does not add up.

Both are required on every episode, including the last.

## Warnings

The gate scans each synopsis for known generation traps: rain, water, crowds, hands, physical
contact, fire, reflections, eating, on-screen text. A hit that is not declared in `warnings`
fails the gate.

**It over-reports on purpose and declaring is the fix.** This is not an instruction to avoid
water. It is a record that episode four has water in it, so nobody is surprised at generation
time.

Extend the list as real failures accumulate. The patterns live in `RISK_PATTERNS` at the top of
`pipeline.mjs`, and adding one costs a line and a self-test case.

## Blocking plans

More than `maxOnScreen` characters in an episode needs a written plan. The gate judges by
character count, which is a proxy.

If three characters appear but never share a frame, **write that as the plan**: "all three
appear, never together, shot in separate scenes." That passes, and it is true. The gate is asking
whether you have thought about it, not forbidding a third character.

## When the gates fail

Fix the outline or fix the profile. Do not argue with a gate and do not work around one. If a
gate is wrong for this project, override the threshold in `params.overrides` and say why in the
same breath. An override with no stated reason is a gate quietly switched off.
