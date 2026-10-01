// POST /api/panel — sve radnje panela #/upiti. Ulaz šifrom (ADMIN_PIN u Vercelu).
// Nakon 5 krivih pokušaja ulaz se zaključa na 15 minuta.
import { json, kv, kvPipe, kvReady, kvDijagnoza, PIN, STATUSI } from "./_kv.js";

const LOCK_TRIES = 5, LOCK_SEC = 15 * 60;
const ID_RE = /^[0-9a-f-]{36}$/i;

async function load(id) {
  const s = await kv("GET", `upit:${id}`);
  return s ? JSON.parse(s) : null;
}
async function save(u) { await kv("SET", `upit:${u.id}`, JSON.stringify(u)); return u; }

export async function POST(request) {
  if (!kvReady()) return json({ ok: false, error: "Baza nije spojena. " + kvDijagnoza() }, 500);
  if (!PIN()) return json({ ok: false, error: "Šifra nije postavljena (ADMIN_PIN u Vercelu)." }, 500);

  const ip = (request.headers.get("x-forwarded-for") || "x").split(",")[0].trim();
  const lockKey = `zakljucano:${ip}`;
  const tries = Number(await kv("GET", lockKey)) || 0;
  if (tries >= LOCK_TRIES) return json({ ok: false, error: "Previše krivih pokušaja. Pokušajte za 15 minuta." }, 429);

  const pin = String(request.headers.get("x-pin") || "");
  if (pin !== PIN()) {
    await kvPipe([["INCR", lockKey], ["EXPIRE", lockKey, String(LOCK_SEC)]]);
    return json({ ok: false, error: "Kriva šifra." }, 401);
  }
  if (tries) await kv("DEL", lockKey);

  let b = {};
  try { b = await request.json(); } catch {}
  const a = b.akcija;

  try {
    if (a === "provjera") return json({ ok: true });

    if (a === "popis") {
      const ids = await kv("ZREVRANGE", "upiti", "0", "499");
      if (!ids || !ids.length) return json({ ok: true, upiti: [] });
      const vals = await kv("MGET", ...ids.map((id) => `upit:${id}`));
      return json({ ok: true, upiti: vals.filter(Boolean).map((s) => JSON.parse(s)) });
    }

    const id = String(b.id || "");
    if (!ID_RE.test(id)) return json({ ok: false, error: "Neispravan upit." }, 400);
    const u = await load(id);
    if (!u) return json({ ok: false, error: "Upit ne postoji." }, 404);

    if (a === "procitano") { u.procitano = true; return json({ ok: true, upit: await save(u) }); }

    if (a === "spremi") {
      if (b.status !== undefined && STATUSI.includes(b.status)) u.status = b.status;
      if (b.iznos !== undefined) u.iznos = b.iznos === null || b.iznos === "" ? null : Number(b.iznos);
      if (b.biljeske !== undefined) u.biljeske = String(b.biljeske).slice(0, 5000);
      return json({ ok: true, upit: await save(u) });
    }

    if (a === "odgovor") {
      const tekst = String(b.tekst || "").slice(0, 20000);
      if (!tekst.trim()) return json({ ok: false, error: "Prazan odgovor." }, 400);
      u.odgovori = u.odgovori || [];
      u.odgovori.push({ created_at: new Date().toISOString(), predmet: String(b.predmet || "").slice(0, 200), tekst });
      u.procitano = true;
      if (b.status && STATUSI.includes(b.status)) u.status = b.status;
      else if (u.status === "novo") u.status = "u_obradi";
      return json({ ok: true, upit: await save(u) });
    }

    if (a === "obrisi") {
      await kvPipe([["DEL", `upit:${id}`], ["ZREM", "upiti", id]]);
      return json({ ok: true });
    }

    return json({ ok: false, error: "Nepoznata radnja." }, 400);
  } catch (e) {
    console.error("Panel:", e.message);
    return json({ ok: false, error: "Greška na poslužitelju." }, 500);
  }
}
