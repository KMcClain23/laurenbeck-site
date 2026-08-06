/* =====================================================================
   POST /api/track — records one analytics event.

   This exists for one reason: country. A static page never sees request
   headers, so the only way to know where a visitor is without shipping
   their IP to a third party is to read the country Vercel has already
   derived at the edge. The IP itself is never read, logged, or stored —
   only the two-letter code.

   Everything else (event, label, device, os) is decided in the browser
   and passed straight through.
   ===================================================================== */
const ALLOWED = ["pageview", "demo_play", "outbound"];

/* Same publishable credentials the browser already carries in config.js.
   They grant only what RLS allows — inserting these three event types — so
   putting them in an env var would add a deployment step and hide nothing.
   Env vars still win if set, for when this moves projects. */
const SUPABASE_URL = "https://pwjdjrweyrnatqjtvbxd.supabase.co";
const SUPABASE_KEY = "sb_publishable_4XlB77BcD5dST4NBHH2vuw_pjkbC2rc";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const url = process.env.SUPABASE_URL || SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY || SUPABASE_KEY;

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  body = body || {};

  if (!ALLOWED.includes(body.event)) {
    return res.status(400).json({ error: "Unknown event" });
  }

  const clamp = (v, n) =>
    typeof v === "string" && v.trim() ? v.trim().slice(0, n) : null;

  const row = {
    event: body.event,
    label: clamp(body.label, 200),
    session_id: clamp(body.session_id, 64),
    device: clamp(body.device, 20),
    os: clamp(body.os, 20),
    country: req.headers["x-vercel-ip-country"] || null
  };

  try {
    const r = await fetch(url + "/rest/v1/analytics_events", {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: "Bearer " + key,
        "Content-Type": "application/json",
        Prefer: "return=minimal"
      },
      body: JSON.stringify(row)
    });
    // Analytics must never surface an error to a visitor.
    return res.status(r.ok ? 204 : 202).end();
  } catch (e) {
    return res.status(202).end();
  }
}
