// Pomoćnici: Redis baza (Upstash preko Vercela) i odgovori. Datoteke s "_" nisu zasebne rute.
const env = (k) => (process.env[k] || "").trim();

export const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });

// Baza: Upstash Redis. Vercel kod spajanja ponekad doda prefiks imenima (npr. STORAGE_KV_REST_API_URL),
// zato tražimo bilo koje ime koje tako završava. Radi i s REDIS_URL ako je Upstash (rediss://...upstash.io).
const keys = () => Object.keys(process.env);
const findEnd = (ends, not) => {
  for (const e of ends) {
    const k = keys().find((k) => k.endsWith(e) && !(not && not.test(k)) && env(k));
    if (k) return env(k);
  }
  return "";
};
function fromRedisUrl() {
  const raw = findEnd(["REDIS_URL", "KV_URL"]);
  try {
    const u = new URL(raw);
    if (!/upstash\.io$/.test(u.hostname) || !u.password) return null;
    return { url: "https://" + u.hostname, token: decodeURIComponent(u.password) };
  } catch { return null; }
}
const KV_URL = () =>
  (findEnd(["KV_REST_API_URL", "UPSTASH_REDIS_REST_URL", "REDIS_REST_URL"]) || fromRedisUrl()?.url || "").replace(/\/$/, "");
const KV_TOKEN = () =>
  findEnd(["KV_REST_API_TOKEN", "UPSTASH_REDIS_REST_TOKEN", "REDIS_REST_TOKEN"], /READ_ONLY/) || fromRedisUrl()?.token || "";
export const kvReady = () => !!(KV_URL() && KV_TOKEN());
// Samo IMENA varijabli (bez vrijednosti) da se vidi što Vercel stvarno ima
export const kvDijagnoza = () => {
  const n = keys().filter((k) => /KV|REDIS|UPSTASH|ADMIN_PIN|BLOB/.test(k)).sort();
  return n.length ? "Vidim: " + n.join(", ") : "Nema nijedne varijable za bazu. Napravi Redeploy nakon spajanja baze.";
};

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
