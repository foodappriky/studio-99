// Pomoćnici: Redis baza (Upstash preko Vercela) i odgovori. Datoteke s "_" nisu zasebne rute.
const env = (k) => (process.env[k] || "").trim();

export const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });

// Vercel → Storage → Upstash for Redis upisuje KV_REST_API_URL/TOKEN (ili UPSTASH_REDIS_REST_URL/TOKEN)
const KV_URL = () => (env("KV_REST_API_URL") || env("UPSTASH_REDIS_REST_URL")).replace(/\/$/, "");
const KV_TOKEN = () => env("KV_REST_API_TOKEN") || env("UPSTASH_REDIS_REST_TOKEN");
export const kvReady = () => !!(KV_URL() && KV_TOKEN());

export async function kv(...cmd) {
  const r = await fetch(KV_URL(), {
    method: "POST",
    headers: { Authorization: `Bearer ${KV_TOKEN()}`, "Content-Type": "application/json" },
    body: JSON.stringify(cmd),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.error) throw new Error("Redis: " + (j.error || r.status));
  return j.result;
}
export async function kvPipe(cmds) {
  if (!cmds.length) return [];
  const r = await fetch(KV_URL() + "/pipeline", {
    method: "POST",
    headers: { Authorization: `Bearer ${KV_TOKEN()}`, "Content-Type": "application/json" },
    body: JSON.stringify(cmds),
  });
  const j = await r.json().catch(() => []);
  if (!r.ok) throw new Error("Redis pipeline: " + r.status);
  return j.map((x) => x.result);
}

export const PIN = () => env("ADMIN_PIN");
export const STATUSI = ["novo", "u_obradi", "ponuda_poslana", "dogovoreno", "zavrseno", "odbijeno"];
