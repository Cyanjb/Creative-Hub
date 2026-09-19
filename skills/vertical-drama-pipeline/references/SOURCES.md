# Sources and attribution

This skill was built after reading **[shuohao-skills](https://github.com/eternityspring/shuohao-skills)**,
Apache License 2.0, Copyright 2026 烁皓. That repository is a Chinese-first pipeline of five
agent skills for AI short-drama production, and it is the origin of the central idea here: that
quality rules should be enforced by a deterministic validator rather than by instructions in a
prompt.

## Ported from shuohao-skills (Apache-2.0)

**None.**

No function, no algorithm and no file from that repository was copied or translated into this
skill. Everything in `scripts/` was written from scratch against a different schema, a different
language, a different set of thresholds and a different engine stack.

This entry exists so the answer is recorded rather than assumed. If code is ever ported, it goes
here with the source file, the function name, the Apache-2.0 notice, and a statement of what
changed, per Apache-2.0 section 4.

## Independently implemented after reading shuohao-skills

Ideas and methods, reimplemented. No attribution obligation attaches to these, and they are
listed because the debt is real even where the licence does not create one.

| Here | Learned from |
|---|---|
| A gate as an id, a label, a boolean and a **detail string naming the exact failure location** | Their `gateReport` shape, common to all five of their skills |
| A breach case per gate in the self-test, so a gate is a promise rather than an assertion | Their five self-tests, 1,170 assertions between them |
| One structured JSON file per stage, with readable output rendered from it and never hand-edited | Their schema and `render` split |
| `seed`: mechanically carrying settled facts downstream so a model never re-derives them | Their `seed` subcommands, and the rule they state as "do not make the model think these facts through again" |
| Cross-stage gates that **skip and say so** when an optional upstream file is absent | Their `SKIP_OUTLINE` and `SKIP_ART` handling |
| Runtime computed from dialogue, with a tolerance band around a target | Their `charsPerSecond` and `actionSeconds` model, rebuilt for English words |
| A located hook claimed by coordinate rather than described as a label | Their `hookBeat` gate |
| Health-check mode that runs the gates and generates nothing | Their `checkup` mode |
| A turn schedule with spacing rules, a required major, and no dead run at either end | Their pacing gates |
| The prop selection test, and the rule that a prop with no writable function is set dressing | Their prop-pass guidance |
| Auto-scanning a synopsis for generation traps and requiring them to be declared | Their `RISK_PATTERNS` gate |
| Preferring a variant of an existing environment over a new one | Their `variantOf` mechanism |
| The common-action principle, and its comparison table | Their `script-pass.md` rule 4 |
| Change one beat, read three | Their revision-discipline section |
| A sound description is an action instruction | Their storyboard common-ailments table, which records the failure that taught them |

Two of their constants were deliberately **not** used. `charsPerSecond: 4.5` and
`actionSeconds: 2.5` are tuned for spoken Chinese and a wider frame. This skill uses 2.5 words
per second, taken from the user's own `screenwriter` skill, and 2.0 seconds per action beat.

## Deliberately not adopted

- **Their interface localisation** (`--lang`, the `ui` translation table). English in, English out.
- **The ban on character names in image prompts.** Their gate forbids it. This user's
  `video-prompt-director/references/seedance.md` requires the opposite and is tested on the
  engine actually in use. Theirs wins on their engine; hers wins here.
- **The MiniMax H3 prompt grammar.** Engine-specific to a model not in use. The structural idea
  underneath it, deriving cut times from the shot data and checking them, is carried into the
  shots stage design instead.
- **Their self-containment rule** (a skill must depend on no other skill). This library routes
  between skills on purpose. Their rule optimises for distribution to strangers; this one
  optimises for a single operator with a deep library.
- **The gate-failure log and its statistics.** Their own `CLAUDE.md` says to ship it on one skill
  and wait, because a feature nobody opens should not be copied five times. That instinct is
  right and it applies here too.

## Bundled example

`examples/tidewrack-*.json` is an original work written for this skill. None of their sample
material, including their story `渡口` and its five example files, is reproduced here. Their
licence would permit it with attribution. It is their story and it does not belong in this work.

## A note

The author of shuohao-skills published the repository while between jobs and open to work. The
licence asks nothing beyond what is written above. Given how much thinking this skill takes from
that unpaid work, a word of thanks or a coffee is a reasonable thing to consider:
<https://ko-fi.com/eternityspring>.
