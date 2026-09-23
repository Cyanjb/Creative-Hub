/**
 * Ecosystem follow-through.
 *
 * A character described once in the bible should show up correctly in every
 * prompt on every board without being retyped. Two mechanisms do that:
 *
 *   1. Explicit links — a Frame lists characterIds / worldIds.
 *   2. @mentions — "@Nova walks in" inside any prompt body.
 *
 * Both resolve to the same canonical description block, which gets prepended
 * to whatever goes to the model.
 */

import type { Character, WorldEntry, HubState } from '../store/types';
import { CONTEXT_HEADER } from './promptTemplates';

/** Matches @Name and @"Two Word Name". */
const MENTION_RE = /@(?:"([^"]+)"|([A-Za-z][\w'-]*(?:\s+[A-Z][\w'-]*)*))/g;

export interface Mention {
  raw: string;
  name: string;
  index: number;
}

export function findMentions(text: string): Mention[] {
  const out: Mention[] = [];
  if (!text) return out;
  for (const m of text.matchAll(MENTION_RE)) {
    out.push({ raw: m[0], name: (m[1] ?? m[2] ?? '').trim(), index: m.index ?? 0 });
  }
  return out;
}

function norm(s: string): string {
  return s.trim().toLowerCase();
}

/**
 * Resolve mentions against the project's entities. Longest-name-first so
 * "@Nova Kade" wins over "@Nova" when both exist.
 */
export function resolveMentions(
  text: string,
  characters: Character[],
  worlds: WorldEntry[],
): { characters: Character[]; worlds: WorldEntry[]; unresolved: string[] } {
  const mentions = findMentions(text);
  const foundC = new Map<string, Character>();
  const foundW = new Map<string, WorldEntry>();
  const unresolved: string[] = [];

  const charsByLen = [...characters].sort((a, b) => b.name.length - a.name.length);
  const worldsByLen = [...worlds].sort((a, b) => b.name.length - a.name.length);

  for (const mention of mentions) {
    const n = norm(mention.name);
    if (!n) continue;
    const c = charsByLen.find((x) => n === norm(x.name) || n.startsWith(norm(x.name)));
    if (c) {
      foundC.set(c.id, c);
      continue;
    }
    const w = worldsByLen.find((x) => n === norm(x.name) || n.startsWith(norm(x.name)));
    if (w) {
      foundW.set(w.id, w);
      continue;
    }
    unresolved.push(mention.name);
  }

  return { characters: [...foundC.values()], worlds: [...foundW.values()], unresolved };
}

/**
 * The canonical prompt-ready block for a character. Prefers the hand-locked
 * `signature`; falls back to assembling one from the structured fields so an
 * entry still contributes something before it has been fully filled in.
 */
export function characterBlock(c: Character): string {
  if (c.signature.trim()) return `${c.name} — ${c.signature.trim()}`;
  const parts = [
    c.appearance && c.appearance.trim(),
    c.wardrobe && `Wearing: ${c.wardrobe.trim()}`,
  ].filter(Boolean);
  if (!parts.length) return `${c.name}${c.role ? ` (${c.role})` : ''}`;
  return `${c.name}${c.role ? ` (${c.role})` : ''} — ${parts.join('. ')}`;
}

export function worldBlock(w: WorldEntry): string {
  const visual = w.visualKeys.trim();
  const body = visual || w.summary.trim() || w.description.trim();
  return `${w.name} (${w.category})${body ? ` — ${body}` : ''}`;
}

export interface ResolvedContext {
  characters: Character[];
  worlds: WorldEntry[];
  /** The text block prepended to model calls. Empty when nothing resolved. */
  block: string;
  unresolved: string[];
}

/**
 * Build the full context for a piece of text plus any explicitly linked ids.
 * Explicit links and @mentions are unioned, then deduped.
 */
export function buildContext(
  state: HubState,
  projectId: string,
  opts: { text?: string; characterIds?: string[]; worldIds?: string[] },
): ResolvedContext {
  const projChars = state.characters.filter((c) => c.projectId === projectId);
  const projWorlds = state.worlds.filter((w) => w.projectId === projectId);

  const cMap = new Map<string, Character>();
  const wMap = new Map<string, WorldEntry>();

  for (const id of opts.characterIds ?? []) {
    const c = projChars.find((x) => x.id === id);
    if (c) cMap.set(c.id, c);
  }
  for (const id of opts.worldIds ?? []) {
    const w = projWorlds.find((x) => x.id === id);
    if (w) wMap.set(w.id, w);
  }

  let unresolved: string[] = [];
  if (opts.text) {
    const r = resolveMentions(opts.text, projChars, projWorlds);
    r.characters.forEach((c) => cMap.set(c.id, c));
    r.worlds.forEach((w) => wMap.set(w.id, w));
    unresolved = r.unresolved;
  }

  const characters = [...cMap.values()];
  const worlds = [...wMap.values()];

  const sections: string[] = [];
  if (characters.length) {
    sections.push(`CHARACTERS\n${characters.map((c) => `• ${characterBlock(c)}`).join('\n')}`);
  }
  if (worlds.length) {
    sections.push(`WORLD\n${worlds.map((w) => `• ${worldBlock(w)}`).join('\n')}`);
  }

  const block = sections.length ? `${CONTEXT_HEADER}\n\n${sections.join('\n\n')}` : '';
  return { characters, worlds, block, unresolved };
}

/**
 * Replace @mentions with the plain entity name, so the text reads naturally
 * once the canon block is carrying the descriptions.
 */
export function flattenMentions(text: string): string {
  return text.replace(MENTION_RE, (_m, quoted, bare) => (quoted ?? bare ?? '').trim());
}
