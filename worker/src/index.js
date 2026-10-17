// Jarvis Inoni: Gehirn- und Gedächtnis-Endpunkte (Cloudflare Worker, ohne Build-Schritt).
// Läuft zusammen mit dem HUD in einem Worker (siehe wrangler.toml im Hauptverzeichnis).
// Status: im Test mit Beispielantworten geprüft, noch nicht live.
//
// Gehirn: Standard ist Cloudflare Workers AI (kostenloses Tageskontingent, Modell aus AI_MODEL).
// Sobald das Secret ANTHROPIC_API_KEY gesetzt ist, antwortet stattdessen Claude (Modell aus CLAUDE_MODEL).
//
// Secrets (Cloudflare: Settings > Variables and secrets):
//   ACCESS_TOKEN       Pflicht. Eigener langer Zufallswert, schützt alle Endpunkte.
//   ANTHROPIC_API_KEY  Optional. Schaltet das Gehirn auf Claude um (kostet Guthaben bei Anthropic).
//   GITHUB_TOKEN       Optional. Fein abgestuftes Token, nur Contents für das Gedächtnis-Repo.
// Variablen (wrangler.toml): MEMORY_REPO, AI_MODEL, CLAUDE_MODEL, ALLOWED_ORIGIN
// Binding (wrangler.toml): AI (Workers AI), ASSETS (das HUD)

const DEFAULT_AI_MODEL = "@cf/google/gemma-4-26b-a4b-it";
const DEFAULT_CLAUDE_MODEL = "claude-sonnet-5-5";

const FALLBACK_PERSONA =
  "Du bist Jarvis, der persönliche Assistent. Antworte immer auf Deutsch, ruhig und präzise, " +
  "in höchstens drei kurzen Sätzen. Deine Antworten werden vorgelesen: kein Markdown, keine Listen, keine Sonderzeichen.";

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

    if (!authorized(request, env)) return json({ error: "unauthorized" }, 401, cors);

    try {
      if (url.pathname === "/api/health") {
        return json({ ok: true, brain: brainName(env), model: brainModel(env) }, 200, cors);
      }
      if (url.pathname === "/api/brain" && request.method === "POST") return await brain(request, env, cors);
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
  return {
    authorization: `Bearer ${env.GITHUB_TOKEN}`,
    accept,
    "user-agent": "jarvis-inoni",
    "x-github-api-version": "2022-11-28",
  };
}

async function loadPersona(env) {
  if (!env.GITHUB_TOKEN || !env.MEMORY_REPO) return FALLBACK_PERSONA;
  const res = await fetch(
    `https://api.github.com/repos/${env.MEMORY_REPO}/contents/memory/00-Jarvis-Persona.md`,
    { headers: ghHeaders(env, "application/vnd.github.raw+json") }
  );
  return res.ok ? await res.text() : FALLBACK_PERSONA;
}

function brainName(env) {
  return env.ANTHROPIC_API_KEY ? "claude" : "workers-ai";
}

function brainModel(env) {
  return env.ANTHROPIC_API_KEY
    ? env.CLAUDE_MODEL || DEFAULT_CLAUDE_MODEL
    : env.AI_MODEL || DEFAULT_AI_MODEL;
}

async function brain(request, env, cors) {
  const body = await request.json().catch(() => null);
  const raw = body && Array.isArray(body.messages) ? body.messages.slice(-12) : [];
  const messages = raw
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));
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
  // Gemma 4 nimmt max_completion_tokens, ältere Modelle (Llama, Qwen) max_tokens.
  if (/gemma-4/.test(model)) input.max_completion_tokens = 500;
  else input.max_tokens = 400;

  let out;
  try {
    out = await env.AI.run(model, input);
  } catch (err) {
    return json({ error: "workers_ai", detail: String(err && err.message ? err.message : err) }, 502, cors);
  }
  const text = cleanText(extractText(out));
  if (!text) return json({ error: "leere_antwort", model }, 502, cors);
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

async function memoryRead(url, env, cors) {
  const path = url.searchParams.get("path");
  if (!safeMemoryPath(path)) return json({ error: "ungültiger Pfad" }, 400, cors);
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
  const api = `https://api.github.com/repos/${env.MEMORY_REPO}/contents/${body.path}`;
  const meta = await fetch(api, { headers: ghHeaders(env, "application/vnd.github+json") });
  const sha = meta.ok ? (await meta.json()).sha : undefined;
  const res = await fetch(api, {
    method: "PUT",
    headers: { ...ghHeaders(env, "application/vnd.github+json"), "content-type": "application/json" },
    body: JSON.stringify({
      message: body.message || `Jarvis: ${body.path} aktualisiert`,
      content: toBase64(body.content),
      sha,
    }),
  });
  if (!res.ok) return json({ error: "github", status: res.status }, 502, cors);
  return json({ ok: true, path: body.path }, 200, cors);
}
