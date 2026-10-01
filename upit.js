// POST /api/upit — obrazac s web stranice: sprema upit (i privitak) da se vidi u panelu #/upiti.
// E-mail obavijest i potvrdu klijentu šalje FormSubmit iz preglednika.
import { json, kv, kvPipe, kvReady } from "./_kv.js";

const MAX_FILE = 4 * 1024 * 1024;
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function POST(request) {
  if (!kvReady()) return json({ ok: false, error: "Baza nije spojena." }, 500);

  let fd;
  try { fd = await request.formData(); } catch { return json({ ok: false, error: "Neispravan zahtjev." }, 400); }
  const g = (k, max = 300) => String(fd.get(k) ?? "").trim().slice(0, max);

  if (g("web")) return json({ ok: true });            // zamka za botove
  const t = Number(g("t"));
  if (t && Date.now() - t < 2500) return json({ ok: true });

  const up = {
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    ime: g("ime", 120), firma: g("firma", 160), email: g("email", 200), telefon: g("telefon", 60),
    vrsta: g("vrsta", 120), rok: g("rok", 120), opis: g("opis", 6000),
    status: "novo", procitano: false, iznos: null, biljeske: "", odgovori: [],
    privitak_url: null, privitak_ime: null,
  };
  if (!up.ime || !EMAIL_RE.test(up.email) || !up.opis) return json({ ok: false, error: "Ispunite ime, ispravan e-mail i opis." }, 400);

  const f = fd.get("upload");
  if (f && typeof f === "object" && f.size > 0) {
    if (f.size <= MAX_FILE && process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const { put } = await import("@vercel/blob");
        const safe = (f.name || "privitak").normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^\w.\-]+/g, "_").slice(-80);
        const blob = await put(`upiti/${up.id}/${safe}`, f, { access: "public", addRandomSuffix: true, contentType: f.type || undefined });
        up.privitak_url = blob.url;
        up.privitak_ime = f.name || safe;
      } catch (e) { console.error("Privitak nije spremljen:", e.message); up.privitak_ime = (f.name || "privitak") + " (stiže na e-mail)"; }
    } else {
      up.privitak_ime = (f.name || "privitak") + " (stiže na e-mail)";
    }
  }

  try {
    await kvPipe([
      ["SET", `upit:${up.id}`, JSON.stringify(up)],
      ["ZADD", "upiti", String(Date.now()), up.id],
    ]);
    return json({ ok: true, id: up.id });
  } catch (e) {
    console.error("Upit nije spremljen:", e.message);
    return json({ ok: false, error: "Upit nije spremljen." }, 500);
  }
}
