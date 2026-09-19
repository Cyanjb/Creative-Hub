# The other-lock

The concept is deliberately otherworldly: not-quite-human characters and settings, so the work
does not compete with or displace human micro-drama actors.

That positioning is a real advantage. No likeness rights, no displacement, wider visual freedom.
It is also **exactly the kind of intention that evaporates under generation pressure.**
"Otherworldly" is an adjective. An image model will happily render an ordinary person and call it
mysterious. So the intention becomes a structural rule with a gate behind it.

## The rule

**Every character carries at least three specific, physical, non-human anchors.**

Physical means a thing that can be pointed at in a rendered frame:

- the proportion of a limb
- a surface that is not skin
- an eye without a visible white
- a joint that bends where one does not
- a colour no person has
- a feature that repeats where a human has one

From the shipped example:

> a waterline mark across the skin that rises a little through the day
> four knuckles on every finger instead of three
> eyes with no whites, flat slate edge to edge
> a torso plated in overlapping barnacle shell, greenish at the seams
> a narrow voice-slit at the throat where a mouth should sit
> arms that fold at two elbows rather than one

Each one is checkable. Look at a generated frame and you can say yes or no.

## The vagueness ban

These words are conclusions, not descriptions. The gate rejects any anchor containing one:

```
ethereal        otherworldly    mysterious      haunting
unearthly       ancient         timeless        uncanny
dreamlike       not-quite-human inhuman         strange
eerie           alien           luminous        glowing
mystical
```

**If the anchors are right, the reader reaches the conclusion without being told.** An anchor
that has to announce its own effect is doing no work. Naming the mechanism is the job; naming the
impression is skipping it.

An anchor shorter than eight characters is also rejected. "Tall" and "wet hair" are too thin to
tick off against a frame.

## The world

Every environment carries at least one anchor that could not exist in a photograph of a real
place. This is checked by the world-stage gate, which is not built yet, so it is discipline for
now.

## The style formula

Per `ai-director` §3.1, lock one style formula for the series and carry one clause in it naming
the register of the otherness. Locked once, pasted everywhere, never re-derived per prompt.

## The craft tension, stated plainly

Generation models are strongest on actions they have seen a million times. Non-human characters
performing non-human actions is the combination most likely to break.

**Working hypothesis: make the body strange and the behaviour ordinary.**

A creature boarding a boat, sitting down, handing something over, turning back, holding something
tightly. The strangeness carries in the design, which the reference images lock. The motion stays
in territory the model can render. The shipped example follows this: the Harbourmaster has two
elbows per arm and a voice-slit, and what he does is walk down a stair, open a ledger, and write
one line.

**This is a hypothesis, not a tested fact.** Test it with one character and three actions before
committing to a series. If it turns out to be wrong, the action vocabulary in `script-pass.md`
needs rebuilding for non-human bodies, which is real work, and better discovered in episode one
than in episode six.

## What the gate cannot do

It checks that anchors are specific. It cannot check that they cohere. Three vivid anchors that
do not add up to one creature will pass every time. That judgement stays with you.
