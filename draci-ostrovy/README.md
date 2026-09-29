# Dračí ostrovy

Vzdělávací hra pro děti na 1. stupni ZŠ ve světě Vikingů a draků. Hráčka si vylíhne vlastního draka, který se učí spolu s ní, a létá po sedmi ostrovech, z nichž každý rozvíjí jinou oblast: čísla, slova, lidské tělo, svět a přírodu, logiku a kritické myšlení (Ostrov záhad), finanční gramotnost (Vikingský trh) a algoritmy, data a umělou inteligenci (Vynálezecká dílna).

Aplikace je samostatná vedle původní hry v kořeni repozitáře. Na GitHub Pages se nenasazuje – běží na Railway za přihlášením rodinným kódem.

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
- Proměnné: `ACCESS_CODE` (rodinný kód – bez něj server nenastartuje) a `SESSION_SECRET` (náhodný řetězec pro podpis přihlášení). Změna kterékoli z nich odhlásí všechna zařízení.
- `server.mjs` je bez závislostí: kdo nezná kód, uvidí jen přihlašovací stránku. Přihlášení platí na zařízení 400 dní, po deseti chybných pokusech z jedné adresy se přihlašování na čtvrt hodiny zablokuje. Vyhledávače mají přístup zakázaný (`noindex`, `robots.txt`).
- Server nic neukládá; data hry zůstávají v prohlížeči.

## Jak to funguje

- **Úlohy** generují dovednosti (`SkillDef`) v `src/content/<ostrov>/`. Každá úloha nese úroveň L1–L6 (L1–L5 = očekávání RVP ZV 2021 pro 1.–5. ročník, L6 = nad rámec 1. stupně), kódy RVP, typ myšlení a případně příznak, že se formát podobá subtestu inteligence (`testLike`). Ostrovy druhé fáze skládají dovednosti z bank ručně psaných otázek a generátorů (`src/core/bank.ts`).
- **Typy odpovědí:** výběr, číslo, klepnutí na mapu těla, skládání slova, odhad na ose, otevřená odpověď, **program letu** (šipky, drak letí po mřížce – `src/core/grid.ts` počítá let i nejkratší cestu pro hru, testy i ukázku řešení) a **seřazení**. Vizuály navíc: mapa s růžicí a legendou, karty, sloupcový graf, postup a tabulka (sudoku, matice, šifry).
- **Kniha draků** (`src/ui/screens/Book.tsx`): kousky draka a dračí druhy, karty znalostí, které se odemykají s dosaženým stupněm dovednosti (některé jako „opravené stránky“: co se dřív tradovalo a jak se přišlo na pravdu), společné mise a vlastní výtvory.
- **Společné mise s rodičem:** krátké úkoly do skutečného světa (tep po skákání, nákup s kontrolou vrácených peněz, měsíční deník…). Dítě si je odškrtne, rodič vidí tipy a splněné mise ve své části a v portfoliu.
- **Adaptivní model** (`src/core/model.ts`) je Elo s mírou nejistoty pro každou dovednost. Plánovač (`src/core/planner.ts`) vybírá úlohy s cílovou úspěšností kolem 70–85 % a skládá „Dnešní let“ ze tří misí.
- **Odměny** nejsou měna za správné odpovědi: drak se učí nové kousky při zvládnutí vyššího stupně, přibývají dračí druhy a zápisy v deníku. Bez žebříčků, časovačů a sérií s trestem.
- **Rodičovský radar** (`src/core/radar.ts`, `src/ui/parent/`) za PINem ukazuje orientační signály podle Renzulliho tří kruhů a sebedůvěry – bez IQ a bez srovnání s jinými dětmi – a přehled trénovaných testových formátů.
- **Data** zůstávají jen v zařízení (localStorage + IndexedDB). Nic se neodesílá a hra nenačítá nic z cizích serverů – i písma (Nunito a Baloo 2, licence SIL OFL 1.1, balíčky `@fontsource`) jsou přibalená v `src/styles/fonts.css`.

## Pravidla pro obsah

- Bezchybná čeština, přiměřená věku, vlídný tón bez strašidelných témat.
- Žádná jména ani pojmy z filmů a knih o dracích a žádné osobní údaje dítěte (repozitář je veřejný). Jméno draka si hráčka zadá sama a uloží se jen v zařízení.
- Každá úloha má právě jednu správnou odpověď, postupné nápovědy, které neprozrazují výsledek, a vysvětlení. Kontroluje to `tests/validate.ts` (včetně řešitelnosti letů, platnosti vizuálů, karet a misí).
