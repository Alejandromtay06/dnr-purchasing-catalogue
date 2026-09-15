// Shared save for the DNR Purchasing Catalogue.
// GET  /api/catalog          -> current catalog.json from the repo, plus its blob sha
// POST /api/catalog          -> {password, name, sha, catalog} commits a new catalog.json
// POST /api/catalog verify   -> {password, name, verify:true} checks the password only
import { timingSafeEqual } from "node:crypto";

const REPO = "Alejandromtay06/dnr-purchasing-catalogue";
const BRANCH = "main";
const FILE = "catalog.json";
// Origins other than the Netlify site that are allowed to call this function.
const ORIGINS = [
  "https://alejandromtay06.github.io",
  "http://localhost:8769",
  "http://127.0.0.1:8769"
];

const json = (status, body, extra = {}) => new Response(JSON.stringify(body), {
  status,
  headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...extra }
});

function corsHeaders(req) {
  const origin = req.headers.get("origin");
  if (!origin || !ORIGINS.includes(origin)) return {};
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-allow-headers": "content-type",
    "vary": "origin"
  };
}

async function gh(path, init = {}) {
  const token = Netlify.env.get("DNR_PURCHASING_CATALOG_TOKEN") || Netlify.env.get("GITHUB_TOKEN");
  if (!token) throw Object.assign(new Error("DNR_PURCHASING_CATALOG_TOKEN is not configured on Netlify"), { status: 503 });
  return fetch("https://api.github.com/repos/" + REPO + "/contents/" + path, {
    ...init,
    headers: {
      authorization: "Bearer " + token,
      accept: "application/vnd.github+json",
      "user-agent": "dnr-purchasing-catalogue",
      "x-github-api-version": "2022-11-28",
      ...(init.headers || {})
    }
  });
}

async function readCatalog() {
  const r = await gh(FILE + "?ref=" + BRANCH, { headers: { "cache-control": "no-cache" } });
  if (!r.ok) throw Object.assign(new Error("GitHub read failed: HTTP " + r.status), { status: 502 });
  const f = await r.json();
  const text = Buffer.from(String(f.content || "").replace(/\n/g, ""), "base64").toString("utf8");
  let data;
  try { data = JSON.parse(text); } catch { data = { items: [], vendors: [] }; }
  return { sha: f.sha, data };
}

function passwordOk(given) {
  const want = Netlify.env.get("EDIT_PASSWORD") || "";
  if (!want || typeof given !== "string") return false;
  const a = Buffer.from(given, "utf8"), b = Buffer.from(want, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

const clean = (s, n) => String(s == null ? "" : s).slice(0, n);
const num = v => (typeof v === "number" && isFinite(v)) ? v : null;

function normalise(c) {
  const items = Array.isArray(c.items) ? c.items.slice(0, 2000).map(i => ({
    id: clean(i.id, 40), name: clean(i.name, 80), category: clean(i.category, 40),
    spec: clean(i.spec, 300), note: clean(i.note, 300)
  })) : [];
  const vendors = Array.isArray(c.vendors) ? c.vendors.slice(0, 5000).map(v => ({
    id: clean(v.id, 40), itemId: clean(v.itemId, 40), vendor: clean(v.vendor, 80),
    channel: v.channel === "appfolio" ? "appfolio" : "outside",
    unitCost: num(v.unitCost), minQty: num(v.minQty), deliveryDays: num(v.deliveryDays),
    link: clean(v.link, 300), note: clean(v.note, 300)
  })) : [];
  return { updated: new Date().toISOString().slice(0, 10), items, vendors };
}

export default async (req) => {
  const cors = corsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  try {
    if (req.method === "GET") {
      const { sha, data } = await readCatalog();
      return json(200, { sha, ...data }, cors);
    }
    if (req.method !== "POST") return json(405, { error: "Method not allowed" }, cors);
    if (!Netlify.env.get("EDIT_PASSWORD")) return json(503, { error: "EDIT_PASSWORD is not configured on Netlify" }, cors);

    let body;
    try { body = await req.json(); } catch { return json(400, { error: "Body must be JSON" }, cors); }
    if (!passwordOk(body.password)) return json(401, { error: "Wrong password" }, cors);
    const name = clean(body.name, 60).trim();
    if (!name) return json(400, { error: "A name is required" }, cors);
    if (body.verify) return json(200, { ok: true }, cors);
    if (!body.catalog || typeof body.catalog !== "object") return json(400, { error: "catalog is required" }, cors);

    const current = await readCatalog();
    if (body.sha && body.sha !== current.sha) {
      return json(409, { error: "changed", sha: current.sha, ...current.data }, cors);
    }
    const next = normalise(body.catalog);
    const content = Buffer.from(JSON.stringify(next, null, 2) + "\n", "utf8").toString("base64");
    const r = await gh(FILE, {
      method: "PUT",
      body: JSON.stringify({
        message: "Catalogue update by " + name,
        content, sha: current.sha, branch: BRANCH,
        committer: { name, email: "catalogue@users.noreply.github.com" }
      })
    });
    if (r.status === 409) {
      const c2 = await readCatalog();
      return json(409, { error: "changed", sha: c2.sha, ...c2.data }, cors);
    }
    if (!r.ok) {
      const t = await r.text();
      return json(502, { error: "GitHub write failed: HTTP " + r.status + " " + t.slice(0, 200) }, cors);
    }
    const out = await r.json();
    return json(200, { sha: out.content.sha, updated: next.updated }, cors);
  } catch (err) {
    return json(err.status || 500, { error: err.message }, cors);
  }
};

export const config = { path: "/api/catalog" };
