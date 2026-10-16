// Jarvis Inoni: Gehirn- und Gedächtnis-Endpunkte (Cloudflare Worker, ohne Build-Schritt).
// Status: Gerüst, noch nicht deployt und nicht getestet.
//
// Benötigte Secrets (Cloudflare: Settings > Variables and secrets):
//   ACCESS_TOKEN       eigener langer Zufallswert, schützt alle Endpunkte
//   ANTHROPIC_API_KEY  Schlüssel aus der Claude Console
//   GITHUB_TOKEN       fein abgestuftes Token, nur Contents (Lesen/Schreiben) für das Gedächtnis-Repo
// Variablen (wrangler.toml): MEMORY_REPO, CLAUDE_MODEL, ALLOWED_ORIGIN

const FALLBACK_PERSONA =
  "Du bist Jarvis, der persönliche Assistent. Antworte auf Deutsch, ruhig und präzise, " +
  "in höchstens drei kurzen Sätzen. Deine Antworten werden vorgelesen: kein Markdown, keine Listen, keine Sonderzeichen.";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const cors = {
      "access-control-allow-origin": env.ALLOWED_ORIGIN || "*",
      "access-control-allow-headers": "authorization, content-type",
      "access-control-allow-methods": "GET, POST, OPTIONS",
    };
    if (request.method === "OPTIONS") return new Response(null, { headers: cors });

    if (!authorized(request, env)) return json({ error: "unauthorized" }, 401, cors);

    try {
      if (url.pathname === "/api/health") return json({ ok: true }, 200, cors);
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

async function brain(request, env, cors) {
  const body = await request.json().catch(() => null);
  const messages = body && Array.isArray(body.messages) ? body.messages.slice(-20) : null;
  if (!messages || !messages.length) return json({ error: "messages fehlt" }, 400, cors);

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: env.CLAUDE_MODEL || "claude-sonnet-5-5",
      max_tokens: 400,
      system: await loadPersona(env),
      messages,
    }),
  });
  if (!res.ok) return json({ error: "claude_api", status: res.status }, 502, cors);
  const data = await res.json();
  const text = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("");
  return json({ text }, 200, cors);
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
