# Dračí ostrovy

Vzdělávací hra pro děti na 1. stupni ZŠ ve světě Vikingů a draků. Dítě si vylíhne vlastního draka, který se učí spolu s ním, a létá po osmi ostrovech, z nichž každý rozvíjí jinou oblast: čísla, slova, lidské tělo, svět a přírodu, logiku a kritické myšlení (Ostrov záhad), finanční gramotnost (Vikingský trh), algoritmy, data a umělou inteligenci (Vynálezecká dílna) a elektrické obvody (Ostrov blesků).

Aplikace je samostatná vedle původní hry v kořeni repozitáře. Na GitHub Pages se nenasazuje – běží na Railway za přihlášením přístupovým kódem.

## Spuštění

```bash
npm ci
npm run dev      # vývojový server na http://localhost:3100/
npm test         # testy úloh, adaptivního modelu, radaru a serveru
npm run build    # sestavení do dist/
ACCESS_CODE=... npm start   # server s přihlášením (server.mjs) nad dist/
```

## Nasazení (Railway)

- Služba v Railway (projekt `draci-ostrovy`) má nastavené: kořenový adresář `/draci-ostrovy`, sestavení `npm run build`, spuštění `node server.mjs`, kontrolu zdraví `/zdravi` a sledované cesty `/draci-ostrovy/**`.
- Proměnné: `ACCESS_CODE` (rodinný kód – bez něj server nenastartuje), `GUEST_CODES` (nepovinné další kódy oddělené čárkou, např. pro kamarády nebo do příspěvku) a `SESSION_SECRET` (náhodný řetězec pro podpis přihlášení). Každý kód má vlastní cookie: odebraný kód z `GUEST_CODES` odhlásí jen zařízení přihlášená jím. Změna `ACCESS_CODE` odhlásí rodinu, změna `SESSION_SECRET` všechny.
- Mluvení na Školním ostrově (nepovinné): `AZURE_SPEECH_KEY` (klíč prostředku Azure Speech) a `AZURE_SPEECH_REGION` (např. `westeurope`), případně místo oblasti `AZURE_SPEECH_ENDPOINT` (`https://<název>.cognitiveservices.azure.com`). Bez klíče je mluvení vypnuté a hra ho nenabízí. Nahrávku z mikrofonu (WAV 16 kHz, nejvýš ~30 s) server pošle do Azure k přepisu (americká angličtina; u opakování vět i s hodnocením výslovnosti) a vrátí jen text a skóre; nikde se neukládá. Mluvení má jen rodinný kód – hlas hostů s `GUEST_CODES` se nikam neposílá. Pojistka: nejvýš 300 nahrávek za hodinu (bezplatný tarif F0 má 5 hodin přepisu měsíčně).
- `server.mjs` je bez závislostí: kdo nezná kód, uvidí jen přihlašovací stránku. Přihlášení platí na zařízení 400 dní, po deseti chybných pokusech z jedné adresy se přihlašování na čtvrt hodiny zablokuje. Vyhledávače mají přístup zakázaný (`noindex`, `robots.txt`).
- Server nic neukládá; data hry zůstávají v prohlížeči.

## Jak to funguje

- **Úlohy** generují dovednosti (`SkillDef`) v `src/content/<ostrov>/`. Každá úloha nese úroveň L1–L6 (L1–L5 = očekávání RVP ZV 2021 pro 1.–5. ročník, L6 = nad rámec 1. stupně), kódy RVP, typ myšlení a případně příznak, že se formát podobá subtestu inteligence (`testLike`). Ostrovy druhé fáze skládají dovednosti z bank ručně psaných otázek a generátorů (`src/core/bank.ts`).
- **Typy odpovědí:** výběr (i barevné vzorky), číslo, klepnutí na mapu těla, skládání slova, psaní slova na klávesnici a–z, odhad na ose, otevřená odpověď, **program letu** (šipky, drak letí po mřížce – `src/core/grid.ts` počítá let i nejkratší cestu pro hru, testy i ukázku řešení) a **seřazení**. Vizuály navíc: mapa s růžicí a legendou, karty, sloupcový graf, postup a tabulka (sudoku, matice, šifry).
- **Kniha draků** (`src/ui/screens/Book.tsx`): kousky draka a dračí druhy, karty znalostí, které se odemykají s dosaženým stupněm dovednosti (některé jako „opravené stránky“: co se dřív tradovalo a jak se přišlo na pravdu), společné mise a vlastní výtvory.
- **Společné mise s rodičem:** krátké úkoly do skutečného světa (tep po skákání, nákup s kontrolou vrácených peněz, měsíční deník…). Dítě si je odškrtne, rodič vidí tipy a splněné mise ve své části a v portfoliu.
- **Adaptivní model** (`src/core/model.ts`) je Elo s mírou nejistoty pro každou dovednost. Plánovač (`src/core/planner.ts`) vybírá úlohy s cílovou úspěšností kolem 70–85 % a skládá „Dnešní let“ ze tří misí.
- **Odměny** nejsou měna za správné odpovědi: drak se učí nové kousky při zvládnutí vyššího stupně, přibývají dračí druhy a zápisy v deníku. Bez žebříčků, časovačů a sérií s trestem.
- **Hráči:** na jednom zařízení může hrát víc dětí („Kdo hraje?“). Úvodní nastavení vyplní rodič: jméno, oslovení (holka/kluk), třídu a rodičovský PIN. Texty obsahují značky `{ženský|mužský}` (`src/core/gender.ts`), validace kontroluje obě varianty.
- **Zajímavosti:** u znalostních dovedností (`showFact`) se vysvětlení ukáže i po správné odpovědi napoprvé.
- **Ostrov blesků** (`src/content/blesky/`, výpočet v `src/core/circuit.ts`): elektrické obvody s baterkou, žárovkami a vypínači. Obvod je strom částí za sebou a vedle sebe; žárovka svítí, když jí teče proud (drát vedle ní ji přemostí, mezera, vypnutý vypínač nebo izolant kruh přeruší). Dovednosti: *Rozsvítí se?* (čtení obvodu, zapojení za sebou a vedle sebe, zkrat), *Vede, nebo nevede?* (vodiče, izolanty a bezpečnost: baterka ano, zásuvka ne, bouřka, baterie do sběru), *Vypínače* (hráčka přepne vypínače a pustí proud – svítit má přesně to, co chce drak) a *Spoj dráty* (otáčení dílků, aby proud oběhl z baterky přes žárovky). Test `tests/blesky.test.ts` přepočítává obvody nezávisle Kirchhoffovými zákony.
- **Školní ostrov** (`src/content/skola/`) je ostrov „na přání“: vidí ho jen hráč, kterému ho rodič zapne v Nastavení, a v Dnešním letu je pak první mise anglická. Obsah je angličtina podle aktuálního školního učiva a příprava navíc na dětskou zkoušku Cambridge Pre A1 Starters: slovíčka (poslech a „jak se to řekne“), spelling (skládání z písmen, psaní podle hláskování a diktátu na klávesnici a–z), anglická abeceda, I / me / my / I am, in / on / under / next to, this / these, There is / are a otázky s odpověďmi. Angličtina je americká (škola učí americkou angličtinu; britské tvary jako grey nebo rubber se při psaní uznají také); po odpovědi si dítě může správné slovo poslechnout. Angličtinu čte **nahraný hlas Miss Ember** (`public/hlas`, MP3 + `index.json`): zní na každém zařízení stejně, pomalu a písmena čte jako jejich názvy (a = ej, i = aj, z = zí). Hláskování jde po písmenech s pauzou; psaní má prázdná okénka podle počtu písmen. Co nahrané není, přečte hlas zařízení. Nahrávky vyrábí `scripts/hlas/` (seznam promluv `texty.ts`, nahrávání `nahraj.py` s modelem Kokoro-82M, licence Apache 2.0); po změně anglického obsahu je doplňte – test `tests/skola.test.ts` ohlásí, co chybí. V Nastavení je tlačítko na vyzkoušení hlasu. Dovednost **Mluvení s Miss Ember**: dítě odpovídá nahlas celou větou (How old are you? – I’m seven.) nebo opakuje věty s I / me / I am. Hodnotí rodič – v Nastavení přepínač **Mluvení se mnou** (tlačítka „Řekla to dobře“ / „Ještě ne“, správná odpověď je pro rodiče schovaná pod rozbalením, mikrofon se nepoužívá). Volitelně ji může hodnotit i hra přes rozpoznávání řeči (viz Azure výše); pak pozná, jestli dítěti bylo rozumět, a u typické chyby („Me seven.“) poradí. Vzory odpovědí viz `src/core/saymatch.ts`. Bez obojího se mluvení nehraje; když rozpoznávání vypadne (výpadek, mikrofon), úlohu nahradí Otázky a odpovědi. **Obměna učiva:** nová lekce = nová slova v `ucivo.ts` s vlastním `unit` a její zápis do `CURRENT_UNITS` (na test se procvičuje častěji); starší lekce zůstávají na opakování. Do přehledu podle ročníků se ostrov nepočítá, rodič ho vidí zvlášť.
- **Přehled pro rodiče** (`src/core/radar.ts`, `src/ui/parent/`) za PINem ukazuje orientační signály podle Renzulliho tří kruhů a sebedůvěry – bez IQ a bez srovnání s jinými dětmi – a přehled úloh podobných testům, které lze vynechat. **Ukázka** (`src/core/demo.ts`) naplní přehled smyšleným dítětem, aby rodič viděl, co ho čeká.
- **Data** zůstávají jen v zařízení (localStorage + IndexedDB). Nic se neodesílá (jedinou výjimkou je zapnuté mluvení, viz výše) a hra nenačítá nic z cizích serverů – i písma (Nunito a Baloo 2, licence SIL OFL 1.1, balíčky `@fontsource`) jsou přibalená v `src/styles/fonts.css`.

## Pravidla pro obsah

- Bezchybná čeština, přiměřená věku, vlídný tón bez strašidelných témat.
- Žádná jména ani pojmy z filmů a knih o dracích a žádné osobní údaje dítěte (repozitář je veřejný). Jméno dítěte i draka se uloží jen v zařízení.
- Oslovení hráče vždy se značkou `{ženský|mužský}`; vysvětlení musí navazovat na otázku (žádné nesouvisející informace).
- Každá úloha má právě jednu správnou odpověď, postupné nápovědy, které neprozrazují výsledek, a vysvětlení. Kontroluje to `tests/validate.ts` (včetně řešitelnosti letů, platnosti vizuálů, karet a misí).
