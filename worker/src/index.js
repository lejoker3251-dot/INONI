// Inoni: Gehirn-, Stimm- und Gedächtnis-Endpunkte (Cloudflare Worker, ohne Build-Schritt).
// Läuft zusammen mit dem HUD in einem Worker (siehe wrangler.toml im Hauptverzeichnis).
//
// Gehirn: Standard ist Cloudflare Workers AI (kostenloses Tageskontingent, Modell aus AI_MODEL).
// Sobald das Secret ANTHROPIC_API_KEY gesetzt ist, antwortet stattdessen Claude (Modell aus CLAUDE_MODEL).
// Stimme: Sobald das Secret FISH_API_KEY gesetzt ist, liefert /api/speak Sprache von Fish Audio.
// Ohne Schlüssel liest das HUD mit der Browser-Stimme vor.
//
// Secrets (Cloudflare: Settings > Variables and secrets):
//   ACCESS_TOKEN       Pflicht. Eigener langer Zufallswert, schützt alle Endpunkte.
//   FISH_API_KEY       Optional. Schaltet die Stimme auf Fish Audio um.
//   ANTHROPIC_API_KEY  Optional. Schaltet das Gehirn auf Claude um (kostet Guthaben bei Anthropic).
//   GITHUB_TOKEN       Optional. Fein abgestuftes Token, nur Contents für das Gedächtnis-Repo.
// Variablen (wrangler.toml): MEMORY_REPO, AI_MODEL, CLAUDE_MODEL, FISH_MODEL, FISH_VOICE_ID, ALLOWED_ORIGIN
// Binding (wrangler.toml): AI (Workers AI), ASSETS (das HUD)

const DEFAULT_AI_MODEL = "@cf/google/gemma-4-26b-a4b-it";
const DEFAULT_CLAUDE_MODEL = "claude-sonnet-5-5";
const DEFAULT_FISH_MODEL = "s2.1-pro-free";

const PERSONA_PATH = "memory/00-Inoni-Persona.md";
const PERSONA_TTL_MS = 5 * 60 * 1000;
const MAX_SPEAK_CHARS = 1000;

const FALLBACK_PERSONA =
  "Du bist Inoni, der persönliche KI-Butler. Du wirst mit Inoni angesprochen. " +
  "Antworte immer auf Deutsch, ruhig und präzise, in höchstens drei kurzen Sätzen. " +
  "Deine Antworten werden vorgelesen: kein Markdown, keine Listen, keine Sonderzeichen.";

let personaCache = { text: "", at: 0 };

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    // Alles außerhalb von /api/ ist das HUD (statische Dateien aus dem Ordner web).
    if (!url.pathname.startsWith("/api/")) {
      return env.ASSETS ? env.ASSETS.fetch(request) : new Response("not found", { status: 404 });
    }
    const cors = {
      "access-control-allow-origin": env.ALLOWED_ORIGIN || "*",
      "access-control-allow-headers": "authorization, content-type",
      "access-control-allow-methods": "GET, POST, OPTIONS",
    };
    if (request.method === "OPTIONS") return new Response(null, { headers: cors });

    if (!env.ACCESS_TOKEN) return json({ error: "access_token_nicht_gesetzt" }, 500, cors);
    if (!authorized(request, env)) return json({ error: "unauthorized" }, 401, cors);

    try {
      if (url.pathname === "/api/health") {
        return json(
          {
            ok: true,
            brain: brainName(env),
            model: brainModel(env),
            voice: env.FISH_API_KEY ? "fish" : "browser",
            memory: env.GITHUB_TOKEN ? "aktiv" : "aus",
          },
          200,
          cors
        );
      }
      if (url.pathname === "/api/brain" && request.method === "POST") return await brain(request, env, cors);
      if (url.pathname === "/api/speak" && request.method === "POST") return await speak(request, env, cors);
      if (url.pathname === "/api/memory" && request.method === "GET") return await memoryRead(url, env, cors);
      if (url.pathname === "/api/memory" && request.method === "POST") return await memoryWrite(request, env, cors);
    } catch (err) {
      return json({ error: "internal", detail: String(err && err.message ? err.message : err) }, 500, cors);
    }
    return json({ error: "not found" }, 404, cors);
  },
};

function json(body, status, cors) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...cors },
  });
}

function authorized(request, env) {
  const given = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  const want = env.ACCESS_TOKEN || "";
  if (!want || given.length !== want.length) return false;
  let diff = 0;
  for (let i = 0; i < want.length; i++) diff |= given.charCodeAt(i) ^ want.charCodeAt(i);
  return diff === 0;
}

function safeMemoryPath(path) {
  return typeof path === "string" && path.startsWith("memory/") && !path.includes("..") && path.endsWith(".md");
}

function ghHeaders(env, accept) {
  const h = { accept, "user-agent": "inoni", "x-github-api-version": "2022-11-28" };
  if (env.GITHUB_TOKEN) h.authorization = `Bearer ${env.GITHUB_TOKEN}`;
  return h;
}

// Die Persona kommt aus dem Repo (öffentlich lesbar, mit Token auch bei privatem Repo).
// Fünf Minuten im Speicher gehalten, damit nicht jede Antwort auf GitHub warten muss.
async function loadPersona(env) {
  if (!env.MEMORY_REPO) return FALLBACK_PERSONA;
  const now = Date.now();
  if (personaCache.text && now - personaCache.at < PERSONA_TTL_MS) return personaCache.text;
  try {
    const res = await fetch(`https://api.github.com/repos/${env.MEMORY_REPO}/contents/${PERSONA_PATH}`, {
      headers: ghHeaders(env, "application/vnd.github.raw+json"),
    });
    if (res.ok) {
      const text = (await res.text()).trim();
      if (text) {
        personaCache = { text, at: now };
        return text;
      }
    }
  } catch (e) {
    /* Netzwerkfehler: alte Persona oder Notfalltext */
  }
  return personaCache.text || FALLBACK_PERSONA;
}

function brainName(env) {
  return env.ANTHROPIC_API_KEY ? "claude" : "workers-ai";
}

function brainModel(env) {
  return env.ANTHROPIC_API_KEY
    ? env.CLAUDE_MODEL || DEFAULT_CLAUDE_MODEL
    : env.AI_MODEL || DEFAULT_AI_MODEL;
}

// Nur user/assistant-Texte, höchstens die letzten 12, und der Verlauf beginnt immer mit "user"
// (die Claude-API verlangt das). Direkt aufeinanderfolgende gleiche Rollen werden zusammengelegt.
function cleanMessages(list) {
  const out = [];
  for (const m of (Array.isArray(list) ? list : []).slice(-12)) {
    if (!m || (m.role !== "user" && m.role !== "assistant") || typeof m.content !== "string") continue;
    const content = m.content.slice(0, 4000);
    const last = out[out.length - 1];
    if (last && last.role === m.role) last.content += "\n" + content;
    else out.push({ role: m.role, content });
  }
  while (out.length && out[0].role !== "user") out.shift();
  return out;
}

async function brain(request, env, cors) {
  const body = await request.json().catch(() => null);
  const messages = cleanMessages(body && body.messages);
  if (!messages.length) return json({ error: "messages fehlt" }, 400, cors);

  const system = await loadPersona(env);
  return env.ANTHROPIC_API_KEY
    ? await askClaude(env, system, messages, cors)
    : await askWorkersAI(env, system, messages, cors);
}

async function askClaude(env, system, messages, cors) {
  const model = brainModel(env);
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({ model, max_tokens: 400, system, messages }),
  });
  if (!res.ok) return json({ error: "claude_api", status: res.status }, 502, cors);
  const data = await res.json();
  const text = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("");
  return json({ text, model }, 200, cors);
}

async function askWorkersAI(env, system, messages, cors) {
  if (!env.AI) return json({ error: "ai_binding_fehlt" }, 500, cors);
  const model = brainModel(env);
  const input = { messages: [{ role: "system", content: system }, ...messages] };
  // Gemma 4 nimmt max_completion_tokens und denkt standardmäßig vor der Antwort.
  // Das Budget ist deshalb großzügig, sonst bleibt nach dem Denken nichts für die Antwort übrig.
  // Ältere Modelle (Llama, Qwen) nehmen max_tokens.
  if (/gemma-4/.test(model)) input.max_completion_tokens = 1500;
  else input.max_tokens = 400;

  let out;
  try {
    out = await env.AI.run(model, input);
  } catch (err) {
    return json({ error: "workers_ai", detail: String(err && err.message ? err.message : err) }, 502, cors);
  }
  const text = cleanText(extractText(out));
  if (!text) {
    const cut = out && out.choices && out.choices[0] && out.choices[0].finish_reason === "length";
    return json({ error: cut ? "antwort_abgeschnitten" : "leere_antwort", model }, 502, cors);
  }
  return json({ text, model }, 200, cors);
}

// Workers AI liefert je nach Modell {response} (älter) oder {choices:[{message:{content}}]} (OpenAI-Form).
function extractText(out) {
  if (!out) return "";
  if (typeof out === "string") return out;
  const choice = out.choices && out.choices[0];
  if (choice) {
    const c = choice.message && choice.message.content;
    if (typeof c === "string") return c;
    if (Array.isArray(c)) return c.map((p) => (p && typeof p.text === "string" ? p.text : "")).join("");
    if (typeof choice.text === "string") return choice.text;
  }
  if (typeof out.response === "string") return out.response;
  return "";
}

// Manche Modelle schreiben ihre Überlegung in <think>-Tags, die nicht vorgelesen werden sollen.
function cleanText(text) {
  return String(text || "").replace(/<think>[\s\S]*?<\/think>/g, "").trim();
}

// Stimme: Text rein, MP3 raus. Der Fish-Schlüssel bleibt im Worker.
async function speak(request, env, cors) {
  if (!env.FISH_API_KEY) return json({ error: "stimme_nicht_konfiguriert" }, 501, cors);
  const body = await request.json().catch(() => null);
  const text = body && typeof body.text === "string" ? body.text.trim().slice(0, MAX_SPEAK_CHARS) : "";
  if (!text) return json({ error: "text fehlt" }, 400, cors);

  const payload = { text, format: "mp3" };
  if (env.FISH_VOICE_ID) payload.reference_id = env.FISH_VOICE_ID;

  let res;
  try {
    res = await fetch("https://api.fish.audio/v1/tts", {
      method: "POST",
      headers: {
        authorization: `Bearer ${env.FISH_API_KEY}`,
        "content-type": "application/json",
        model: env.FISH_MODEL || DEFAULT_FISH_MODEL,
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    return json({ error: "fish_netz", detail: String(err && err.message ? err.message : err) }, 502, cors);
  }
  if (!res.ok) {
    const detail = (await res.text().catch(() => "")).slice(0, 200);
    return json({ error: "fish_api", status: res.status, detail }, 502, cors);
  }
  return new Response(res.body, {
    status: 200,
    headers: { "content-type": res.headers.get("content-type") || "audio/mpeg", "cache-control": "no-store", ...cors },
  });
}

async function memoryRead(url, env, cors) {
  const path = url.searchParams.get("path");
  if (!safeMemoryPath(path)) return json({ error: "ungültiger Pfad" }, 400, cors);
  if (!env.GITHUB_TOKEN) return json({ error: "github_token_fehlt" }, 501, cors);
  const res = await fetch(`https://api.github.com/repos/${env.MEMORY_REPO}/contents/${path}`, {
    headers: ghHeaders(env, "application/vnd.github.raw+json"),
  });
  if (!res.ok) return json({ error: "github", status: res.status }, res.status === 404 ? 404 : 502, cors);
  return json({ path, content: await res.text() }, 200, cors);
}

function toBase64(text) {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

async function memoryWrite(request, env, cors) {
  const body = await request.json().catch(() => null);
  if (!body || !safeMemoryPath(body.path) || typeof body.content !== "string") {
    return json({ error: "path und content erforderlich" }, 400, cors);
  }
  if (!env.GITHUB_TOKEN) return json({ error: "github_token_fehlt" }, 501, cors);
  const api = `https://api.github.com/repos/${env.MEMORY_REPO}/contents/${body.path}`;
  const meta = await fetch(api, { headers: ghHeaders(env, "application/vnd.github+json") });
  const sha = meta.ok ? (await meta.json()).sha : undefined;
  const res = await fetch(api, {
    method: "PUT",
    headers: { ...ghHeaders(env, "application/vnd.github+json"), "content-type": "application/json" },
    body: JSON.stringify({
      message: body.message || `Inoni: ${body.path} aktualisiert`,
      content: toBase64(body.content),
      sha,
    }),
  });
  if (!res.ok) return json({ error: "github", status: res.status }, 502, cors);
  if (body.path === PERSONA_PATH) personaCache = { text: "", at: 0 };
  return json({ ok: true, path: body.path }, 200, cors);
}
