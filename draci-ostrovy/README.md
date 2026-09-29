# Dračí ostrovy

Vzdělávací hra pro děti na 1. stupni ZŠ ve světě Vikingů a draků. Hráčka si vylíhne vlastního draka, který se učí spolu s ní, a létá po ostrovech, z nichž každý rozvíjí jinou oblast (čísla, slova, lidské tělo, později svět, logika, finance a digitální svět).

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

- Služba s kořenovým adresářem `draci-ostrovy`, konfigurace v `railway.json` (sestavení `npm run build`, spuštění `node server.mjs`, kontrola `/zdravi`).
- Proměnné: `ACCESS_CODE` (rodinný kód – bez něj server nenastartuje) a `SESSION_SECRET` (náhodný řetězec pro podpis přihlášení). Změna kterékoli z nich odhlásí všechna zařízení.
- `server.mjs` je bez závislostí: kdo nezná kód, uvidí jen přihlašovací stránku. Přihlášení platí na zařízení 400 dní, po deseti chybných pokusech z jedné adresy se přihlašování na čtvrt hodiny zablokuje. Vyhledávače mají přístup zakázaný (`noindex`, `robots.txt`).
- Server nic neukládá; data hry zůstávají v prohlížeči.

## Jak to funguje

- **Úlohy** generují dovednosti (`SkillDef`) v `src/content/<ostrov>/`. Každá úloha nese úroveň L1–L6 (L1–L5 = očekávání RVP ZV 2021 pro 1.–5. ročník, L6 = nad rámec 1. stupně), kódy RVP, typ myšlení a případně příznak, že se formát podobá subtestu inteligence (`testLike`).
- **Adaptivní model** (`src/core/model.ts`) je Elo s mírou nejistoty pro každou dovednost. Plánovač (`src/core/planner.ts`) vybírá úlohy s cílovou úspěšností kolem 70–85 % a skládá „Dnešní let“ ze tří misí.
- **Odměny** nejsou měna za správné odpovědi: drak se učí nové kousky při zvládnutí vyššího stupně, přibývají dračí druhy a zápisy v deníku. Bez žebříčků, časovačů a sérií s trestem.
- **Rodičovský radar** (`src/core/radar.ts`, `src/ui/parent/`) za PINem ukazuje orientační signály podle Renzulliho tří kruhů a sebedůvěry – bez IQ a bez srovnání s jinými dětmi – a přehled trénovaných testových formátů.
- **Data** zůstávají jen v zařízení (localStorage + IndexedDB). Nic se neodesílá a hra nenačítá nic z cizích serverů – i písma (Nunito a Baloo 2, licence SIL OFL 1.1, balíčky `@fontsource`) jsou přibalená v `src/styles/fonts.css`.

## Pravidla pro obsah

- Bezchybná čeština, přiměřená věku, vlídný tón bez strašidelných témat.
- Žádná jména ani pojmy z filmů a knih o dracích a žádné osobní údaje dítěte (repozitář je veřejný). Jméno draka si hráčka zadá sama a uloží se jen v zařízení.
- Každá úloha má právě jednu správnou odpověď, postupné nápovědy, které neprozrazují výsledek, a vysvětlení. Kontroluje to `tests/validate.ts`.
