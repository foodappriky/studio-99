# Studio 99 — panel za upite (jednostavna verzija)

Isto kao kod tvoje food aplikacije: na adresu stranice dodaš **#/upiti**, upišeš šifru i unutra si.
Primjer: `https://tvoja-stranica.vercel.app/#/upiti`

Kad netko pošalje obrazac:

- upit se pojavi u panelu
- tebi stigne e-mail na studio99design.info@gmail.com
- klijent dobije automatsku potvrdu

U panelu vidiš sve upite, mijenjaš status, upisuješ iznos ponude i bilješke i zoveš klijenta jednim klikom. Gumb **Kopiraj za Claude** kopira upit da ga zalijepiš meni. Kad odgovaraš, gumb otvori Gmail s već napisanom porukom, a ti samo klikneš Pošalji.

## Postavljanje (oko 5 minuta)

1. **GitHub**: u repozitoriju klikni **Add file → Upload files**. Povuci **sve** iz ove mape: `index.html`, mapu `api`, `package.json`, `vercel.json`, `robots.txt`, `manifest.webmanifest`, `sw.js` i sve ikone (`favicon.svg`, `favicon.ico`, `favicon-16.png`, `favicon-32.png`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`). Klikni **Commit changes**.
   - Ako si već bio prebacio prošli paket, obriši iz repozitorija mapu `upiti`, datoteku `supabase.sql` i u mapi `api` datoteke `_lib.js`, `config.js` i `odgovor.js`. Ne trebaju.
2. **Vercel → tvoj projekt → Storage → Create Database → Upstash (Redis) → Free → Create**, pa **Connect** na ovaj projekt. Tu se čuvaju upiti.
3. **Isto mjesto: Storage → Create → Blob → Create**, pa **Connect**. Tu se čuvaju slike koje ti klijenti pošalju. Ovo je neobavezno: bez toga privitak i dalje stiže na mail.
4. **Settings → Environment Variables → Add**:
   - Name: `ADMIN_PIN`
   - Value: tvoja šifra, npr. `2532` (6 znamenki je sigurnije)
   - Klikni **Save**.
5. **Deployments** → zadnja objava → **⋯ → Redeploy**.

## Provjera

1. Pošalji probni upit sa stranice.
2. Ako ti FormSubmit prije nije poslao mail "Activate Form", sad će. Klikni ga jednom i od tada mailovi stižu.
3. Otvori `tvoja-stranica.vercel.app/#/upiti`, upiši šifru i probni upit treba biti tamo.

## Dobro je znati

- Nakon 5 krivih šifri panel se zaključa na 15 minuta. Tako nitko ne može pogađati šifru.
- Ako uključiš "Zapamti na ovom uređaju", šifru upisuješ samo prvi put. **Izađi** je briše s tog uređaja.
- Šifru mijenjaš u Vercelu (`ADMIN_PIN`) pa napraviš Redeploy.

## Ikona i spremanje na zaslon

Stranica u kartici preglednika ima tvoj logo. Može se spremiti kao aplikacija s istim logom:

- **Računalo (Chrome ili Edge)**: u adresnoj traci desno klikni ikonu "Instaliraj" (ekran sa strelicom), ili izbornik **⋮ → Spremi i dijeli → Instaliraj stranicu kao aplikaciju**. U panelu `#/upiti` se pojavi i gumb **Dodaj na zaslon**.
- **Android (Chrome)**: izbornik **⋮ → Dodaj na početni zaslon** ili **Instaliraj aplikaciju**.
- **iPhone (Safari)**: tipka **Dijeli** (kvadrat sa strelicom) → **Dodaj na početni zaslon**.

Ako želiš da ti ikona odmah otvara panel s upitima: otvori `tvoja-stranica.vercel.app/#/upiti`, pa tek onda dodaj na početni zaslon (na iPhoneu). Na računalu i Androidu: desni klik ili dugi pritisak na instaliranu ikonu → **Upiti**.

Ako ti se odmah ne pokaže novi logo u kartici, preglednik pamti staru ikonu. Osvježi stranicu s Ctrl+Shift+R ili pričekaj dan.
