/**
 * Creative Hub — local credential proxy.
 *
 * The browser never sees an API key. It calls /api/* on this server, which
 * holds the keys in .env and forwards upstream. This also sidesteps the CORS
 * walls on Anthropic/OpenAI/Runway, which browsers cannot call directly.
 *
 * Run: npm run dev  (starts this alongside Vite)
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Repository } from './storage/repository.ts';
import { v2Routes } from './v2Routes.ts';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '25mb' }));

const PORT = process.env.PORT || 8788;

const KEYS = {
  anthropic: () => process.env.ANTHROPIC_API_KEY,
  openai: () => process.env.OPENAI_API_KEY,
  gemini: () => process.env.GEMINI_API_KEY,
  runway: () => process.env.RUNWAY_API_KEY,
  higgsfield: () => process.env.HIGGSFIELD_API_KEY,
  openart: () => process.env.OPENART_API_KEY,
};

/** Default models. Kept here so upgrading is a one-line change. */
const MODELS = {
  anthropic: 'claude-opus-5',
  openai: 'gpt-5.1',
  // "Nano Banana" is Google's image model line.
  geminiText: 'gemini-2.5-flash',
  geminiImage: 'gemini-3-pro-image-preview',
};

function fail(res, status, message, detail) {
  if (detail) console.error(`[api] ${message}:`, detail);
  return res.status(status).json({ error: message, detail: detail ?? null });
}

// ── which providers are actually configured ──────────────────────────────

app.get('/api/status', (_req, res) => {
  const out = {};
  for (const [name, get] of Object.entries(KEYS)) {
    const k = get();
    out[name] = { configured: Boolean(k && k.trim()) };
  }
  res.json({ ok: true, providers: out, models: MODELS });
});

// ── text / reasoning ─────────────────────────────────────────────────────

/**
 * POST /api/text
 * { provider, system, prompt, maxTokens?, temperature?, json? }
 * → { text }
 */
app.post('/api/text', async (req, res) => {
  const { provider = 'anthropic', system = '', prompt = '', maxTokens = 2000, temperature = 1, json = false } = req.body ?? {};
  if (!prompt.trim()) return fail(res, 400, 'Prompt is empty');

  try {
    if (provider === 'anthropic') {
      const key = KEYS.anthropic();
      if (!key) return fail(res, 400, 'ANTHROPIC_API_KEY is not set in .env');

      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: req.body.model || MODELS.anthropic,
          max_tokens: maxTokens,
          temperature,
          system: system || undefined,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      const data = await r.json();
      if (!r.ok) return fail(res, r.status, data?.error?.message || 'Anthropic request failed', data);
      const text = (data.content ?? []).filter((b) => b.type === 'text').map((b) => b.text).join('');
      return res.json({ text });
    }

    if (provider === 'openai') {
      const key = KEYS.openai();
      if (!key) return fail(res, 400, 'OPENAI_API_KEY is not set in .env');

      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model: req.body.model || MODELS.openai,
          max_completion_tokens: maxTokens,
          messages: [
            ...(system ? [{ role: 'system', content: system }] : []),
            { role: 'user', content: prompt },
          ],
          ...(json ? { response_format: { type: 'json_object' } } : {}),
        }),
      });
      const data = await r.json();
      if (!r.ok) return fail(res, r.status, data?.error?.message || 'OpenAI request failed', data);
      return res.json({ text: data.choices?.[0]?.message?.content ?? '' });
    }

    if (provider === 'gemini') {
      const key = KEYS.gemini();
      if (!key) return fail(res, 400, 'GEMINI_API_KEY is not set in .env');

      const model = req.body.model || MODELS.geminiText;
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: system ? { parts: [{ text: system }] } : undefined,
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
              maxOutputTokens: maxTokens,
              temperature,
              ...(json ? { responseMimeType: 'application/json' } : {}),
            },
          }),
        },
      );
      const data = await r.json();
      if (!r.ok) return fail(res, r.status, data?.error?.message || 'Gemini request failed', data);
      const text = (data.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? '').join('');
      return res.json({ text });
    }

    return fail(res, 400, `Unknown text provider: ${provider}`);
  } catch (err) {
    return fail(res, 502, 'Upstream request failed', String(err));
  }
});

// ── image generation (Nano Banana / Gemini) ──────────────────────────────

/**
 * POST /api/image
 * { prompt, aspect?, referenceImages?: [dataUrl] }
 * → { images: [dataUrl] }
 */
app.post('/api/image', async (req, res) => {
  const { prompt = '', referenceImages = [] } = req.body ?? {};
  if (!prompt.trim()) return fail(res, 400, 'Prompt is empty');

  const key = KEYS.gemini();
  if (!key) return fail(res, 400, 'GEMINI_API_KEY is not set in .env (Nano Banana runs on Gemini)');

  try {
    const parts = [{ text: prompt }];
    for (const dataUrl of referenceImages.slice(0, 4)) {
      const m = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
      if (m) parts.push({ inlineData: { mimeType: m[1], data: m[2] } });
    }

    const model = req.body.model || MODELS.geminiImage;
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ contents: [{ role: 'user', parts }] }),
      },
    );
    const data = await r.json();
    if (!r.ok) return fail(res, r.status, data?.error?.message || 'Image generation failed', data);

    const images = (data.candidates?.[0]?.content?.parts ?? [])
      .filter((p) => p.inlineData)
      .map((p) => `data:${p.inlineData.mimeType};base64,${p.inlineData.data}`);

    if (!images.length) return fail(res, 502, 'Model returned no image', data);
    return res.json({ images });
  } catch (err) {
    return fail(res, 502, 'Upstream request failed', String(err));
  }
});

// ── creative platforms ───────────────────────────────────────────────────
// These are thin passthroughs. Each service's job schema differs and changes
// often, so the client sends the payload and reads back whatever comes out
// rather than this layer pretending to normalise them.

app.post('/api/runway/:path(*)', async (req, res) => {
  const key = KEYS.runway();
  if (!key) return fail(res, 400, 'RUNWAY_API_KEY is not set in .env');
  try {
    const r = await fetch(`https://api.dev.runwayml.com/v1/${req.params.path}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${key}`,
        'X-Runway-Version': '2024-11-06',
      },
      body: JSON.stringify(req.body ?? {}),
    });
    const data = await r.json();
    return res.status(r.status).json(data);
  } catch (err) {
    return fail(res, 502, 'Runway request failed', String(err));
  }
});

app.get('/api/runway/:path(*)', async (req, res) => {
  const key = KEYS.runway();
  if (!key) return fail(res, 400, 'RUNWAY_API_KEY is not set in .env');
  try {
    const r = await fetch(`https://api.dev.runwayml.com/v1/${req.params.path}`, {
      headers: { authorization: `Bearer ${key}`, 'X-Runway-Version': '2024-11-06' },
    });
    const data = await r.json();
    return res.status(r.status).json(data);
  } catch (err) {
    return fail(res, 502, 'Runway request failed', String(err));
  }
});

app.all('/api/higgsfield/:path(*)', async (req, res) => {
  const key = KEYS.higgsfield();
  const secret = process.env.HIGGSFIELD_SECRET;
  if (!key) return fail(res, 400, 'HIGGSFIELD_API_KEY is not set in .env');
  try {
    const r = await fetch(`https://platform.higgsfield.ai/v1/${req.params.path}`, {
      method: req.method,
      headers: {
        'content-type': 'application/json',
        'hf-api-key': key,
        ...(secret ? { 'hf-secret': secret } : {}),
      },
      body: req.method === 'GET' ? undefined : JSON.stringify(req.body ?? {}),
    });
    const data = await r.json();
    return res.status(r.status).json(data);
  } catch (err) {
    return fail(res, 502, 'Higgsfield request failed', String(err));
  }
});

app.all('/api/openart/:path(*)', async (req, res) => {
  const key = KEYS.openart();
  if (!key) return fail(res, 400, 'OPENART_API_KEY is not set in .env');
  try {
    const r = await fetch(`https://openart.ai/api/v1/${req.params.path}`, {
      method: req.method,
      headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
      body: req.method === 'GET' ? undefined : JSON.stringify(req.body ?? {}),
    });
    const data = await r.json();
    return res.status(r.status).json(data);
  } catch (err) {
    return fail(res, 502, 'OpenArt request failed', String(err));
  }
});

const server = app.listen(PORT, '127.0.0.1', () => {
  const configured = Object.entries(KEYS)
    .filter(([, g]) => g() && g().trim())
    .map(([n]) => n);
  console.log(`\n  Creative Hub API  →  http://localhost:${PORT}`);
  console.log(
    configured.length
      ? `  Keys loaded: ${configured.join(', ')}\n`
      : `  No keys in .env yet — copy .env.example to .env and fill in what you have.\n`,
  );
});

for (const signal of ['SIGINT','SIGTERM']) process.on(signal,()=>server.close(()=>{repository.close();process.exit(0);}));
