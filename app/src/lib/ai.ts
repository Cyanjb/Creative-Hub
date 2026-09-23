/**
 * Client adapter for the local proxy in server/index.js.
 * Nothing here knows an API key — that's the whole point of the proxy.
 */

import { HOUSE_RULES } from './promptTemplates';

export type TextProvider = 'anthropic' | 'openai' | 'gemini';

export interface ProviderStatus {
  configured: boolean;
}

export interface StatusResponse {
  ok: boolean;
  providers: Record<string, ProviderStatus>;
  models: Record<string, string>;
}

/** Thrown for any non-2xx from the proxy, carrying the server's message. */
export class AiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = 'AiError';
  }
}

async function post<T>(path: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new AiError('Cannot reach the local API server. Is `npm run dev` running?', 0);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new AiError((data as { error?: string }).error ?? `Request failed (${res.status})`, res.status);
  return data as T;
}

export async function getStatus(): Promise<StatusResponse | null> {
  try {
    const r = await fetch('/api/status');
    if (!r.ok) return null;
    return (await r.json()) as StatusResponse;
  } catch {
    return null;
  }
}

export async function generateText(opts: {
  provider?: TextProvider;
  prompt: string;
  system?: string;
  maxTokens?: number;
  json?: boolean;
}): Promise<string> {
  const { text } = await post<{ text: string }>('/api/text', {
    provider: opts.provider ?? 'anthropic',
    // House rules always lead; a caller-supplied system prompt extends them.
    system: opts.system ? `${HOUSE_RULES}\n\n${opts.system}` : HOUSE_RULES,
    prompt: opts.prompt,
    maxTokens: opts.maxTokens ?? 2000,
    json: opts.json ?? false,
  });
  return text.trim();
}

/**
 * Ask for JSON and actually get an object back.
 * Models wrap JSON in prose or fences often enough that this is worth doing
 * properly rather than hoping.
 */
export async function generateJson<T>(opts: {
  provider?: TextProvider;
  prompt: string;
  system?: string;
  maxTokens?: number;
}): Promise<T> {
  const raw = await generateText({
    ...opts,
    json: true,
    system: `${opts.system ?? ''}\n\nRespond with a single valid JSON object and nothing else. No markdown fences, no commentary.`,
  });

  const cleaned = raw
    .replace(/^\s*```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // Fall back to the outermost {...} span.
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1)) as T;
      } catch {
        /* fall through */
      }
    }
    throw new AiError('The model did not return usable JSON. Try again.', 502);
  }
}

export async function generateImage(opts: {
  prompt: string;
  referenceImages?: string[];
}): Promise<string[]> {
  const { images } = await post<{ images: string[] }>('/api/image', {
    prompt: opts.prompt,
    referenceImages: opts.referenceImages ?? [],
  });
  return images;
}

/** Turn a data: URL into a File so generated images can enter the asset store. */
export function dataUrlToFile(dataUrl: string, name: string): File {
  const [head, b64] = dataUrl.split(',');
  const mime = /:([^;]+);/.exec(head)?.[1] ?? 'image/png';
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new File([bytes], `${name}.${mime.split('/')[1] ?? 'png'}`, { type: mime });
}
